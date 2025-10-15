import HeroStable from '@/src/components/template/HeroStable'
import FeaturesStable from '@/src/components/template/FeaturesStable'
import HowItWorksStable from '@/src/components/template/HowItWorksStable'
import FAQStable from '@/src/components/template/FAQStable'
import CTAStable from '@/src/components/template/CTAStable'   // ⬅️ nuevo
import KeyParamsStable from '@/src/components/template/KeyParamsStable'

export default function Page() {
  return (
    <>
      <HeroStable />
      <FeaturesStable />
      <HowItWorksStable />
      <FAQStable />
      <KeyParamsStable />
      <CTAStable />     {/* ⬅️ nuevo */}
    </>
  )
}
