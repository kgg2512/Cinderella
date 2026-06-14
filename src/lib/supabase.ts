import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isDemoMode, DEMO_USER } from "@/lib/demo";

// HMR 중 인스턴스 중복 생성 방지 (PKCE code verifier 충돌 방지)
declare global {
  // eslint-disable-next-line no-var
  var __supabase: SupabaseClient<Database> | undefined;
}

/**
 * 데모 모드 stub 빌더.
 *
 * 데모 모드(NEXT_PUBLIC_DEMO_MODE=true)에서는 실제 Supabase 호출을 일절 하지 않는다.
 * 화면 컴포넌트는 isDemoMode() 분기로 DEMO 데이터를 직접 주입하지만,
 * 기존 client-actions(wishlist/chats 등)가 supabase 체이닝을 호출해도 절대 throw하지
 * 않도록 "빈 결과 + error 없음"을 resolve하는 thenable 프록시를 제공한다.
 *
 * 쿼리 체인(from().select().eq()...)은 모든 메서드가 자기 자신(thenable)을 반환해
 * await 시 { data: [], error: null }로 귀결된다. .single()/.maybeSingle()만 단일 null.
 */
function createDemoStub(): SupabaseClient<Database> {
  // 리스트 쿼리 기본 결과: 빈 배열 + error 없음
  const listResult = { data: [], error: null, count: 0 };
  // 단건 쿼리 결과: null + error 없음 (PGRST116 같은 에러도 던지지 않음)
  const singleResult = { data: null, error: null };

  // 모든 체이닝 메서드가 동일 빌더를 반환하는 thenable 쿼리 프록시
  function makeQuery(result: { data: unknown; error: null; count?: number }) {
    const query: Record<string, unknown> = {
      // await 시 resolve되는 thenable
      then: (resolve: (v: unknown) => unknown) => resolve(result),
      catch: () => query,
      finally: (cb: () => void) => {
        cb();
        return query;
      },
      // 단건으로 좁히는 메서드는 single 결과로 전환
      single: () => makeQuery(singleResult),
      maybeSingle: () => makeQuery(singleResult),
    };
    // 체이닝 필터/정렬/페이지네이션 메서드는 전부 자기 자신 반환
    for (const m of [
      "select", "insert", "update", "upsert", "delete",
      "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is", "in",
      "or", "and", "not", "filter", "match", "contains", "overlaps",
      "order", "limit", "range", "abortSignal", "csv", "geojson", "explain",
    ]) {
      query[m] = () => query;
    }
    return query;
  }

  const authResult = {
    data: {
      user: {
        id: DEMO_USER.id,
        email: DEMO_USER.email,
        user_metadata: {
          full_name: DEMO_USER.name,
          name: DEMO_USER.name,
          avatar_url: DEMO_USER.avatar_url,
        },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      },
    },
    error: null,
  };

  const channelStub = {
    on: () => channelStub,
    subscribe: () => channelStub,
    unsubscribe: () => Promise.resolve("ok"),
  };

  const stub = {
    from: () => makeQuery(listResult),
    rpc: () => makeQuery(listResult),
    channel: () => channelStub,
    removeChannel: () => Promise.resolve("ok"),
    auth: {
      getUser: () => Promise.resolve(authResult),
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      signInWithOAuth: () =>
        Promise.resolve({ data: { url: null, provider: "google" }, error: null }),
      exchangeCodeForSession: () =>
        Promise.resolve({ data: { session: null, user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        remove: () => Promise.resolve({ data: null, error: null }),
      }),
    },
  };

  // 타입은 실제 클라이언트로 위장 (호출 표면만 호환되면 충분)
  return stub as unknown as SupabaseClient<Database>;
}

function createRealClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey)
    throw new Error(
      "Supabase env vars missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      // false 필수: auth/callback 페이지에서 exchangeCodeForSession을 명시 호출한다.
      // true면 자동 교환과 이중 실행되어 1회용 PKCE code가 먼저 소비된 쪽만 성공하고
      // 나머지가 실패해 /login으로 튕기는 race가 발생한다.
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export const supabase: SupabaseClient<Database> =
  globalThis.__supabase ??
  (globalThis.__supabase = isDemoMode() ? createDemoStub() : createRealClient());
