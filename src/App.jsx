import './i18n'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Product from './components/Product'
import About from './components/About'
import Contact from './components/Contact'
import Footer from './components/Footer'

function App() {
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
