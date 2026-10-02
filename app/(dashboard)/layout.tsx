'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { IncomingReplyToaster } from '@/components/notifications/IncomingReplyToaster';
import { createClient } from '@/utils/supabase/client';
import { AuthUI } from '@/components/ui/auth-ui';

import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatRoute = pathname === '/chat';
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (mounted) {
        setSession(currentSession);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (mounted) {
        setSession((prevSession: any) => {
          if (prevSession?.access_token === currentSession?.access_token) return prevSession;
          return currentSession;
        });
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-evo-deep text-[var(--evo-muted)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-evo-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider text-evo-support">CARREGANDO EVO PIXEL...</span>
        </div>
      </div>
    );
  }

  // Se não houver sessão ativa no Supabase, exibe a tela de login imediatamente
  if (!session) {
    return <AuthUI />;
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
        {isChatRoute ? (
          <main className="flex-1 overflow-hidden h-[calc(100vh-4rem)]">
            {children}
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 evo-atmospheric-glow">
            <div className="w-full max-w-[1800px] mx-auto space-y-8 pb-16">{children}</div>
          </main>
        )}
      </div>

      {/* Command Palette Global (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />

      {/* Toaster Flutuante com Fila Lateral de Respostas de Leads */}
      <IncomingReplyToaster />
    </div>
  );
}
