'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, Trash2, Edit, CheckCircle, Ban, Search, UserCheck, Key } from 'lucide-react';
import { updateClientConfig } from '@/lib/supabase/client';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // In a real app, this fetches from Supabase
    // const fetchUsers = async () => { ... }
    // For now, mock data:
    setUsers([
      { id: '1', email: 'rafael@evopixel.com.br', full_name: 'Rafael Costa', role: 'admin', is_banned: false, created_at: '2026-09-30T10:00:00Z' },
      { id: '2', email: 'cliente@agencia.com', full_name: 'Cliente Agencia', role: 'user', is_banned: false, created_at: '2026-09-30T11:30:00Z' },
      { id: '3', email: 'spam@bot.com', full_name: 'Spam Bot', role: 'user', is_banned: true, created_at: '2026-09-30T12:00:00Z' },
    ]);
    setLoading(false);
  }, []);

  const handleToggleBan = (id: string, currentBan: boolean) => {
    setUsers(users.map(u => u.id === id ? { ...u, is_banned: !currentBan } : u));
    alert(currentBan ? 'Usuário desbanido com sucesso.' : 'Usuário banido e acesso revogado!');
  };

  const handleDelete = (id: string) => {
    if (confirm('Atenção: Excluir um usuário é uma ação irreversível. Tem certeza?')) {
      setUsers(users.filter(u => u.id !== id));
      alert('Usuário excluído.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--evo-text)] flex items-center gap-2">
            <Key className="w-6 h-6 text-evo-support" />
            Controle de Acessos
          </h1>
          <p className="text-sm text-[var(--evo-muted)] mt-1">Gerencie os usuários, permissões e clientes cadastrados no CRM.</p>
        </div>
      </div>

      <Card className="p-0 border border-[var(--evo-border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--evo-border)] bg-[var(--evo-surface2)] flex items-center gap-2">
          <Search className="w-4 h-4 text-[var(--evo-muted)]" />
          <input 
            type="text" 
            placeholder="Buscar usuário por nome ou email..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm w-full text-[var(--evo-text)] placeholder:text-[var(--evo-muted)]"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--evo-muted)] bg-[var(--evo-surface)] border-b border-[var(--evo-border)] uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Usuário</th>
                <th className="px-6 py-4 font-medium">Papel</th>
                <th className="px-6 py-4 font-medium">Data de Cadastro</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-[var(--evo-border)] bg-[var(--evo-card)] hover:bg-[var(--evo-surface2)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--evo-surface)] border border-[var(--evo-border)] flex items-center justify-center font-bold text-xs">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--evo-text)]">{user.full_name}</div>
                        <div className="text-xs text-[var(--evo-muted)]">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-mono ${
                      user.role === 'admin' ? 'bg-evo-support/10 text-evo-support border border-evo-support/20' : 'bg-[var(--evo-surface)] text-[var(--evo-muted)] border border-[var(--evo-border)]'
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--evo-muted)]">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    {user.is_banned ? (
                      <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium bg-red-950/30 px-2 py-1 rounded-md w-fit border border-red-900/50">
                        <Ban className="w-3.5 h-3.5" /> Banido
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-[#DAF1DE] font-medium bg-[#DAF1DE]/10 px-2 py-1 rounded-md w-fit border border-[#DAF1DE]/20">
                        <CheckCircle className="w-3.5 h-3.5" /> Ativo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--evo-muted)] hover:text-[var(--evo-text)]" title="Editar">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-8 px-2 ${user.is_banned ? 'text-evo-support hover:text-evo-support/80' : 'text-amber-500 hover:text-amber-400'}`} 
                      title={user.is_banned ? 'Desbanir' : 'Banir'}
                      onClick={() => handleToggleBan(user.id, user.is_banned)}
                    >
                      {user.is_banned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-red-500 hover:text-red-400 hover:bg-red-500/10" title="Excluir" onClick={() => handleDelete(user.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--evo-muted)] text-sm">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
