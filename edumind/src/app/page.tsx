import { LandingNavbar } from '@/components/landing/landing-navbar'
import { HeroSection } from '@/components/landing/hero-section'
import { SubjectsStrip } from '@/components/landing/subjects-strip'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { ProductPreviewSection } from '@/components/landing/product-preview-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { PricingPreviewSection } from '@/components/landing/pricing-preview-section'
import { FAQSection } from '@/components/landing/faq-section'
import { CTASection } from '@/components/landing/cta-section'
import { Footer } from '@/components/landing/footer'

export default function LandingPage() {
  return (
    <main style={{ background: 'var(--bg-base)' }}>
      <LandingNavbar />
      <HeroSection />
      <SubjectsStrip />
      <TestimonialsSection />
      <ProductPreviewSection />
      <HowItWorksSection />
      <PricingPreviewSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  )
}
