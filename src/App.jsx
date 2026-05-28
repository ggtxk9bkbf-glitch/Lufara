import { useEffect } from 'react'
import Lenis from 'lenis'
import { setLenis } from './lib/lenisInstance'
import './i18n'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Product from './components/Product'
import About from './components/About'
import Contact from './components/Contact'
import Footer from './components/Footer'

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
      smoothWheel: true,
    })
    setLenis(lenis)

    let rafId
    const raf = (time) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      setLenis(null)
    }
  }, [])

  return (
    <div className="bg-cream min-h-screen">
      <Navbar />
      <Hero />
      <Product />
      <About />
      <Contact />
      <Footer />
    </div>
  )
}

export default App
