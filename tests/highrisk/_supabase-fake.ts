/**
 * 서버 액션 테스트용 최소 Supabase 더블. 실 네트워크·실 DB 접속 0.
 *
 * 왜 직접 만드는가: 서버 액션이 쓰는 표면은 `auth.getUser` + 체이닝
 * (`from().select().eq().single()` / `.insert().select().single()` / `.update().eq()`)
 * 뿐이다. 이만큼을 위해 새 의존성을 들이지 않는다.
 *
 * ── 2026-07-31 M5 개정: **필터를 실제로 적용한다** ─────────────────────────────
 * 독립 검토(2026-07-30)가 잡은 결함: 이전 판은 `.eq(k,v)` 를 **기록만** 하고 어떤 행을
 * 돌려줄지는 `handler(op)` 가 테이블·종류만 보고 정했다. 그 결과 액션의 조회 필터를
 * 엉뚱한 값으로 바꿔도(`.eq("id", "WRONG")`) **21/21 테스트가 전부 초록**이었다 —
 * "틀린 행을 조회하는" 회귀를 원리적으로 못 잡았다.
 *
 * 이제는 테이블별 **행 저장소**를 두고 `.eq()` 를 진짜로 걸러낸다.
 * 필터가 어긋나면 매칭 0행 → `.single()` 이 `data:null, error` 를 돌려주고,
 * 액션은 "찾을 수 없습니다" 경로로 떨어진다 → 테스트가 빨간불이 된다.
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
  /** 이 연산이 실제로 매칭한 행 수 (필터 적용 결과) */
  matched?: number;
}

export type Row = Record<string, unknown>;
/** 테이블명 → 행 배열. 액션이 조회할 수 있는 "DB 내용"이다. */
export type Tables = Record<string, Row[]>;

export interface FakeSupabase {
  auth: { getUser: () => Promise<{ data: { user: unknown }; error: unknown }> };
  from: (table: string) => unknown;
  ops: Op[];
  opsOf: (kind: Op["kind"], table?: string) => Op[];
  /** 현재 행 저장소(insert/update 반영 후 상태 확인용) */
  tables: Tables;
}

function matches(row: Row, filters: Array<[string, unknown]>) {
  return filters.every(([k, v]) => row[k] === v);
}

export function createFakeSupabase(
  user: { id: string } | null,
  tables: Tables,
  /** 선택: insert 가 돌려줄 행(예: 새 id). 없으면 values 를 그대로 돌려준다. */
  onInsert?: (table: string, values: Row) => Row,
): FakeSupabase {
  const ops: Op[] = [];
  const store: Tables = {};
  for (const [t, rows] of Object.entries(tables)) store[t] = rows.map((r) => ({ ...r }));

  const client: FakeSupabase = {
    auth: {
      getUser: async () => ({
        data: { user },
        error: user ? null : { message: "not authenticated" },
      }),
    },
    from(table: string) {
      const op: Op = { table, kind: "select", filters: [], single: false };
      const rows = () => (store[table] ??= []);

      const settle = () => {
        if (!ops.includes(op)) ops.push(op);
        const hit = rows().filter((r) => matches(r, op.filters));
        op.matched = hit.length;

        if (op.kind === "insert") {
          const created = onInsert
            ? onInsert(table, op.values as Row)
            : ({ ...(op.values as Row) } as Row);
          rows().push(created);
          return Promise.resolve({ data: created, error: null });
        }
        if (op.kind === "update") {
          // 필터에 맞는 행에만 반영 — 0행이면 아무것도 안 바뀐다(실 DB와 동일).
          for (const r of hit) Object.assign(r, op.values);
          return Promise.resolve({ data: null, error: null });
        }
        // select
        if (op.single) {
          return Promise.resolve(
            hit.length === 1
              ? { data: { ...hit[0] }, error: null }
              : {
                  data: null,
                  error: {
                    code: "PGRST116",
                    message: `0 or many rows (matched=${hit.length})`,
                  },
                },
          );
        }
        return Promise.resolve({ data: hit.map((r) => ({ ...r })), error: null });
      };

      const builder: Record<string, unknown> = {
        select(cols: string) {
          op.cols = cols;
          return builder;
        },
        insert(values: Row) {
          op.kind = "insert";
          op.values = values;
          return builder;
        },
        update(values: Row) {
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
        single: () => {
          op.single = true;
          return settle();
        },
        // await 로 종결되는 형태(`.update().eq()`)를 위해 thenable 로 만든다.
        then: (res: unknown, rej: unknown) => settle().then(res as never, rej as never),
      };
      return builder;
    },
    ops,
    opsOf: (kind, table) =>
      ops.filter((o) => o.kind === kind && (table === undefined || o.table === table)),
    tables: store,
  };

  return client;
}
