import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';
import type { HTMLAttributes } from 'react';

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      default: 'bg-slate-800 text-slate-200',
      success: 'bg-emerald-800/60 text-emerald-200',
      warning: 'bg-amber-800/60 text-amber-100'
    }
  },
  defaultVariants: {
    tone: 'default'
  }
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
