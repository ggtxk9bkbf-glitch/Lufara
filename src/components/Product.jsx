import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

const WHATSAPP_URL = 'https://wa.me/201111111111'

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2, duration: 0.6, ease: 'easeOut' },
  }),
}

function FeatureList({ features }) {
  return (
    <ul className="space-y-2 mb-8">
      {features.map((f, i) => (
        <li key={i} className="flex items-center gap-2 text-slate text-sm">
          <span className="text-secondary">✓</span>
          {f}
        </li>
      ))}
    </ul>
  )
}

function ProductCard({ icon, title, price, originalPrice, features, badge, index }) {
  const { t } = useTranslation()

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="relative bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center flex-1 max-w-sm"
    >
      {badge && (
        <span className="absolute -top-3 bg-accent text-white text-xs font-kufi font-semibold px-4 py-1 rounded-full">
          {badge}
        </span>
      )}

      <span className="text-4xl mb-4">{icon}</span>

      <h3 className="font-kufi text-xl font-semibold text-dark mb-2">{title}</h3>

      <div className="mb-6">
        {originalPrice && (
          <span className="text-slate/60 line-through text-sm me-2">
            {originalPrice}
          </span>
        )}
        <span className="text-accent text-3xl font-bold font-playfair">{price}</span>
      </div>

      <FeatureList features={features} />

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto w-full bg-accent hover:bg-accent/90 text-white font-kufi font-semibold py-3 rounded-xl transition-colors text-center block"
      >
        {t('product.order_now')}
      </a>
    </motion.div>
  )
}

export default function Product() {
  const { t } = useTranslation()
  const features = t('product.features', { returnObjects: true })

  return (
    <section id="product" className="bg-cream py-20 md:py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-kufi text-3xl md:text-4xl font-bold text-dark text-center mb-14"
        >
          {t('product.title')}
        </motion.h2>

        <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
          <ProductCard
            index={0}
            icon="🌿"
            title={t('product.single_title')}
            price={t('product.single_price')}
            features={features}
          />
          <ProductCard
            index={1}
            icon="🌿🌿🌿"
            title={t('product.triple_title')}
            price={t('product.triple_price')}
            originalPrice={t('product.triple_original')}
            features={features}
            badge={t('product.best_value')}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-12 text-center bg-white/60 backdrop-blur-sm rounded-xl py-4 px-6"
        >
          <p className="font-kufi text-slate text-sm">
            🇪🇬 + 🇪🇸 — {t('product.shipping')}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
