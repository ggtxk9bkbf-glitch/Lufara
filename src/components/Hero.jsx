import { useRef, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

const OVERLAYS = [
  { key: 'brand', start: 0, end: 0.15 },
  { key: 'from_earth', start: 0.2, end: 0.4 },
  { key: 'natural', start: 0.45, end: 0.65 },
  { key: 'experience', start: 0.7, end: 0.85 },
  { key: 'arrow', start: 0.9, end: 1 },
]

const VIDEO_DURATION = 30

function useScrollProgress(sectionRef) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const sectionHeight = sectionRef.current.offsetHeight - window.innerHeight
      const scrolled = -rect.top
      setProgress(Math.min(1, Math.max(0, scrolled / sectionHeight)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
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
  const rafRef = useRef(null)
  const progress = useScrollProgress(sectionRef)

  const isArabic = i18n.language === 'ar'
  const fontClass = isArabic ? 'font-kufi' : 'font-playfair'

  const syncVideo = useCallback(() => {
    if (!videoRef.current) return
    const target = progress * VIDEO_DURATION
    if (Math.abs(videoRef.current.currentTime - target) > 0.05) {
      videoRef.current.currentTime = target
    }
  }, [progress])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(syncVideo)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [syncVideo])

  const isVisible = (start, end) => progress >= start && progress <= end

  return (
    <section ref={sectionRef} className="relative" style={{ height: '600vh' }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <video
          ref={videoRef}
          src="/lufara/videos/lufara_combined.mp4"
          muted
          playsInline
          preload="auto"
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
