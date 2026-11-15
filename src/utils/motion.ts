export const APPLE_EASE = [0.22, 1, 0.36, 1] as const;

export const APPLE_SPRING = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 32,
  mass: 0.9,
};

export const PAGE_TRANSITION_DURATION = 0.22;
export const SECTION_TRANSITION_DURATION = 0.26;
export const STAGGER_STEP = 0.035;
export const MAX_STAGGER_ITEMS = 8;

export function computeStaggerDelay(index: number, cap: number = MAX_STAGGER_ITEMS): number {
  if (!Number.isFinite(index) || index <= 0) return 0;
  return Number((Math.min(index, cap) * STAGGER_STEP).toFixed(3));
}

export function buildPageTransitionVariants(reducedMotion: boolean) {
  return {
    initial: {
      opacity: 0,
      y: reducedMotion ? 0 : 8,
      scale: reducedMotion ? 1 : 0.995,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: reducedMotion ? 0.01 : PAGE_TRANSITION_DURATION,
        ease: APPLE_EASE,
      },
    },
    exit: {
      opacity: 0,
      y: reducedMotion ? 0 : -4,
      scale: reducedMotion ? 1 : 0.998,
      transition: {
        duration: reducedMotion ? 0.01 : 0.11,
        ease: APPLE_EASE,
      },
    },
  };
}

export function buildSectionVariants(reducedMotion: boolean, index = 0) {
  return {
    hidden: {
      opacity: 0,
      y: reducedMotion ? 0 : 14,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0.01 : SECTION_TRANSITION_DURATION,
        delay: reducedMotion ? 0 : computeStaggerDelay(index, 6),
        ease: APPLE_EASE,
      },
    },
  };
}

export function buildStaggerContainerVariants(reducedMotion: boolean) {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reducedMotion ? 0 : STAGGER_STEP,
        delayChildren: reducedMotion ? 0 : 0.02,
      },
    },
  };
}

export function buildStaggerItemVariants(reducedMotion: boolean) {
  return {
    hidden: {
      opacity: 0,
      y: reducedMotion ? 0 : 10,
      scale: reducedMotion ? 1 : 0.985,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: reducedMotion ? 0.01 : 0.28,
        ease: APPLE_EASE,
      },
    },
  };
}

export function buildDialogVariants(reducedMotion: boolean) {
  return {
    hidden: {
      opacity: 0,
      y: reducedMotion ? 0 : 10,
      scale: reducedMotion ? 1 : 0.97,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: reducedMotion ? { duration: 0.01 } : APPLE_SPRING,
    },
    exit: {
      opacity: 0,
      y: reducedMotion ? 0 : 6,
      scale: reducedMotion ? 1 : 0.98,
      transition: { duration: reducedMotion ? 0.01 : 0.15, ease: APPLE_EASE },
    },
  };
}
