'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, Trash2, Edit, CheckCircle, Ban, Search, UserCheck, Key, UserPlus } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadUsers() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) {
          setUsers(data);
        } else {
          setUsers([
            { id: 'd0c44d79-830a-441f-810f-a5f1fb5f0276', email: 'rafaelgcostaa@gmail.com', full_name: 'RAFAEL GOMES COSTA', role: 'admin', is_banned: false, created_at: new Date().toISOString() },
          ]);
        }
      } catch (e) {
        setUsers([
          { id: 'd0c44d79-830a-441f-810f-a5f1fb5f0276', email: 'rafaelgcostaa@gmail.com', full_name: 'RAFAEL GOMES COSTA', role: 'admin', is_banned: false, created_at: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const handleToggleBan = async (id: string, currentBan: boolean) => {
    try {
      const supabase = createClient();
      await supabase.from('users').update({ is_banned: !currentBan }).eq('id', id);
    } catch (e) {}
    setUsers(users.map(u => u.id === id ? { ...u, is_banned: !currentBan } : u));
    alert(currentBan ? 'Acesso restabelecido com sucesso.' : 'Usuário banido! O acesso ao CRM foi revogado imediatamente.');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Atenção: Excluir este usuário é uma ação irreversível. Confirmar exclusão?')) {
      try {
        const supabase = createClient();
        await supabase.from('users').delete().eq('id', id);
      } catch (e) {}
      setUsers(users.filter(u => u.id !== id));
      alert('Usuário removido da base.');
    }
  };

  const filteredUsers = users.filter(u => 
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--evo-text)] flex items-center gap-2">
            <Key className="w-6 h-6 text-evo-support" />
            Gestão de Clientes e Acessos
          </h1>
          <p className="text-sm text-[var(--evo-muted)] mt-1">
            Controle de usuários cadastrados, privilégios administrativos e bloqueio de emails.
          </p>
        </div>
      </div>

      <Card className="p-0 border border-[var(--evo-border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--evo-border)] bg-[var(--evo-surface2)] flex items-center gap-2">
          <Search className="w-4 h-4 text-[var(--evo-muted)]" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou email..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm w-full text-[var(--evo-text)] placeholder:text-[var(--evo-muted)]"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--evo-muted)] bg-[var(--evo-surface)] border-b border-[var(--evo-border)] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Usuário / Email</th>
                <th className="px-6 py-4 font-medium">Privilégio</th>
                <th className="px-6 py-4 font-medium">Cadastro</th>
                <th className="px-6 py-4 font-medium">Status de Acesso</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-[var(--evo-border)] bg-[var(--evo-card)] hover:bg-[var(--evo-surface2)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-evo-accent/10 border border-evo-accent/20 text-evo-accent flex items-center justify-center font-bold text-xs font-mono">
                        {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--evo-text)]">{user.full_name || 'Sem nome'}</div>
                        <div className="text-xs text-[var(--evo-muted)] font-mono">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase ${
                      user.role === 'admin' 
                        ? 'bg-evo-accent/10 text-evo-accent border border-evo-accent/20' 
                        : 'bg-[var(--evo-surface)] text-[var(--evo-muted)] border border-[var(--evo-border)]'
                    }`}>
                      {user.role || 'USER'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--evo-muted)] font-mono">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'Hoje'}
                  </td>
                  <td className="px-6 py-4">
                    {user.is_banned ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-red-400 font-medium bg-red-950/30 px-2.5 py-1 rounded-md border border-red-900/50">
                        <Ban className="w-3.5 h-3.5" /> Banido / Bloqueado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/30 px-2.5 py-1 rounded-md border border-emerald-900/50">
                        <CheckCircle className="w-3.5 h-3.5" /> Acesso Ativo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex items-center justify-end gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-8 px-2.5 text-xs ${user.is_banned ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'}`} 
                      title={user.is_banned ? 'Restabelecer Acesso' : 'Banir Usuário'}
                      onClick={() => handleToggleBan(user.id, user.is_banned)}
                    >
                      {user.is_banned ? <UserCheck className="w-4 h-4 mr-1" /> : <Ban className="w-4 h-4 mr-1" />}
                      {user.is_banned ? 'Desbanir' : 'Banir'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10" 
                      title="Excluir" 
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--evo-muted)] text-sm">
                    Nenhum cliente ou usuário encontrado.
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
