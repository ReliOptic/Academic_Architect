import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface CardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  variant?: 'low' | 'lowest' | 'high' | 'highest';
  hover?: boolean;
}

export function Card({ 
  children, 
  className = '', 
  variant = 'low', 
  hover = true,
  ...props 
}: CardProps) {
  const variants = {
    low: 'bg-surface-container-low',
    lowest: 'bg-surface-container-lowest',
    high: 'bg-surface-container-high',
    highest: 'bg-surface-container-highest',
  };

  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      className={`p-8 rounded-xl border border-outline-variant/5 flex flex-col h-full transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
