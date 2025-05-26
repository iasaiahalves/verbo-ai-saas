import BgGardient from "@/components/common/bg-gradient";
import CTASection from '@/components/home/cta-section';
import DemoSection from '@/components/home/demo-section';
import HeroSection from '@/components/home/hero-section';
import HowItWorksSection from '@/components/home/how-it-works-section';





export default function Home() {
  return (
    <div className="relative w-full">
      <BgGardient />      <div className="flex flex-col ">
        <HeroSection />
        <DemoSection />
        <HowItWorksSection />
         <CTASection />

      </div>
     
      
      
     
    </div>
  );
}
