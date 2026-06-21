// prod Supabase에 SQL 마이그레이션을 직접 적용(트랜잭션) + 검증.
// 자격증명: .env.local 의 SUPABASE_DB_PASSWORD (DB 비밀번호 한 개만) — host/user/port는 코드가 보유.
//           node가 직접 로드 → 비밀번호는 콘솔/Alpha에 노출되지 않는다.
//           SUPABASE_DB_URL(전체 connection string)이 있으면 그걸 우선 사용.
// 연결 실패 시 Direct → Session pooler 자동 폴백(IPv6 미지원 네트워크 대비).
// 사용: node scripts/apply-migration.mjs supabase/migrations/20260621000000_delete_account.sql
import pg from "pg";
import { readFileSync } from "fs";

const PROJECT_REF = "aykdkbjydinujcevuxls";
const REGION = "ap-northeast-2";

function loadEnv() {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  return Object.fromEntries(
    raw.split(/\r?\n/).filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
      .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
  );
}

const env = loadEnv();
const fullUrl = env.SUPABASE_DB_URL || process.env.SUPABASE_DB_URL;
const pw = env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_DB_PASSWORD;
if (!fullUrl && (!pw || pw.includes("PASTE"))) {
  console.error("MISSING credential. .env.local 에 다음 중 하나를 넣으세요:");
  console.error("  SUPABASE_DB_PASSWORD=<DB 비밀번호>   (권장 — 비번만)");
  console.error("  또는  SUPABASE_DB_URL=postgresql://postgres:<pw>@db." + PROJECT_REF + ".supabase.co:5432/postgres");
  process.exit(2);
}

const files = process.argv.slice(2);
if (!files.length) { console.error("usage: node scripts/apply-migration.mjs <file.sql> [...]"); process.exit(2); }

// 연결 후보: full URL 우선, 없으면 비번으로 Direct → Session pooler 순
const candidates = fullUrl
  ? [{ label: "SUPABASE_DB_URL", cfg: { connectionString: fullUrl, ssl: { rejectUnauthorized: false } } }]
  : [
      { label: "Direct (db." + PROJECT_REF + ")", cfg: { host: `db.${PROJECT_REF}.supabase.co`, port: 5432, user: "postgres", password: pw, database: "postgres", ssl: { rejectUnauthorized: false } } },
      { label: "Session pooler (" + REGION + ")", cfg: { host: `aws-0-${REGION}.pooler.supabase.com`, port: 5432, user: `postgres.${PROJECT_REF}`, password: pw, database: "postgres", ssl: { rejectUnauthorized: false } } },
    ];

let client = null;
for (const c of candidates) {
  const trial = new pg.Client({ ...c.cfg, connectionTimeoutMillis: 12000 });
  try {
    await trial.connect();
    console.log("connected via", c.label);
    client = trial;
    break;
  } catch (e) {
    console.log("connect failed via", c.label, "->", e.message);
    await trial.end().catch(() => {});
  }
}
if (!client) { console.error("ALL connection attempts failed."); process.exit(1); }

try {
  for (const f of files) {
    const sql = readFileSync(f, "utf8");
    process.stdout.write(`applying ${f} ... `);
    await client.query("begin");
    await client.query(sql);
    await client.query("commit");
    console.log("OK");
  }
  const fn = await client.query(
    "select proname from pg_proc where pronamespace = 'public'::regnamespace and proname = 'delete_current_user'"
  );
  const grant = await client.query(
    "select has_function_privilege('authenticated', 'public.delete_current_user()', 'execute') as authed, " +
    "has_function_privilege('anon', 'public.delete_current_user()', 'execute') as anon"
  ).catch(() => ({ rows: [{ authed: "n/a", anon: "n/a" }] }));
  console.log("verify delete_current_user exists:", fn.rowCount > 0 ? "YES" : "NO");
  console.log("grant execute -> authenticated:", grant.rows[0].authed, "| anon:", grant.rows[0].anon, "(anon must be false)");
} catch (e) {
  await client.query("rollback").catch(() => {});
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
