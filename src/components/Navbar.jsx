import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_LINKS = [
  { key: 'about', href: '#about' },
  { key: 'product', href: '#product' },
  { key: 'contact', href: '#contact' },
]

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const [pastHero, setPastHero] = useState(false)
  const [scrollDepth, setScrollDepth] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    // Hero section is 400vh tall with a sticky 100vh child; reveal navbar
    // once the user has scrolled past the pinned scroll range. Also track
    // scroll depth (0–1 past the hero) to drive logo size + backdrop blur.
    let ticking = false
    let rafId = null

    const compute = () => {
      ticking = false
      const threshold = window.innerHeight * 3 - 80
      setPastHero(window.scrollY > threshold)
      const past = Math.max(0, window.scrollY - threshold)
      // Saturate around 600px past hero.
      setScrollDepth(Math.min(1, past / 600))
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
  }, [])

  const toggleLanguage = () => {
    const next = i18n.language === 'ar' ? 'es' : 'ar'
    i18n.changeLanguage(next)
    document.documentElement.lang = next
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
  }

  const scrollTo = (e, href) => {
    e.preventDefault()
    setMenuOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  // Morphing values — logo shrinks, links nudge upward, blur deepens.
  const logoSize = 1.5 - scrollDepth * 0.5 // rem
  const linkOffset = -scrollDepth * 2 // px
  const blurAmount = 4 + scrollDepth * 12 // px

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{
        y: pastHero ? 0 : -100,
        opacity: pastHero ? 1 : 0,
      }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-50 ${
        pastHero ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      style={{
        backgroundColor: `rgba(250, 247, 242, ${0.85 + scrollDepth * 0.1})`,
        backdropFilter: `blur(${blurAmount}px)`,
        WebkitBackdropFilter: `blur(${blurAmount}px)`,
        boxShadow: `0 ${4 + scrollDepth * 4}px ${12 + scrollDepth * 12}px -8px rgba(44,44,44,${0.08 + scrollDepth * 0.08})`,
      }}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
        <motion.a
          href="#"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="font-playfair font-bold text-primary tracking-wide"
          style={{ fontSize: `${logoSize}rem` }}
        >
          Lufara
        </motion.a>

        <div className="hidden md:flex items-center gap-8" style={{ transform: `translateY(${linkOffset}px)` }}>
          {NAV_LINKS.map(({ key, href }, i) => (
            <motion.a
              key={key}
              href={href}
              onClick={(e) => scrollTo(e, href)}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
              className="font-kufi text-sm text-dark hover:text-primary transition-colors"
            >
              {t(`nav.${key}`)}
            </motion.a>
          ))}

          <motion.button
            onClick={toggleLanguage}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            whileTap={{ scale: 0.95 }}
            className="relative overflow-hidden border border-primary/30 rounded-full px-4 py-1.5 text-xs font-kufi text-primary hover:bg-primary hover:text-cream transition-colors cursor-pointer"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={i18n.language}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="inline-block"
              >
                {i18n.language === 'ar' ? 'ES' : 'AR'}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col justify-center gap-1.5 w-8 h-8 cursor-pointer"
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-6 bg-primary transition-all duration-300 ${
              menuOpen ? 'rotate-45 translate-y-2' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-primary transition-all duration-300 ${
              menuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-primary transition-all duration-300 ${
              menuOpen ? '-rotate-45 -translate-y-2' : ''
            }`}
          />
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-cream/95 backdrop-blur-sm overflow-hidden"
          >
            <div className="flex flex-col items-center gap-6 py-6">
              {NAV_LINKS.map(({ key, href }) => (
                <a
                  key={key}
                  href={href}
                  onClick={(e) => scrollTo(e, href)}
                  className="font-kufi text-base text-dark hover:text-primary transition-colors"
                >
                  {t(`nav.${key}`)}
                </a>
              ))}

              <button
                onClick={toggleLanguage}
                className="border border-primary/30 rounded-full px-5 py-2 text-sm font-kufi text-primary hover:bg-primary hover:text-cream transition-colors cursor-pointer"
              >
                {i18n.language === 'ar' ? 'ES' : 'AR'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
