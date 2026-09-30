-- Script para integrar Supabase Auth com a tabela public.users do CRM

-- 1. Atualizar a tabela users para que o ID seja o mesmo do auth.users (UUID do Supabase)
-- (Caso já existam usuários, será necessário um script de migração para manter a integridade)

-- 2. Criar a tabela de Tenants (Multi-tenant)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    domain TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Adicionar tenant_id na tabela users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 4. Função (Trigger) para criar automaticamente um perfil em public.users quando alguém se cadastrar no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'admin' -- O primeiro usuário de um tenant geralmente é admin
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Tabela para o Menu Admin (Controle de Acesso e Gerenciamento)
-- A tabela public.users já serve para isso, mas podemos adicionar flags como 'banned'
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS banned_reason TEXT;

