import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { getLenis } from '../lib/lenisInstance'

const FALLBACK_DURATION = 30
const PARTICLE_COUNT = 20

// 6 anchor times → 5 segments between them. The user-facing "5 dots" maps
// to the 5 segment endpoints (anchors 1..5).
const SEGMENT_ANCHORS_REL = [0, 0.2, 0.4, 0.6, 0.8, 1.0]
const TOTAL_SEGMENTS = SEGMENT_ANCHORS_REL.length - 1 // 5

function OverlayText({ visible, children }) {
  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
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

function Particles({ progress }) {
  const particles = useMemo(() => {
    let seed = 1
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    return Array.from({ length: PARTICLE_COUNT }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      size: 3 + rand() * 6,
      speed: 1 + rand() * 0.4,
      delay: rand() * 2,
    }))
  }, [])

  const fade = Math.max(0, 1 - progress * 1.3)

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute rounded-full bg-cream"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: 0.3 * fade,
            transform: `translate3d(0, ${-progress * 220 * p.speed}px, 0)`,
            willChange: 'transform, opacity',
          }}
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 3 + p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}
    </div>
  )
}

function ParallaxBackground({ progress }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'radial-gradient(circle at 30% 20%, rgba(196,169,98,0.18), transparent 55%), radial-gradient(circle at 70% 80%, rgba(107,143,113,0.18), transparent 55%), #2C2C2C',
        transform: `translate3d(0, ${progress * 60}px, 0)`,
        willChange: 'transform',
      }}
    />
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

function ScrollHint() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: [0.4, 1, 0.4], y: [0, 6, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute bottom-10 inset-x-0 flex flex-col items-center gap-2 text-cream/80 pointer-events-none z-20"
    >
      <span className="font-kufi text-xs tracking-wider uppercase">scroll</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12l7 7 7-7" />
      </svg>
    </motion.div>
  )
}

export default function Hero() {
  const { t, i18n } = useTranslation()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const primedRef = useRef(false)
  const lockedRef = useRef(false)
  const completedRef = useRef(false)
  const segmentIdxRef = useRef(0)
  const [segmentIdx, setSegmentIdx] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [ready, setReady] = useState(false)
  const [duration, setDuration] = useState(FALLBACK_DURATION)

  const isArabic = i18n.language === 'ar'
  const fontClass = isArabic ? 'font-kufi' : 'font-playfair'

  const segments = useMemo(
    () => SEGMENT_ANCHORS_REL.map((p) => p * duration),
    [duration],
  )

  // Smooth progress for parallax — derived from segment index, not scroll.
  const parallaxProgress = segmentIdx / TOTAL_SEGMENTS

  // --- Canvas paint loop (draws whatever frame the video has) -----------
  useEffect(() => {
    if (!ready) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    let raf = null

    const resizeCanvas = () => {
      const vw = video.videoWidth || 1280
      const vh = video.videoHeight || 720
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(vw * dpr))
      canvas.height = Math.max(1, Math.round(vh * dpr))
    }
    resizeCanvas()

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

    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ready])

  // --- Step controls ----------------------------------------------------
  const finishStep = useCallback((nextIdx) => {
    segmentIdxRef.current = nextIdx
    setSegmentIdx(nextIdx)
    if (nextIdx >= TOTAL_SEGMENTS) {
      completedRef.current = true
      setCompleted(true)
      // Unlock page scroll so the next wheel/touch drives Product into view.
      const lenis = getLenis()
      if (lenis) lenis.start()
      document.body.style.overflow = ''
    }
    // Debounce so a single wheel inertia burst doesn't fire multiple steps.
    setTimeout(() => {
      lockedRef.current = false
    }, 250)
  }, [])

  const stepForward = useCallback(() => {
    const video = videoRef.current
    if (!video || lockedRef.current || completedRef.current) return
    const current = segmentIdxRef.current
    if (current >= TOTAL_SEGMENTS) return
    const nextIdx = current + 1
    const endTime = segments[nextIdx]
    lockedRef.current = true

    const onTimeUpdate = () => {
      if (video.currentTime >= endTime - 0.04) {
        video.removeEventListener('timeupdate', onTimeUpdate)
        try {
          video.pause()
          video.currentTime = endTime
        } catch {
          // ignore
        }
        finishStep(nextIdx)
      }
    }
    video.addEventListener('timeupdate', onTimeUpdate)

    const playPromise = video.play()
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {
        // Autoplay was blocked — fall back to a snap seek.
        video.removeEventListener('timeupdate', onTimeUpdate)
        try {
          video.currentTime = endTime
        } catch {
          // ignore
        }
        finishStep(nextIdx)
      })
    }
  }, [segments, finishStep])

  const stepBackward = useCallback(() => {
    const video = videoRef.current
    if (!video || lockedRef.current) return
    const current = segmentIdxRef.current
    if (current <= 0) return
    const prevIdx = current - 1
    lockedRef.current = true
    try {
      video.pause()
      video.currentTime = segments[prevIdx]
    } catch {
      // ignore
    }
    segmentIdxRef.current = prevIdx
    setSegmentIdx(prevIdx)
    setTimeout(() => {
      lockedRef.current = false
    }, 200)
  }, [segments])

  const jumpTo = useCallback(
    (idx) => {
      const video = videoRef.current
      if (!video || lockedRef.current) return
      const clamped = Math.min(TOTAL_SEGMENTS, Math.max(0, idx))
      if (clamped === segmentIdxRef.current) return
      lockedRef.current = true
      try {
        video.pause()
        video.currentTime = segments[clamped]
      } catch {
        // ignore
      }
      segmentIdxRef.current = clamped
      setSegmentIdx(clamped)
      if (clamped >= TOTAL_SEGMENTS) {
        completedRef.current = true
        setCompleted(true)
        const lenis = getLenis()
        if (lenis) lenis.start()
        document.body.style.overflow = ''
      }
      setTimeout(() => {
        lockedRef.current = false
      }, 200)
    },
    [segments],
  )

  // --- Scroll lock + wheel/touch handlers -------------------------------
  useEffect(() => {
    if (!ready) return

    // Lock global scroll while we're driving the hero.
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

    const onTouchStart = (e) => {
      touchStartY = e.touches[0].clientY
    }

    const onTouchEnd = (e) => {
      if (completedRef.current) return
      const deltaY = touchStartY - e.changedTouches[0].clientY
      if (Math.abs(deltaY) < 50) return
      if (deltaY > 0) stepForward()
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
      // If the user navigates away mid-flow, restore page scroll.
      if (!completedRef.current) {
        const l = getLenis()
        if (l) l.start()
        document.body.style.overflow = ''
      }
    }
  }, [ready, stepForward, stepBackward])

  // --- Priming + metadata ----------------------------------------------
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
          // Will retry on first user gesture via wheel/touch handlers.
        })
    }
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

  return (
    <section className="relative h-screen w-full">
      <div
        className="relative h-screen w-full overflow-hidden bg-dark"
        style={{ willChange: 'transform', transform: 'translateZ(0)' }}
      >
        <ParallaxBackground progress={parallaxProgress} />

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

        <Particles progress={parallaxProgress} />

        <div className="absolute inset-0 bg-dark/20 pointer-events-none" />

        <OverlayText visible={segmentIdx === 0}>
          <h1 className="font-playfair text-4xl md:text-6xl font-bold text-white mb-3">
            Lufara
          </h1>
          <p className={`${fontClass} text-lg md:text-xl text-white/90`}>
            {t('tagline')}
          </p>
        </OverlayText>

        <OverlayText visible={segmentIdx === 1}>
          <p className={`${fontClass} text-2xl md:text-4xl font-semibold text-white`}>
            {t('hero.from_earth')}
          </p>
        </OverlayText>

        <OverlayText visible={segmentIdx === 2}>
          <p className={`${fontClass} text-2xl md:text-4xl font-semibold text-white`}>
            {t('hero.natural')}
          </p>
        </OverlayText>

        <OverlayText visible={segmentIdx === 3}>
          <p className={`${fontClass} text-2xl md:text-4xl font-semibold text-white`}>
            {t('hero.experience')}
          </p>
        </OverlayText>

        <OverlayText visible={segmentIdx === 4}>
          <DownArrow />
        </OverlayText>

        <SegmentDots
          active={segmentIdx}
          total={TOTAL_SEGMENTS}
          onJump={jumpTo}
          hidden={completed}
        />

        {!completed && segmentIdx === 0 && <ScrollHint />}
      </div>
    </section>
  )
}
