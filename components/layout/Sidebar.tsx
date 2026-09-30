'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Logo } from '@/components/ui/Logo';
import {
  LayoutDashboard,
  Users,
  Kanban,
  Building2,
  Briefcase,
  CheckSquare,
  Clock,
  Layers,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  History,
  Crosshair,
  CalendarCheck,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sections: NavSection[] = [
    {
      items: [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      ],
    },
    {
      title: 'COMERCIAL',
      items: [
        { label: 'Leads', href: '/leads', icon: Users },
        { label: 'Pipeline', href: '/pipeline', icon: Kanban },
        { label: 'Oportunidades', href: '/oportunidades', icon: Crosshair },
      ],
    },
    {
      title: 'GESTÃO',
      items: [
        { label: 'Clientes', href: '/clientes', icon: Building2 },
        { label: 'Mensalistas', href: '/mensalidades', icon: CalendarCheck, badge: 'MRR' },
        { label: 'Projetos', href: '/projetos', icon: Briefcase },
        { label: 'Tarefas', href: '/tarefas', icon: CheckSquare },
        { label: 'Follow-ups', href: '/follow-ups', icon: Clock },
      ],
    },
    {
      title: 'NEGÓCIOS',
      items: [
        { label: 'Serviços', href: '/servicos', icon: Layers },
        { label: 'Financeiro', href: '/financeiro', icon: DollarSign },
        { label: 'Meu Histórico', href: '/minha-historia', icon: History },
      ],
    },
  ];

  return (
    <aside
      className={clsx(
        'relative flex flex-col h-screen bg-evo-deep border-r border-[rgba(218,241,222,0.07)] transition-all duration-300 z-30 select-none shrink-0',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header com Logo Oficial EVO PIXEL */}
      <div
        className={clsx(
          'h-16 flex items-center justify-between border-b border-evo-border bg-evo-black/40 transition-all duration-200',
          isCollapsed ? 'px-3' : 'px-5'
        )}
      >
        <Link href="/" className="flex items-center overflow-hidden py-1 group" title="EVO PIXEL OS">
          <Logo isCollapsed={isCollapsed} />
        </Link>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-evo-muted hover:text-evo-text p-1.5 rounded-lg hover:bg-evo-surface transition-colors shrink-0"
          title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navegação */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && !isCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-heading font-semibold tracking-wider text-evo-disabled uppercase">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-heading transition-all duration-150',
                    isActive
                      ? 'bg-evo-surface text-evo-text border border-evo-border font-medium'
                      : 'text-evo-muted hover:text-evo-text hover:bg-evo-card/80'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  {/* Pequeno sinal acento em #F1F9A1 para item ativo */}
                  {isActive && (
                    <div className="absolute left-1 w-1 h-3.5 bg-evo-accent rounded-full" />
                  )}

                  <Icon
                    className={clsx(
                      'w-4 h-4 shrink-0 transition-colors',
                      isActive ? 'text-evo-accent' : 'text-evo-support/70 group-hover:text-evo-support'
                    )}
                  />

                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between overflow-hidden">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={clsx(
                            'text-[10px] px-1.5 py-0.5 rounded font-mono',
                            isActive
                              ? 'bg-evo-accent/10 text-evo-accent'
                              : 'bg-evo-surface2 text-evo-support'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Rodapé da Sidebar */}
      <div className="p-3 border-t border-evo-border bg-evo-black/40">
        <Link
          href="/configuracoes"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-heading text-evo-muted hover:text-evo-text hover:bg-evo-card transition-all',
            pathname === '/configuracoes' && 'bg-evo-surface text-evo-text border border-evo-border'
          )}
        >
          <Settings className="w-4 h-4 text-evo-disabled" />
          {!isCollapsed && <span>Configurações</span>}
        </Link>
      </div>
    </aside>
  );
}
