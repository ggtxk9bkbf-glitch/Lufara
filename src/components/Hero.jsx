import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getLenis } from '../lib/lenisInstance'

const SEGMENT_SECONDS = 10
const TOTAL_SEGMENTS = 3
const STEP_DEBOUNCE_MS = 250

const OVERLAYS = {
  1: 'من الأرض / De la tierra',
  2: 'طبيعي 100% / 100% Natural',
  3: 'Lufara — Natural desde la semilla',
}

function OverlayText({ visible, children }) {
  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none px-6"
        >
          <div className="bg-dark/40 backdrop-blur-xs rounded-2xl px-8 py-5 max-w-2xl text-center">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SegmentDots({ active, total, onJump, hidden }) {
  return (
    <div
      className={`absolute end-4 md:end-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20 transition-opacity duration-300 ${
        hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const filled = active >= i + 1
        return (
          <button
            key={i}
            type="button"
            aria-label={`Jump to segment ${i + 1}`}
            onClick={() => onJump(i + 1)}
            className="group p-2 cursor-pointer"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                filled
                  ? 'bg-cream w-3 h-3'
                  : 'bg-cream/30 w-2 h-2 group-hover:bg-cream/60'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}

export default function Hero() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const primedRef = useRef(false)
  const lockedRef = useRef(false)
  const completedRef = useRef(false)
  const segmentRef = useRef(0)
  const [segment, setSegment] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [ready, setReady] = useState(false)

  // Paint loop — draw whatever frame the video has decoded onto the canvas.
  useEffect(() => {
    if (!ready) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.max(1, Math.round((video.videoWidth || 1280) * dpr))
    canvas.height = Math.max(1, Math.round((video.videoHeight || 720) * dpr))

    let raf = null
    const loop = () => {
      if (video.readyState >= 2) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        } catch {
          // frame not ready
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { if (raf) cancelAnimationFrame(raf) }
  }, [ready])

  const unlockPage = useCallback(() => {
    completedRef.current = true
    setCompleted(true)
    const lenis = getLenis()
    if (lenis) lenis.start()
    document.body.style.overflow = ''
  }, [])

  const stepForward = useCallback(() => {
    const video = videoRef.current
    if (!video || lockedRef.current || completedRef.current) return
    const current = segmentRef.current
    if (current >= TOTAL_SEGMENTS) return
    const startTime = current * SEGMENT_SECONDS
    const endTime = (current + 1) * SEGMENT_SECONDS
    lockedRef.current = true

    try {
      video.currentTime = startTime
    } catch {
      // ignore
    }

    const onTimeUpdate = () => {
      if (video.currentTime >= endTime - 0.04) {
        video.removeEventListener('timeupdate', onTimeUpdate)
        try {
          video.pause()
          video.currentTime = endTime
        } catch {
          // ignore
        }
        const next = current + 1
        segmentRef.current = next
        setSegment(next)
        if (next >= TOTAL_SEGMENTS) unlockPage()
        setTimeout(() => { lockedRef.current = false }, STEP_DEBOUNCE_MS)
      }
    }
    video.addEventListener('timeupdate', onTimeUpdate)

    const playPromise = video.play()
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {
        // Autoplay rejected — snap to the segment end and continue.
        video.removeEventListener('timeupdate', onTimeUpdate)
        try {
          video.currentTime = endTime
        } catch {
          // ignore
        }
        const next = current + 1
        segmentRef.current = next
        setSegment(next)
        if (next >= TOTAL_SEGMENTS) unlockPage()
        setTimeout(() => { lockedRef.current = false }, STEP_DEBOUNCE_MS)
      })
    }
  }, [unlockPage])

  const stepBackward = useCallback(() => {
    const video = videoRef.current
    if (!video || lockedRef.current) return
    const current = segmentRef.current
    if (current <= 0) return
    const prev = current - 1
    const startTime = prev * SEGMENT_SECONDS

    lockedRef.current = true
    // Update the dot indicator immediately so the UI tracks the input,
    // not the rewind animation.
    segmentRef.current = prev
    setSegment(prev)

    try {
      video.pause()
    } catch {
      // ignore
    }

    let t = video.currentTime
    const reverseInterval = setInterval(() => {
      t -= 0.3
      if (t <= startTime) {
        try {
          video.currentTime = startTime
        } catch {
          // ignore
        }
        clearInterval(reverseInterval)
        setTimeout(() => { lockedRef.current = false }, STEP_DEBOUNCE_MS)
      } else {
        try {
          video.currentTime = t
        } catch {
          // ignore
        }
      }
    }, 16)
  }, [])

  const jumpTo = useCallback((target) => {
    const video = videoRef.current
    if (!video || lockedRef.current) return
    const clamped = Math.min(TOTAL_SEGMENTS, Math.max(0, target))
    if (clamped === segmentRef.current) return
    lockedRef.current = true
    try {
      video.pause()
      video.currentTime = clamped * SEGMENT_SECONDS
    } catch {
      // ignore
    }
    segmentRef.current = clamped
    setSegment(clamped)
    if (clamped >= TOTAL_SEGMENTS) unlockPage()
    setTimeout(() => { lockedRef.current = false }, STEP_DEBOUNCE_MS)
  }, [unlockPage])

  // Lock page scroll while stepping; wire wheel/touch/keyboard.
  useEffect(() => {
    if (!ready) return
    const lenis = getLenis()
    if (lenis) lenis.stop()
    document.body.style.overflow = 'hidden'

    let touchStartY = 0
    const onWheel = (e) => {
      if (completedRef.current) return
      e.preventDefault()
      if (lockedRef.current) return
      if (e.deltaY > 5) stepForward()
      else if (e.deltaY < -5) stepBackward()
    }
    const onTouchStart = (e) => { touchStartY = e.touches[0].clientY }
    const onTouchEnd = (e) => {
      if (completedRef.current) return
      const dy = touchStartY - e.changedTouches[0].clientY
      if (Math.abs(dy) < 50) return
      if (dy > 0) stepForward()
      else stepBackward()
    }
    const onKey = (e) => {
      if (completedRef.current) return
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        stepForward()
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        stepBackward()
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKey)
      if (!completedRef.current) {
        const l = getLenis()
        if (l) l.start()
        document.body.style.overflow = ''
      }
    }
  }, [ready, stepForward, stepBackward])

  // iOS needs play() called at least once before currentTime seeks paint.
  const primeVideo = useCallback(() => {
    const video = videoRef.current
    if (!video || primedRef.current) return
    primedRef.current = true
    const playPromise = video.play()
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          video.pause()
          video.currentTime = 0
        })
        .catch(() => {
          primedRef.current = false
        })
    }
  }, [])

  const handleMetadata = () => {
    setReady(true)
    primeVideo()
  }

  return (
    <section className="relative h-screen w-full">
      <div
        className="relative h-screen w-full overflow-hidden bg-dark"
        style={{ willChange: 'transform', transform: 'translateZ(0)' }}
      >
        <video
          ref={videoRef}
          src="/Lufara/videos/lufara_combined.mp4"
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

        <OverlayText visible={segment === 1}>
          <p className="font-kufi text-2xl md:text-4xl font-semibold text-white">
            {OVERLAYS[1]}
          </p>
        </OverlayText>

        <OverlayText visible={segment === 2}>
          <p className="font-kufi text-2xl md:text-4xl font-semibold text-white">
            {OVERLAYS[2]}
          </p>
        </OverlayText>

        <OverlayText visible={segment === 3}>
          <p className="font-playfair text-2xl md:text-4xl font-semibold text-white">
            {OVERLAYS[3]}
          </p>
        </OverlayText>

        <SegmentDots
          active={segment}
          total={TOTAL_SEGMENTS}
          onJump={jumpTo}
          hidden={completed}
        />
      </div>
    </section>
  )
}
