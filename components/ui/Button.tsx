'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-heading font-medium transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-evo-accent/30 disabled:opacity-40 disabled:cursor-not-allowed select-none';

  const variants = {
    primary:
      'bg-evo-accent text-evo-black hover:brightness-105 active:scale-95 shadow-[0_0_15px_rgba(255,193,0,0.15)] font-bold',
    secondary:
      'bg-transparent text-evo-support border border-evo-support/50 hover:bg-evo-support/10 active:scale-95',
    outline:
      'bg-transparent text-evo-text border border-evo-border hover:border-evo-border-hover hover:bg-evo-card active:scale-95',
    ghost:
      'bg-transparent text-evo-muted hover:text-evo-text hover:bg-evo-surface/60 active:bg-evo-surface active:scale-95',
    destructive:
      'bg-transparent text-red-400 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 active:scale-95',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-[12px] gap-1.5',
    md: 'h-9 px-4 text-sm rounded-[12px] gap-2',
    lg: 'h-11 px-5 text-base rounded-[12px] gap-2.5',
    icon: 'h-9 w-9 p-0 rounded-[12px]',
  };

  return (
    <button
      className={twMerge(clsx(baseClasses, variants[variant], sizes[size], className))}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
