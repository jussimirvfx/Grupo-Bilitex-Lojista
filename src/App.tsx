import { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Authority } from './components/Authority';
import { Collections } from './components/Collections';
import { About } from './components/About';
import { Benefits } from './components/Benefits';
import { FAQ } from './components/FAQ';
import { RegisterForm } from './components/RegisterForm';
import { Footer } from './components/Footer';
import { StickyMobileCTA } from './components/StickyMobileCTA';
import { BrandInterest } from './types';

export default function App() {
  const [selectedBrandPreference, setSelectedBrandPreference] = useState<BrandInterest>('As duas marcas');

  const handleScrollToForm = (brandPreference?: BrandInterest) => {
    if (brandPreference) {
      setSelectedBrandPreference(brandPreference);
    }
    const formElement = document.getElementById('cadastro');
    if (formElement) {
      const yOffset = -80;
      const y = formElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#B1AEA7]/30 flex flex-col">
      {/* Header Navigation */}
      <Header onNavigateToForm={() => handleScrollToForm()} />

      {/* Main Page Sections */}
      <main className="flex-grow">
        {/* Section 1: Hero */}
        <Hero onCtaClick={() => handleScrollToForm()} />

        {/* Section 2: Brands & Collections (Bakulelê and Biliton) */}
        <Collections onSelectBrandCTA={(brand) => handleScrollToForm(brand)} />

        {/* Section 3: Authority Metrics */}
        <Authority />

        {/* Section 4: About Grupo Bilitex */}
        <About />

        {/* Section 5: Benefits for Retailers */}
        <Benefits />

        {/* Section 6: FAQ Accordion */}
        <FAQ />

        {/* Section 7: B2B Registration Form */}
        <RegisterForm selectedBrandPreference={selectedBrandPreference} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Sticky Mobile CTA Bar */}
      <StickyMobileCTA onCtaClick={() => handleScrollToForm()} />
    </div>
  );
}
