import { useRef, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

const FALLBACK_DURATION = 30
const HERO_VH = 400

function useScrollProgress(sectionRef) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let ticking = false
    let rafId = null

    const compute = () => {
      ticking = false
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const sectionHeight = sectionRef.current.offsetHeight - window.innerHeight
      const scrolled = -rect.top
      setProgress(Math.min(1, Math.max(0, scrolled / sectionHeight)))
    }

    const onScroll = () => {
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

function OverlayText({ visible, children }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="bg-dark/40 backdrop-blur-xs rounded-2xl px-10 py-6 max-w-xl text-center">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DownArrow() {
  return (
    <motion.svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M12 5v14M5 12l7 7 7-7" />
    </motion.svg>
  )
}

function ProgressBar({ progress }) {
  return (
    <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 h-40 w-1 rounded-full bg-white/20 z-20">
      <motion.div
        className="w-full rounded-full bg-white/80"
        style={{ height: `${progress * 100}%` }}
        transition={{ duration: 0.1 }}
      />
    </div>
  )
}

export default function Hero() {
  const { t, i18n } = useTranslation()
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const primedRef = useRef(false)
  const preloadedRef = useRef(false)
  const preloadingRef = useRef(false)
  const progressRef = useRef(0)
  const lastProgressRef = useRef(0)
  const scrollingRef = useRef(false)
  const scrollIdleTimerRef = useRef(null)
  const progress = useScrollProgress(sectionRef)
  const [ready, setReady] = useState(false)
  const [duration, setDuration] = useState(FALLBACK_DURATION)

  const isArabic = i18n.language === 'ar'
  const fontClass = isArabic ? 'font-kufi' : 'font-playfair'

  useEffect(() => {
    progressRef.current = progress
    scrollingRef.current = true
    if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current)
    scrollIdleTimerRef.current = setTimeout(() => {
      scrollingRef.current = false
    }, 150)
  }, [progress])

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !ready) return

    const ctx = canvas.getContext('2d', { alpha: false })
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
      // Lower internal resolution while the user is actively scrolling,
      // restore on idle. Cuts GPU bandwidth during fast scrubs.
      const wantScale = scrollingRef.current ? 0.75 : 1
      if (wantScale !== lastScale) {
        lastScale = wantScale
        resizeCanvas(wantScale)
      }

      // Paint the most recently decoded frame every tick — keeps the
      // canvas current even while the next seek is in flight.
      if (video.readyState >= 2) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        } catch {
          // ignore — frame not yet decodable
        }
      }

      // Drive seek from scroll position, with a small velocity-based
      // look-ahead. Coefficient is kept small so direction reversals
      // don't overshoot meaningfully past the seek tolerance.
      if (!seeking && !preloadingRef.current) {
        const current = progressRef.current
        const velocity = current - lastProgressRef.current
        const predicted = Math.min(1, Math.max(0, current + velocity * 0.2))
        const target = predicted * duration
        if (Math.abs(video.currentTime - target) > 0.03) {
          try {
            if (typeof video.fastSeek === 'function') {
              video.fastSeek(target)
            } else {
              video.currentTime = target
            }
          } catch {
            // ignore — video may not be seekable yet
          }
        }
        lastProgressRef.current = current
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      video.removeEventListener('seeking', onSeeking)
      video.removeEventListener('seeked', onSeeked)
    }
  }, [ready, duration])

  const primeVideo = useCallback(() => {
    const video = videoRef.current
    if (!video || primedRef.current) return
    primedRef.current = true
    const playPromise = video.play()
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          video.pause()
        })
        .catch(() => {
          primedRef.current = false
          // Autoplay blocked — wait for a user gesture
          const unlock = () => {
            if (primedRef.current) return
            primedRef.current = true
            video.play().then(() => video.pause()).catch(() => {
              primedRef.current = false
            })
            window.removeEventListener('touchstart', unlock)
            window.removeEventListener('click', unlock)
          }
          window.addEventListener('touchstart', unlock, { once: true, passive: true })
          window.addEventListener('click', unlock, { once: true })
        })
    }
  }, [])

  const preloadFrames = useCallback(async () => {
    const video = videoRef.current
    if (!video || preloadedRef.current) return
    if (!Number.isFinite(video.duration) || video.duration <= 0) return
    preloadedRef.current = true
    preloadingRef.current = true
    const steps = 60
    for (let i = 0; i <= steps; i++) {
      try {
        const t = (i / steps) * video.duration
        if (typeof video.fastSeek === 'function') {
          video.fastSeek(t)
        } else {
          video.currentTime = t
        }
      } catch {
        // ignore
      }
      await new Promise((r) => setTimeout(r, 16))
    }
    preloadingRef.current = false
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

  const isVisible = (start, end) => progress >= start && progress <= end

  return (
    <section ref={sectionRef} className="relative" style={{ height: `${HERO_VH}vh` }}>
      <div
        className="sticky top-0 h-screen w-full overflow-hidden bg-dark"
        style={{ willChange: 'transform', transform: 'translateZ(0)' }}
      >
        <video
          ref={videoRef}
          src="/Lufara/videos/lufara_combined.mp4"
          muted
          playsInline
          autoPlay
          loop={false}
          preload="auto"
          onLoadedMetadata={handleMetadata}
          onLoadedData={handleMetadata}
          onCanPlay={primeVideo}
          onCanPlayThrough={preloadFrames}
          className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
        />
        <canvas
          ref={canvasRef}
          style={{ willChange: 'transform', transform: 'translateZ(0)' }}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-dark/20" />

        <OverlayText visible={isVisible(0, 0.15)}>
          <h1 className="font-playfair text-4xl md:text-6xl font-bold text-white mb-3">
            Lufara
          </h1>
          <p className={`${fontClass} text-lg md:text-xl text-white/90`}>
            {t('tagline')}
          </p>
        </OverlayText>

        <OverlayText visible={isVisible(0.2, 0.4)}>
          <p className={`${fontClass} text-2xl md:text-4xl font-semibold text-white`}>
            {t('hero.from_earth')}
          </p>
        </OverlayText>

        <OverlayText visible={isVisible(0.45, 0.65)}>
          <p className={`${fontClass} text-2xl md:text-4xl font-semibold text-white`}>
            {t('hero.natural')}
          </p>
        </OverlayText>

        <OverlayText visible={isVisible(0.7, 0.85)}>
          <p className={`${fontClass} text-2xl md:text-4xl font-semibold text-white`}>
            {t('hero.experience')}
          </p>
        </OverlayText>

        <OverlayText visible={isVisible(0.9, 1)}>
          <DownArrow />
        </OverlayText>

        <ProgressBar progress={progress} />
      </div>
    </section>
  )
}
