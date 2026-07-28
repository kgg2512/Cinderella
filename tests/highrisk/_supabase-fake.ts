/**
 * 서버 액션 테스트용 최소 Supabase 더블. 실 네트워크·실 DB 접속 0.
 *
 * 왜 직접 만드는가: 서버 액션이 쓰는 표면은 `auth.getUser` + 체이닝
 * (`from().select().eq().single()` / `.insert().select().single()` / `.update().eq()`)
 * 뿐이다. 이만큼을 위해 새 의존성을 들이지 않는다(K2 = 신규 의존성 추가 금지).
 *
 * 파일명이 `.test.ts` 가 아니므로 vitest include 에 잡히지 않는다(헬퍼).
 */

export interface Op {
  table: string;
  kind: "select" | "insert" | "update";
  values?: Record<string, unknown>;
  filters: Array<[string, unknown]>;
  cols?: string;
  single: boolean;
}

export type Reply = { data?: unknown; error?: unknown };

export interface FakeSupabase {
  auth: { getUser: () => Promise<{ data: { user: unknown }; error: unknown }> };
  from: (table: string) => unknown;
  ops: Op[];
  /** 특정 종류/테이블의 연산만 추린다. */
  opsOf: (kind: Op["kind"], table?: string) => Op[];
}

export function createFakeSupabase(
  user: { id: string } | null,
  handler: (op: Op) => Reply,
): FakeSupabase {
  const ops: Op[] = [];

  const client: FakeSupabase = {
    auth: {
      getUser: async () => ({
        data: { user },
        error: user ? null : { message: "not authenticated" },
      }),
    },
    from(table: string) {
      const op: Op = { table, kind: "select", filters: [], single: false };
      const settle = () => {
        if (!ops.includes(op)) ops.push(op);
        return Promise.resolve({ data: null, error: null, ...handler(op) });
      };
      const builder: Record<string, unknown> = {
        select(cols: string) {
          op.cols = cols;
          return builder;
        },
        insert(values: Record<string, unknown>) {
          op.kind = "insert";
          op.values = values;
          return builder;
        },
        update(values: Record<string, unknown>) {
          op.kind = "update";
          op.values = values;
          return builder;
        },
        eq(k: string, v: unknown) {
          op.filters.push([k, v]);
          return builder;
        },
        order() {
          return builder;
        },
        single: () => settle(),
        // await 로 종결되는 형태(`.update().eq()`)를 위해 thenable 로 만든다.
        then: (res: unknown, rej: unknown) =>
          settle().then(res as never, rej as never),
      };
      return builder;
    },
    ops,
    opsOf: (kind, table) =>
      ops.filter((o) => o.kind === kind && (table === undefined || o.table === table)),
  };

  return client;
}
