'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bell, Sparkles, Activity, Database } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { isSupabaseConfigured } from '@/lib/supabase/client';

import { useUser } from '@/lib/hooks/useUser';

interface TopbarProps {
  onOpenSearch?: () => void;
}

export function Topbar({ onOpenSearch }: TopbarProps) {
  const [configured, setConfigured] = useState(false);
  const userProfile = useUser();

  useEffect(() => {
    setConfigured(isSupabaseConfigured());
  }, []);

  return (
    <header className="h-16 border-b border-[var(--evo-border)] bg-[var(--evo-bg)]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
      {/* Busca Global (Command Palette Trigger) */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-[var(--evo-card)] border border-[var(--evo-border)] hover:border-[var(--evo-border-hover)] text-xs text-[var(--evo-muted)] transition-all group w-64 md:w-80 text-left shadow-sm"
        >
          <Search className="w-3.5 h-3.5 text-evo-support group-hover:text-[var(--evo-text)] transition-colors" />
          <span className="flex-1 truncate">Buscar leads, propostas, clientes...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] bg-[var(--evo-surface)] px-1.5 py-0.5 rounded text-[var(--evo-disabled)] border border-[var(--evo-border)] font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Ações & Perfil */}
      <div className="flex items-center gap-3">
        {/* Alternador de Tema Dark / Claro */}
        <ThemeToggle />

        <div className="h-4 w-[1px] bg-[var(--evo-border)] mx-1" />

        {/* Identificação do Usuário Logado */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-xl bg-evo-accent/15 border border-evo-accent/30 flex items-center justify-center text-xs font-semibold text-evo-accent font-heading shadow-inner">
            {userProfile.initials}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-medium text-evo-text font-heading leading-tight">
              {userProfile.name}
            </span>
            <span className="text-[10px] text-evo-disabled leading-tight">
              {userProfile.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
