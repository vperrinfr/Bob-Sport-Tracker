import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';

interface AnimatedStatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  delay?: number;
}

/**
 * Animated stat card with count-up animation for numbers
 */
export function AnimatedStatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  subtitle,
  delay = 0 
}: AnimatedStatCardProps) {
  const isNumeric = typeof value === 'number';
  
  // Animated counter for numeric values
  const spring = useSpring(0, { 
    duration: 1500,
    bounce: 0
  });
  
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    if (isNumeric) {
      const timer = setTimeout(() => {
        spring.set(value as number);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [value, isNumeric, spring, delay]);

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ 
        y: -4,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-400">
            {title}
          </p>
          <motion.p 
            className="mt-2 text-3xl font-bold text-gray-900 dark:text-white"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ 
              duration: 0.5, 
              delay: delay + 0.2,
              type: "spring",
              stiffness: 200
            }}
          >
            {isNumeric ? (
              <motion.span>{display}</motion.span>
            ) : (
              value
            )}
          </motion.p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
          {trend && (
            <motion.div 
              className="mt-2 flex items-center"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.4 }}
            >
              <span
                className={`text-sm font-medium ${
                  trend.isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                vs. mois dernier
              </span>
            </motion.div>
          )}
        </div>
        {icon && (
          <motion.div
            className="flex-shrink-0 p-3 bg-primary-600 dark:bg-primary-900 rounded-lg"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.6,
              delay: delay + 0.1,
              type: "spring",
              stiffness: 200
            }}
          >
            <div className="text-white dark:text-primary-300">
              {icon}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Made with Bob
