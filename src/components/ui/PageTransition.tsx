import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Page transition wrapper component using Framer Motion
 * Provides smooth fade and slide animations between pages
 */
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1], // Custom easing for smooth motion
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered children animation wrapper
 * Animates children with a delay between each
 */
export function StaggerContainer({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Individual stagger item
 */
export function StaggerItem({ children }: PageTransitionProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scale animation for cards and interactive elements
 */
export function ScaleOnHover({ children }: PageTransitionProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fade in animation
 */
export function FadeIn({ children, delay = 0 }: PageTransitionProps & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

// Made with Bob
