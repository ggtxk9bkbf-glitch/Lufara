import { useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useInView } from 'framer-motion'

const STATS = [
  { value: 25, suffix: '+', key: 'stat_years' },
  { value: 100, suffix: '%', key: 'stat_natural' },
  { value: 2, suffix: '', key: 'stat_countries' },
]

function AnimatedCounter({ target, suffix, inView }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    let frame
    const duration = 1200
    const start = performance.now()

    const step = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [inView, target])

  return (
    <span className="text-secondary text-4xl md:text-5xl font-bold font-playfair">
      {count}{suffix}
    </span>
  )
}

function LeafDecoration() {
  return (
    <svg
      className="absolute -bottom-10 start-1/2 -translate-x-1/2 opacity-[0.06] pointer-events-none"
      width="220"
      height="220"
      viewBox="0 0 100 100"
      fill="none"
    >
      <path
        d="M50 5 C25 20, 10 50, 50 95 C90 50, 75 20, 50 5Z"
        fill="#6B8F71"
      />
      <path
        d="M50 25 L50 85"
        stroke="#6B8F71"
        strokeWidth="1"
      />
      <path d="M50 40 C40 35, 32 42, 35 50" stroke="#6B8F71" strokeWidth="0.8" fill="none" />
      <path d="M50 55 C60 50, 68 57, 65 65" stroke="#6B8F71" strokeWidth="0.8" fill="none" />
    </svg>
  )
}

export default function About() {
  const { t } = useTranslation()
  const statsRef = useRef(null)
  const statsInView = useInView(statsRef, { once: true, amount: 0.4 })

  return (
    <section
      id="about"
      className="relative py-20 md:py-28 px-6 overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #FAF7F2, #F0EBE1)' }}
    >
      <LeafDecoration />

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-14 md:gap-20 items-center">
          {/* Stats column */}
          <motion.div
            ref={statsRef}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-10 md:w-2/5"
          >
            {STATS.map(({ value, suffix, key }) => (
              <div key={key} className="text-center md:text-start">
                <AnimatedCounter
                  target={value}
                  suffix={suffix}
                  inView={statsInView}
                />
                <p className="font-kufi text-primary text-sm mt-1">
                  {t(`about.${key}`)}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Gold separator — vertical on desktop, horizontal on mobile */}
          <div className="hidden md:block w-px h-64 bg-accent/40" />
          <div className="block md:hidden w-24 h-px bg-accent/40" />

          {/* Story column */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:w-3/5"
          >
            <h2 className="font-kufi text-3xl md:text-4xl font-bold text-primary mb-6">
              {t('about.title')}
            </h2>
            <p className="font-kufi text-slate leading-relaxed text-base md:text-lg">
              {t('about.story')}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
