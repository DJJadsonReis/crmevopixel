'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, activeId, onChange, className }: TabsProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1 p-1 rounded-xl bg-evo-deep border border-evo-border',
          className
        )
      )}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={clsx(
              'px-3.5 py-1.5 rounded-lg text-xs font-heading transition-all duration-200 flex items-center gap-2',
              isActive
                ? 'bg-evo-surface text-evo-text border border-evo-border font-medium shadow-sm'
                : 'text-evo-muted hover:text-evo-text hover:bg-evo-surface/40'
            )}
          >
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={clsx(
                  'px-1.5 py-0.2 text-[10px] rounded font-mono',
                  isActive
                    ? 'bg-evo-accent/15 text-evo-accent'
                    : 'bg-evo-surface2 text-evo-muted'
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
