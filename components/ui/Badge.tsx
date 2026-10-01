'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Temperature } from '@/types/database';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'quente' | 'morno' | 'frio' | 'desqualificado' | 'accent' | 'success';
  temperature?: Temperature;
  children: React.ReactNode;
}

export function Badge({
  variant = 'default',
  temperature,
  className,
  children,
  ...props
}: BadgeProps) {
  let effectiveVariant = variant;
  if (temperature) {
    effectiveVariant = temperature;
  }

  const variants = {
    default:
      'bg-evo-surface text-evo-muted border border-evo-border',
    outline:
      'bg-transparent text-evo-muted border border-evo-border',
    quente:
      'bg-evo-accent/10 text-evo-accent border border-evo-accent font-medium',
    morno:
      'bg-[rgba(142,182,155,0.1)] text-evo-support border border-[rgba(142,182,155,0.2)] font-medium',
    frio:
      'bg-[rgba(101,112,106,0.15)] text-evo-muted border border-[rgba(101,112,106,0.25)]',
    desqualificado:
      'bg-[rgba(35,83,71,0.15)] text-evo-disabled border border-[rgba(35,83,71,0.25)]',
    accent:
      'bg-[rgba(241,249,161,0.15)] text-evo-accent border border-[rgba(241,249,161,0.3)]',
    success:
      'bg-[rgba(142,182,155,0.15)] text-evo-support border border-[rgba(142,182,155,0.3)]',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-heading font-normal tracking-wide whitespace-nowrap shrink-0 select-none',
          variants[effectiveVariant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
}
