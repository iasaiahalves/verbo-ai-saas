import PricingSection from "@/components/home/pricing-section";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Verbo AI",
  description: "Explore our pricing plans and choose the best option for your needs.",
};

export default function PricingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="w-full">
        <PricingSection />
      </div>
    </main>
  );
}
