'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { createClient } from '@/utils/supabase/client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.replace('/login');
        } else if (mounted) {
          setLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
          if (!currentSession && mounted) {
            router.replace('/login');
          } else if (mounted) {
            setLoading(false);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        // Fallback: se falhar a conexão, permite a visualização
        if (mounted) setLoading(false);
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-evo-deep text-[var(--evo-muted)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-evo-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider text-evo-support">AUTENTICANDO EVO PIXEL...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-evo-deep">
      {/* Sidebar Fixa recolhível */}
      <Sidebar />

      {/* Área Central Principal */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar Discreta */}
        <Topbar onOpenSearch={() => setIsCommandOpen(true)} />

        {/* Conteúdo com iluminação atmosférica sutil */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 evo-atmospheric-glow">
          <div className="max-w-7xl mx-auto space-y-8 pb-16">{children}</div>
        </main>
      </div>

      {/* Command Palette Global (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </div>
  );
}
