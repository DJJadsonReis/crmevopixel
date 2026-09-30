'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop sutil e escuro */}
      <div
        className="fixed inset-0 bg-evo-black/80 backdrop-blur-[4px] transition-opacity"
        onClick={onClose}
      />

      {/* Janela modal */}
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-evo-card border border-evo-border rounded-2xl shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden`}
      >
        <div className="flex items-start justify-between pb-4 border-b border-evo-border mb-5">
          <div>
            <h3 className="text-lg font-medium text-evo-text font-heading">{title}</h3>
            {subtitle && <p className="text-xs text-evo-muted mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-evo-muted hover:text-evo-text p-1.5 rounded-lg hover:bg-evo-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}
