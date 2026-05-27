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
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-cream/95 shadow-md backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
        <a
          href="#"
          className="font-playfair text-2xl font-bold text-primary tracking-wide"
        >
          Lufara
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ key, href }) => (
            <a
              key={key}
              href={href}
              onClick={(e) => scrollTo(e, href)}
              className="font-kufi text-sm text-dark hover:text-primary transition-colors"
            >
              {t(`nav.${key}`)}
            </a>
          ))}

          <button
            onClick={toggleLanguage}
            className="border border-primary/30 rounded-full px-4 py-1.5 text-xs font-kufi text-primary hover:bg-primary hover:text-cream transition-colors cursor-pointer"
          >
            {i18n.language === 'ar' ? 'ES' : 'AR'}
          </button>
        </div>

        {/* Mobile hamburger */}
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

      {/* Mobile menu */}
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
    </nav>
  )
}
