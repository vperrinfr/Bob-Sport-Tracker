import { cn } from '../../utils/cn';
import type { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Badge component with multiple variants
 * Uses the new design system colors
 */
export function Badge({ children, variant = 'primary', className }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, className)}>
      {children}
    </span>
  );
}

// Made with Bob
