import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase env vars missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');

// HMR 중 인스턴스 중복 생성 방지 (PKCE code verifier 충돌 방지)
declare global {
  // eslint-disable-next-line no-var
  var __supabase: SupabaseClient<Database> | undefined;
}

export const supabase: SupabaseClient<Database> =
  globalThis.__supabase ??
  (globalThis.__supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  }));
