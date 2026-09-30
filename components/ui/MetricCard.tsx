'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  subtitle?: string;
  trend?: string;
  trendPositive?: boolean;
  highlight?: boolean; // Se for destaque principal (#F1F9A1)
  icon?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  subtitle,
  trend,
  trendPositive = true,
  highlight = false,
  icon,
  className,
  ...props
}: MetricCardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'relative rounded-2xl border p-5 transition-all duration-200 overflow-hidden',
          highlight
            ? 'bg-evo-card border-[rgba(241,249,161,0.22)] shadow-[0_0_30px_-5px_rgba(241,249,161,0.06)]'
            : 'bg-evo-card border-evo-border hover:border-evo-border-hover',
          className
        )
      )}
      {...props}
    >
      <div className="flex items-center justify-between text-xs text-evo-muted mb-2 font-medium">
        <span>{label}</span>
        {icon && <div className="text-evo-support opacity-80">{icon}</div>}
      </div>

      <div
        className={clsx(
          'text-2xl lg:text-3xl font-semibold tracking-tight font-heading my-1',
          highlight ? 'text-evo-accent' : 'text-evo-text'
        )}
      >
        {value}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-2 text-xs">
          {trend && (
            <span
              className={clsx(
                'inline-flex items-center font-medium px-1.5 py-0.5 rounded text-[11px]',
                trendPositive
                  ? 'bg-evo-support/10 text-evo-support border border-evo-support/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              )}
            >
              {trend}
            </span>
          )}
          {subtitle && <span className="text-evo-muted truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
