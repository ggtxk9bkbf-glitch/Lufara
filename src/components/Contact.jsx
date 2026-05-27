import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

const WHATSAPP_URL = 'https://wa.me/201111111111'
const EMAIL = 'hoshos@lufara.com'

function ContactItem({ icon, label, value, href }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ x: 4 }}
      className="flex items-center gap-4 group"
    >
      <span className="text-2xl shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-cream/10 group-hover:bg-accent/20 transition-colors">
        {icon}
      </span>
      <div>
        <p className="font-kufi text-cream/60 text-xs">{label}</p>
        <p className="font-kufi text-cream group-hover:text-accent transition-colors">
          {value}
        </p>
      </div>
    </motion.a>
  )
}

export default function Contact() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Lufara — ${name}`)
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`)
    window.open(`mailto:${EMAIL}?subject=${subject}&body=${body}`, '_self')
  }

  const inputClass =
    'w-full bg-transparent border border-cream/20 rounded-xl px-4 py-3 text-cream font-kufi text-sm placeholder:text-cream/30 focus:outline-none focus:border-accent transition-colors'

  return (
    <section id="contact" className="bg-dark py-20 md:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-14 md:gap-20">
          {/* Left — Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:w-2/5 flex flex-col gap-8"
          >
            <div>
              <h2 className="font-kufi text-3xl md:text-4xl font-bold text-cream mb-2">
                {t('contact.title')}
              </h2>
              <p className="font-kufi text-cream/60 text-sm">
                {t('contact.subtitle')}
              </p>
            </div>

            <div className="w-12 h-px bg-accent/50" />

            <div className="flex flex-col gap-6">
              <ContactItem
                icon="📱"
                label={t('contact.whatsapp')}
                value="01111111111"
                href={WHATSAPP_URL}
              />
              <ContactItem
                icon="📧"
                label={t('contact.email')}
                value={EMAIL}
                href={`mailto:${EMAIL}`}
              />
              <ContactItem
                icon="🚚"
                label={t('contact.shipping_label')}
                value="🇪🇬 🇪🇸"
                href="#product"
              />
            </div>
          </motion.div>

          {/* Right — Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:w-3/5 flex flex-col gap-5"
          >
            <input
              type="text"
              required
              placeholder={t('contact.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
            <input
              type="email"
              required
              placeholder={t('contact.email_field')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <textarea
              required
              rows={5}
              placeholder={t('contact.message')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`${inputClass} resize-none`}
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-accent hover:bg-accent/90 text-white font-kufi font-semibold py-3 rounded-xl transition-colors cursor-pointer"
            >
              {t('contact.send')}
            </motion.button>
          </motion.form>
        </div>
      </div>
    </section>
  )
}
