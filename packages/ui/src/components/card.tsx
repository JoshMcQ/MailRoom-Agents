import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';
import type { HTMLAttributes } from 'react';

const cardVariants = cva('rounded-xl border border-slate-900 bg-slate-950/50 text-slate-100 shadow-sm', {
  variants: {
    tone: {
      default: '',
      success: 'border-emerald-500/40',
      warning: 'border-amber-500/40'
    }
  },
  defaultVariants: {
    tone: 'default'
  }
});

export interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export function Card({ className, tone, ...props }: CardProps) {
  return <div className={cn(cardVariants({ tone }), className)} {...props} />;
}
