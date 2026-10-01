'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface UserProfile {
  name: string;
  firstName: string;
  email: string;
  initials: string;
  role: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Rafael',
  firstName: 'Rafael',
  email: '',
  initials: 'RC',
  role: 'EVO PIXEL Gestão',
};

function formatUserProfile(user: any, dbFullName?: string, dbRole?: string): UserProfile {
  const fullName = dbFullName || user.user_metadata?.full_name || user.user_metadata?.name;
  const rawName = fullName || user.email?.split('@')[0] || 'Usuário';
  const nameParts = rawName.trim().split(/\s+/);
  const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();

  let initials = 'EV';
  if (nameParts.length > 1) {
    initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  } else if (rawName.length >= 2) {
    initials = rawName.slice(0, 2).toUpperCase();
  }

  const role =
    user.user_metadata?.role === 'admin' || dbRole === 'admin'
      ? 'Administrador EVO PIXEL'
      : 'EVO PIXEL Gestão';

  return {
    name: rawName,
    firstName,
    email: user.email || '',
    initials,
    role,
  };
}

export function useUser() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('evo_user_profile');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return DEFAULT_PROFILE;
  });

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function applyUser(user: any) {
      if (!user) return;
      try {
        let dbFullName: string | undefined;
        let dbRole: string | undefined;

        if (!user.user_metadata?.full_name) {
          const { data: dbUser } = await supabase
            .from('users')
            .select('full_name, role')
            .eq('id', user.id)
            .maybeSingle();

          if (dbUser) {
            dbFullName = dbUser.full_name;
            dbRole = dbUser.role;
          }
        }

        const newProfile = formatUserProfile(user, dbFullName, dbRole);

        if (mounted) {
          setProfile((prev) => {
            if (
              prev.name === newProfile.name &&
              prev.email === newProfile.email &&
              prev.role === newProfile.role &&
              prev.initials === newProfile.initials
            ) {
              return prev; // Evita re-render se os dados forem idênticos
            }
            if (typeof window !== 'undefined') {
              localStorage.setItem('evo_user_profile', JSON.stringify(newProfile));
            }
            return newProfile;
          });
        }
      } catch (err) {
        // Ignora silenciosamente
      }
    }

    // 1. Carrega imediatamente da sessão existente (sem fazer network request extra)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && mounted) {
        applyUser(session.user);
      }
    });

    // 2. Escuta mudanças na autenticação passando o session.user diretamente (zero loops)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        setProfile(DEFAULT_PROFILE);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('evo_user_profile');
        }
      } else if (session?.user) {
        applyUser(session.user);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return profile;
}

