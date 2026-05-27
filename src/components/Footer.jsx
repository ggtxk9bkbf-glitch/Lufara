import { useTranslation } from 'react-i18next'

const NAV_LINKS = [
  { key: 'about', href: '#about' },
  { key: 'product', href: '#product' },
  { key: 'contact', href: '#contact' },
]

export default function Footer() {
  const { t } = useTranslation()

  const scrollTo = (e, href) => {
    e.preventDefault()
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="bg-dark pt-12 pb-6 px-6">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-8">
        <div className="text-center">
          <p className="font-playfair text-2xl font-bold text-primary">Lufara</p>
          <p className="font-kufi text-cream/60 text-sm mt-1">{t('tagline')}</p>
        </div>

        <div className="flex gap-8">
          {NAV_LINKS.map(({ key, href }) => (
            <a
              key={key}
              href={href}
              onClick={(e) => scrollTo(e, href)}
              className="font-kufi text-sm text-cream/50 hover:text-cream transition-colors"
            >
              {t(`nav.${key}`)}
            </a>
          ))}
        </div>

        <div className="w-full border-t border-accent/30 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-cream/40 font-kufi">
          <span>Lufara &copy; 2026</span>
          <span>🇪🇬 مصر · 🇪🇸 España</span>
        </div>
      </div>
    </footer>
  )
}
