'use client';

import { cn } from "@/lib/utils";
import { containerVariants, itemVariants } from "@/utils/constants";
import { ArrowRight, CheckIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { MotionDiv, MotionSection } from "../common/motion-wrapper";

type PriceType = {
  name: string;
  price: number;
  description: string;
  items: string[];
  id: string;
  paymentLink: string;
  priceId: string;
}

const listVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1, x: 0, transition: {type: 'sprint', damping: 20, stiffness: 100},
  },
};

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9,
    description: 'Perfect for occasional use',
    items: [
      '5 PDF summaries per month',
      'Standard processing speed',
      'Email support'
    
    ],
      paymentLink: '',
      priceId: '',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    description: 'For professionals and teams',
    items: [
      'Unlimited PDF summaries',
      'Priority processing',
      '24/7 priority support',
      'Markdown Export',
    ],
    paymentLink: '',
    priceId: ''
  },
];

const PricingCard = ({ name, price, description, items, paymentLink, id, index = 0 }: PriceType & { index?: number }) => {
  return <MotionDiv
    
    variants={listVariants}
    initial="hidden"
    animate="visible"
    whileHover={{ scale: 1.02}}
    transition={{ delay: index * 0.1 }}
    style={{ '--index': index } as React.CSSProperties}
    className="pricing-card relative w-full max-w-lg hover:scale-105 hover:transition-all duration-300">
    <div className={cn(
      "relative flex flex-col h-full gap-4 lg:gap-8 z-10 p-8 border-[1px] border-gray-500/20 rounded-2xl",
      
      id ==='pro' && 'border-rose-500 gap-5 border-2'
    )}
    >
    <MotionDiv
      variants={listVariants}
      className="flex justify-between items-center gap-4">
      <div>
          <p className="text-lg lg:text-xl font-bold capitalize">{name}</p>
          <p className="text-base-content/80 mt-2">{description}</p>
      </div>
     </MotionDiv>
     

    <MotionDiv variants={listVariants} className="flex gap-2">
        <p className="text-5xl tracking-tight font-extrabold">${price}</p>
        <div className="flex flex-col justify-end mb-[4px]">
          <p className="text-xs uppercase font-semibold">USD</p>
          <p className="text-xs">/month</p>
        </div>
      </MotionDiv>
    <MotionDiv className="space-y-2.5 leading-relaxed text-base flex-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <CheckIcon size={18} />
            <span>{item}</span>
          </li> 

      ))}
    </MotionDiv>
      <MotionDiv variants={listVariants} className="space-y-2 flex justify-center w-full" >
        <Link href={paymentLink || '#'}
          className={cn("w-full rounded-full flex items-center justify-center gap-2 bg-linear-to-r from-rose-800 to-rose-500 hover:from-rose-500 hover:to-rose-800 text-white border-2 py-2",
        id === 'pro' ? 'border-rose-900' : 'border-rose-100 from-rose-400 to-rose-500'
            
      )}
        > {/* Added fallback for href */}
      Buy Now <ArrowRight size={18} />
      </Link>
      
        </MotionDiv>
    </div>
  </MotionDiv>;
};

export default function PricingSection() {  // This ensures the animation runs on initial load even when directly navigating to the page
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has updated before applying animations
    const timer = setTimeout(() => {
      const container = document.getElementById('pricing-container');
      if (container) {
        container.classList.add('force-render', 'pricing-animation');
        
        // Apply appear animations to the pricing cards with staggered timing
        const cards = document.querySelectorAll('.pricing-card');
        cards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add('pricing-card-appear-active');
          }, index * 100);
        });
      }
    }, 50); // Short delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, []);
  return (    <MotionSection
      variants={containerVariants}
      initial="hidden"
      animate="visible" // Changed from whileInView to always animate
      className="relative overflow-hidden">
      <div id="pricing-container" className="py-12 lg:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 lg:pt-12">
        <MotionDiv
          variants={itemVariants}
          className="flex items-center justify-center w-full pb-12 ">
          <h2 className="uppercase font-bold text-xl mb-8 text-rose-500">Pricing</h2>
        </MotionDiv>        <div className="relative flex justify-center flex-col lg:flex-row items-center lg:items-stretch gap-8">
          {plans.map((plan, index) => (
            <PricingCard key={plan.id} {...plan} index={index} />
          ))}
        </div>
      </div>
    </MotionSection>
  )
}