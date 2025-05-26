'use client';

import PricingSection from "@/components/home/pricing-section";
import { useEffect } from "react";
import "./pricing.css";

// Metadata is now defined in layout.tsx

export default function PricingPage() {
  // Ensure animations start properly when the page loads
  useEffect(() => {
    // Force repaint to ensure animations work correctly
    document.body.classList.add('pricing-page-loaded');
    
    return () => {
      document.body.classList.remove('pricing-page-loaded');
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="w-full">
        <PricingSection />
      </div>
    </main>
  );
}
