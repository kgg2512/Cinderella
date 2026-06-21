// prod Supabase에 SQL 마이그레이션을 직접 적용(트랜잭션) + 검증.
// 자격증명: .env.local 의 SUPABASE_DB_URL (postgresql://postgres:[pw]@db.<ref>.supabase.co:5432/postgres)
//           — node가 직접 로드하므로 비밀번호는 콘솔/Alpha에 노출되지 않는다.
// 사용: node scripts/apply-migration.mjs supabase/migrations/20260621000000_delete_account.sql
import pg from "pg";
import { readFileSync } from "fs";

function loadEnv() {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  return Object.fromEntries(
    raw.split(/\r?\n/).filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
      .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
  );
}

const env = loadEnv();
const dbUrl = env.SUPABASE_DB_URL || process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("MISSING SUPABASE_DB_URL.");
  console.error("→ Supabase 대시보드 > Project Settings > Database > Connection string > URI 복사");
  console.error("→ .env.local 에 한 줄 추가:  SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.aykdkbjydinujcevuxls.supabase.co:5432/postgres");
  process.exit(2);
}
const files = process.argv.slice(2);
if (!files.length) { console.error("usage: node scripts/apply-migration.mjs <file.sql> [...]"); process.exit(2); }

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  for (const f of files) {
    const sql = readFileSync(f, "utf8");
    process.stdout.write(`applying ${f} ... `);
    await client.query("begin");
    await client.query(sql);
    await client.query("commit");
    console.log("OK");
  }
  // 검증: 탈퇴 RPC + grant 상태
  const fn = await client.query(
    "select proname from pg_proc where pronamespace = 'public'::regnamespace and proname = 'delete_current_user'"
  );
  const grant = await client.query(
    "select has_function_privilege('authenticated', 'public.delete_current_user()', 'execute') as authed, " +
    "has_function_privilege('anon', 'public.delete_current_user()', 'execute') as anon"
  ).catch(() => ({ rows: [{ authed: "n/a", anon: "n/a" }] }));
  console.log("verify delete_current_user exists:", fn.rowCount > 0 ? "YES" : "NO");
  console.log("grant execute → authenticated:", grant.rows[0].authed, "| anon:", grant.rows[0].anon, "(anon must be false)");
} catch (e) {
  await client.query("rollback").catch(() => {});
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
