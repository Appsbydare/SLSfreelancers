// Standardized animation utilities for consistent animations across the website

export const animationClasses = {
  // Fade animations
  fadeIn: 'animate-fade-in',
  fadeInUp: 'animate-fade-in-up',
  fadeInDown: 'animate-fade-in-down',
  fadeInLeft: 'animate-fade-in-left',
  fadeInRight: 'animate-fade-in-right',
  
  // Scale animations
  scaleIn: 'animate-scale-in',
  scaleInHover: 'hover:animate-scale-in',
  
  // Slide animations
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  
  // Bounce animations
  bounceIn: 'animate-bounce-in',
  
  // Pulse animations
  pulse: 'animate-pulse',
  pulseSlow: 'animate-pulse-slow',
  
  // Stagger animations for lists
  stagger1: 'animate-stagger-1',
  stagger2: 'animate-stagger-2',
  stagger3: 'animate-stagger-3',
  stagger4: 'animate-stagger-4',
  stagger5: 'animate-stagger-5',
  
  // Hover effects
  hoverLift: 'hover:animate-hover-lift',
  hoverGlow: 'hover:animate-hover-glow',
  hoverShake: 'hover:animate-hover-shake',
  
  // Loading animations
  loadingSpin: 'animate-spin',
  loadingPulse: 'animate-pulse',
  loadingBounce: 'animate-bounce',
  
  // Text animations
  typewriter: 'animate-typewriter',
  textReveal: 'animate-text-reveal',
  
  // Page transitions
  pageEnter: 'animate-page-enter',
  pageExit: 'animate-page-exit',
} as const;

export const animationDelays = {
  delay100: 'delay-100',
  delay200: 'delay-200',
  delay300: 'delay-300',
  delay400: 'delay-400',
  delay500: 'delay-500',
  delay700: 'delay-700',
  delay1000: 'delay-1000',
} as const;

export const animationDurations = {
  duration75: 'duration-75',
  duration100: 'duration-100',
  duration150: 'duration-150',
  duration200: 'duration-200',
  duration300: 'duration-300',
  duration500: 'duration-500',
  duration700: 'duration-700',
  duration1000: 'duration-1000',
} as const;

// Animation variants for different use cases
export const animationVariants = {
  header: {
    initial: 'opacity-0 translate-y-[-20px]',
    animate: 'opacity-100 translate-y-0',
    transition: 'transition-all duration-500 ease-out',
  },
  banner: {
    initial: 'opacity-0 scale-95',
    animate: 'opacity-100 scale-100',
    transition: 'transition-all duration-700 ease-out',
  },
  card: {
    initial: 'opacity-0 translate-y-4',
    animate: 'opacity-100 translate-y-0',
    transition: 'transition-all duration-300 ease-out',
  },
  button: {
    initial: 'opacity-0 scale-95',
    animate: 'opacity-100 scale-100',
    transition: 'transition-all duration-200 ease-out',
  },
  text: {
    initial: 'opacity-0 translate-y-2',
    animate: 'opacity-100 translate-y-0',
    transition: 'transition-all duration-400 ease-out',
  },
} as const;

// Utility function to combine animation classes
export function combineAnimations(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

// Utility function for staggered animations
export function getStaggerDelay(index: number, baseDelay: number = 100): string {
  return `delay-[${index * baseDelay}ms]`;
}

// Intersection Observer hook for scroll-triggered animations
export function useIntersectionObserver() {
  // This would be implemented with React hooks in a real scenario
  // For now, we'll use CSS-based animations with Tailwind
  return {
    ref: null,
    inView: true,
  };
}
