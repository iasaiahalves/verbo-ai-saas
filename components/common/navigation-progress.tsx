'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Create a context for navigation state
type NavigationContextType = {
  isNavigating: boolean;
  startNavigation: () => void;
};

const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
  startNavigation: () => {},
});

// Hook to use the navigation context
export const useNavigation = () => useContext(NavigationContext);

// Progress bar component
export function NavigationProgress() {
  const { isNavigating } = useNavigation();
  
  if (!isNavigating) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-rose-500">
      <div className="h-full w-1/3 bg-white/30 animate-progress"></div>
    </div>
  );
}

// Provider component that manages navigation state
export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Reset navigation state when pathname or searchParams change
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);
  
  const startNavigation = () => {
    setIsNavigating(true);
  };
  
  return (
    <NavigationContext.Provider value={{ isNavigating, startNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}
