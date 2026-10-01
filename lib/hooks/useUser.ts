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

export function useUser() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    // Tenta carregar do localStorage imediatamente para evitar flash
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('evo_user_profile');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return {
      name: 'Rafael',
      firstName: 'Rafael',
      email: '',
      initials: 'RC',
      role: 'EVO PIXEL Gestão',
    };
  });

  useEffect(() => {
    let mounted = true;

    async function loadUserData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          let fullName = user.user_metadata?.full_name || user.user_metadata?.name;

          // Se não encontrou no metadata, tenta buscar na tabela public.users
          if (!fullName) {
            const { data: dbUser } = await supabase
              .from('users')
              .select('full_name, role')
              .eq('id', user.id)
              .maybeSingle();

            if (dbUser?.full_name) {
              fullName = dbUser.full_name;
            }
          }

          const rawName = fullName || user.email?.split('@')[0] || 'Usuário';
          const nameParts = rawName.trim().split(/\s+/);
          const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
          
          let initials = 'EV';
          if (nameParts.length > 1) {
            initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
          } else if (rawName.length >= 2) {
            initials = rawName.slice(0, 2).toUpperCase();
          }

          const newProfile: UserProfile = {
            name: rawName,
            firstName,
            email: user.email || '',
            initials,
            role: user.user_metadata?.role === 'admin' ? 'Administrador EVO PIXEL' : 'EVO PIXEL Gestão',
          };

          if (mounted) {
            setProfile(newProfile);
            if (typeof window !== 'undefined') {
              localStorage.setItem('evo_user_profile', JSON.stringify(newProfile));
            }
          }
        }
      } catch (err) {
        // Ignora silenciosamente se o Supabase não estiver acessível
      }
    }

    loadUserData();

    // Listener para atualizações na sessão
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUserData();
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return profile;
}
