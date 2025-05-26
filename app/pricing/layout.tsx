import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Verbo AI",
  description: "Explore our pricing plans and choose the best option for your needs.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
