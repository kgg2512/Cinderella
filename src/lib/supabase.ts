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
      // false 필수: auth/callback 페이지에서 exchangeCodeForSession을 명시 호출한다.
      // true면 자동 교환과 이중 실행되어 1회용 PKCE code가 먼저 소비된 쪽만 성공하고
      // 나머지가 실패해 /login으로 튕기는 race가 발생한다.
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  }));
