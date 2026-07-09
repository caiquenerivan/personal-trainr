import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { ComoFunciona } from '../components/ComoFunciona';
import { Recursos } from '../components/Recursos';
import { CtaSection } from '../components/CtaSection';
import { Footer } from '../components/Footer';

export function LandingPage() {
  return (
    <main id="main-content" className="min-h-screen bg-base font-body text-text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:bg-accent focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none focus:font-bold"
      >
        Pular para o conteúdo principal
      </a>
      <Navbar />
      <HeroSection />
      <ComoFunciona />
      <Recursos />
      <CtaSection />
      <Footer />
    </main>
  );
}
