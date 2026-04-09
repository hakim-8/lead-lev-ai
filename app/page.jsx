import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Demonstration from './components/Demonstration';
import Benefits from './components/Benefits';
import Pricing from './components/Pricing';
import Footer from './components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Demonstration />
      <Benefits />
      <Pricing />
      <Footer />
    </main>
  );
}
