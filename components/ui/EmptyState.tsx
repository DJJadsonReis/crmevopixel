'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-evo-card/50 border border-evo-border border-dashed">
      <div className="w-12 h-12 rounded-xl bg-evo-surface border border-evo-border flex items-center justify-center text-evo-support mb-4">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-base font-medium text-evo-text font-heading mb-1">{title}</h4>
      <p className="text-xs text-evo-muted max-w-sm leading-relaxed mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
