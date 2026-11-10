import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  phone: string | null;
  name: string | null;
  language: 'en' | 'ta';
  preferred_time: string | null;
  consent_whatsapp: boolean;
  consent_push: boolean;
  onboarding_complete: boolean;
};

export type Programme = {
  id: string;
  user_id: string;
  start_date: string;
  status: 'active' | 'completed' | 'paused' | 'reset';
  current_day: number;
  streak: number;
  longest_streak: number;
  missed_days: number;
  consecutive_misses: number;
};

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  programme: Programme | null;
  loading: boolean;
  bootstrap: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProgramme: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  programme: null,
  loading: true,

  bootstrap: async () => {
    set({ loading: true });
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    set({ session });

    supabase.auth.onAuthStateChange((_event, s) => {
      set({ session: s });
      if (s?.user) {
        loadProfile(s.user.id).then((p) => set({ profile: p }));
        get().refreshProgramme();
      } else {
        set({ profile: null, programme: null });
      }
    });

    if (session?.user) {
      const profile = await loadProfile(session.user.id);
      set({ profile });
      await get().refreshProgramme();
    }
    set({ loading: false });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null, programme: null });
  },

  refreshProgramme: async () => {
    const uid = get().session?.user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from('programmes')
      .select('*')
      .eq('user_id', uid)
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    set({ programme: (data as Programme | null) ?? null });
  },
}));

async function loadProfile(uid: string): Promise<Profile | null> {
  const { data } = await supabase.from('users').select('*').eq('id', uid).maybeSingle();
  return (data as Profile | null) ?? null;
}
