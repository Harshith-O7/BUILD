import React from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import {
  APPLE_SPRING,
  buildPageTransitionVariants,
  buildSectionVariants,
  buildStaggerContainerVariants,
  buildStaggerItemVariants,
} from '../../utils/motion';

export const AppMotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
);

interface ModulePageTransitionProps {
  moduleKey: string;
  children: React.ReactNode;
  className?: string;
}

export const ModulePageTransition: React.FC<ModulePageTransitionProps> = ({
  moduleKey,
  children,
  className,
}) => {
  const reduced = Boolean(useReducedMotion());
  const variants = buildPageTransitionVariants(reduced);

  return (
    <AnimatePresence mode="wait" initial={true}>
      <motion.div
        key={moduleKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
        style={{ willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

interface MotionSubViewTransitionProps {
  viewKey: string;
  children: React.ReactNode;
  className?: string;
}

export const MotionSubViewTransition: React.FC<MotionSubViewTransitionProps> = ({
  viewKey,
  children,
  className,
}) => {
  const reduced = Boolean(useReducedMotion());
  const variants = buildPageTransitionVariants(reduced);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={viewKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

interface MotionSectionProps {
  children: React.ReactNode;
  delayIndex?: number;
  className?: string;
  as?: 'section' | 'div';
  ariaLabel?: string;
}

export const MotionSection: React.FC<MotionSectionProps> = ({
  children,
  delayIndex = 0,
  className,
  as = 'div',
  ariaLabel,
}) => {
  const reduced = Boolean(useReducedMotion());
  const variants = buildSectionVariants(reduced, delayIndex);
  const Component = as === 'section' ? motion.section : motion.div;

  return (
    <Component
      variants={variants}
      initial="hidden"
      animate="visible"
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </Component>
  );
};

interface MotionStaggerGridProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  role?: string;
}

export const MotionStaggerGrid: React.FC<MotionStaggerGridProps> = ({
  children,
  className,
  ariaLabel,
  role,
}) => {
  const reduced = Boolean(useReducedMotion());
  const variants = buildStaggerContainerVariants(reduced);

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      aria-label={ariaLabel}
      role={role}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const MotionStaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const reduced = Boolean(useReducedMotion());
  const variants = buildStaggerItemVariants(reduced);

  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
};

export const MotionSidebarActiveIndicator: React.FC<{
  className?: string;
  layoutId?: string;
}> = ({
  className = 'absolute inset-0 rounded-lg bg-blue-600 shadow-sm',
  layoutId = 'sidebar-active-pill',
}) => {
  const reduced = Boolean(useReducedMotion());
  return (
    <motion.span
      layoutId={layoutId}
      transition={reduced ? { duration: 0.01 } : APPLE_SPRING}
      className={className}
      aria-hidden="true"
    />
  );
};
