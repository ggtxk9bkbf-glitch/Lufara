import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const FALLBACK_DURATION = 30
const HERO_VH = 400
const VIDEO_URL = '/Lufara/videos/lufara_combined.mp4'
const SCROLL_DEADZONE_PX = 3
const SEEK_TOLERANCE = 0.05
const VELOCITY_LOOKAHEAD = 0.3

const OVERLAYS = [
  { upper: 0.34, text: 'من الأرض / De la tierra', font: 'font-kufi' },
  { upper: 0.67, text: 'طبيعي 100% / 100% Natural', font: 'font-kufi' },
  { upper: 1.01, text: 'Lufara — Natural desde la semilla', font: 'font-playfair' },
]

function useScrollProgress(sectionRef) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let ticking = false
    let rafId = null
    let lastY = window.scrollY

    const compute = () => {
      ticking = false
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const sectionHeight = sectionRef.current.offsetHeight - window.innerHeight
      const scrolled = -rect.top
      setProgress(Math.min(1, Math.max(0, scrolled / sectionHeight)))
    }

    const onScroll = () => {
      if (Math.abs(window.scrollY - lastY) < SCROLL_DEADZONE_PX) return
      lastY = window.scrollY
      if (ticking) return
      ticking = true
      rafId = requestAnimationFrame(compute)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    compute()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [sectionRef])

  return progress
}

function OverlayText({ idKey, font, text }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={idKey}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none px-6"
      >
        <div className="bg-dark/40 backdrop-blur-xs rounded-2xl px-8 py-5 max-w-2xl text-center">
          <p className={`${font} text-2xl md:text-4xl font-semibold text-white`}>
            {text}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Hero() {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const primedRef = useRef(false)
  const progressRef = useRef(0)
  const lastProgressRef = useRef(0)
  const progress = useScrollProgress(sectionRef)
  const [ready, setReady] = useState(false)
  const [duration, setDuration] = useState(FALLBACK_DURATION)

  useEffect(() => { progressRef.current = progress }, [progress])

  // Canvas paint + scroll-driven seek loop. One continuous rAF that:
  //   - paints the most recent decoded frame onto a 2D canvas every tick,
  //   - issues a fastSeek(predicted) when the live progress diverges from
  //     the current playback time by more than SEEK_TOLERANCE,
  //   - drops backing-store resolution while scrolling fast.
  useEffect(() => {
    if (!ready) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })

    let raf = null
    let seeking = false
    let lastScale = -1
    const onSeeking = () => { seeking = true }
    const onSeeked = () => { seeking = false }
    video.addEventListener('seeking', onSeeking)
    video.addEventListener('seeked', onSeeked)

    const resizeCanvas = (scale) => {
      const vw = video.videoWidth || 1280
      const vh = video.videoHeight || 720
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(vw * scale * dpr))
      canvas.height = Math.max(1, Math.round(vh * scale * dpr))
    }

    const loop = () => {
      const current = progressRef.current
      const velocity = current - lastProgressRef.current
      const absV = Math.abs(velocity)

      // Adaptive resolution: fast > moderate > idle.
      let wantScale = 1
      if (absV > 0.005) wantScale = 0.5
      else if (absV > 0.001) wantScale = 0.75
      if (wantScale !== lastScale) {
        lastScale = wantScale
        resizeCanvas(wantScale)
      }

      if (video.readyState >= 2) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        } catch {
          // frame not decodable yet
        }
      }

      if (!seeking) {
        const predicted = Math.min(1, Math.max(0, current + velocity * VELOCITY_LOOKAHEAD))
        const target = predicted * duration
        if (Math.abs(video.currentTime - target) > SEEK_TOLERANCE) {
          try {
            if (typeof video.fastSeek === 'function') video.fastSeek(target)
            else video.currentTime = target
          } catch {
            // ignore — not seekable yet
          }
        }
      }
      lastProgressRef.current = current
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      video.removeEventListener('seeking', onSeeking)
      video.removeEventListener('seeked', onSeeked)
    }
  }, [ready, duration])

  // Prime the decoder: play → pause → seek to 0. iOS Safari refuses to paint
  // frames from a video element via drawImage until play() has been called.
  const primeVideo = useCallback(async () => {
    const video = videoRef.current
    if (!video || primedRef.current) return
    primedRef.current = true
    try {
      await video.play()
      video.pause()
      video.currentTime = 0
    } catch {
      primedRef.current = false
      const unlock = () => {
        if (primedRef.current) return
        primedRef.current = true
        video.play()
          .then(() => { video.pause(); video.currentTime = 0 })
          .catch(() => { primedRef.current = false })
        window.removeEventListener('touchstart', unlock)
        window.removeEventListener('click', unlock)
      }
      window.addEventListener('touchstart', unlock, { once: true, passive: true })
      window.addEventListener('click', unlock, { once: true })
    }
  }, [])

  // Force the whole MP4 into the browser cache up-front so subsequent video
  // range requests served by the <video> element come from disk and seeks
  // land instantly.
  useEffect(() => {
    const ctrl = new AbortController()
    fetch(VIDEO_URL, { signal: ctrl.signal }).catch(() => {})
    return () => ctrl.abort()
  }, [])

  const handleMetadata = () => {
    const video = videoRef.current
    if (!video) return
    if (Number.isFinite(video.duration) && video.duration > 0) {
      setDuration(video.duration)
    }
    setReady(true)
    primeVideo()
  }

  // Pick the current overlay by progress bucket.
  const overlayIdx =
    progress < OVERLAYS[0].upper ? 0 : progress < OVERLAYS[1].upper ? 1 : 2
  const overlay = OVERLAYS[overlayIdx]

  return (
    <section ref={sectionRef} className="relative" style={{ height: `${HERO_VH}vh` }}>
      <div
        className="sticky top-0 h-screen w-full overflow-hidden bg-dark"
        style={{ willChange: 'transform', transform: 'translate3d(0,0,0)' }}
      >
        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={handleMetadata}
          onLoadedData={handleMetadata}
          className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
        />
        <motion.canvas
          ref={canvasRef}
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          style={{ willChange: 'transform', transform: 'translateZ(0)' }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-dark/25 pointer-events-none" />

        <OverlayText idKey={overlayIdx} font={overlay.font} text={overlay.text} />
      </div>
    </section>
  )
}
