# Lufara Website

## Brand
- Name: Lufara
- Tagline AR: طبيعي من البذرة
- Tagline ES: Natural desde la semilla
- Origin: Beheira, Egypt — 25 years family business

## Stack
- React + Vite + Tailwind CSS + Framer Motion + i18next
- Deploy: GitHub Pages (auto on push to main)

## Colors
- cream: #FAF7F2
- primary: #8B7355
- secondary: #6B8F71
- accent: #C4A962
- dark: #2C2C2C
- slate: #4A5568

## Fonts (Google Fonts)
- Arabic: Noto Kufi Arabic
- Latin: Playfair Display

## Languages
- Arabic: RTL, dir="rtl"
- Spanish: LTR, dir="ltr"
- Switcher in Navbar

## Structure
public/videos/lufara_combined.mp4
public/images/
src/components/Navbar.jsx
src/components/Hero.jsx
src/components/Product.jsx
src/components/About.jsx
src/components/Contact.jsx
src/components/Footer.jsx
src/i18n/ar.json
src/i18n/es.json
src/i18n/index.js

## Key Feature — Scroll Driven Video
- Video: /lufara/videos/lufara_combined.mp4
- Video plays frame by frame with scroll
- Total scroll height: 600vh
- Text overlays appear/disappear with scroll progress

## Pricing
- 1 piece: 5€ / 250 EGP
- 3 pieces: 12€ / 600 EGP
- Shipping: Egypt + Spain only

## Contact
- WhatsApp: 01111111111
- Email: hoshos@lufara.com

## Auto Deploy
.github/workflows/deploy.yml
Push to main → build → deploy to gh-pages
