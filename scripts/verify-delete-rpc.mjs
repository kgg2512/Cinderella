// delete_current_user() 본문이 prod 스키마와 호환되는지 안전 dry-run 검증.
// 존재하지 않는 가짜 uid를 auth.uid()로 주입 → 본문 전 경로가 0행 매칭으로 통과(에러 없으면 스키마 호환)
// → 즉시 ROLLBACK(실데이터 변경 0). 회장 실계정 무손상.
import pg from "pg";
import { readFileSync } from "fs";

const PROJECT_REF = "aykdkbjydinujcevuxls";
const REGION = "ap-northeast-2";
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
);
const pw = env.SUPABASE_DB_PASSWORD;
const FAKE_UID = "00000000-0000-0000-0000-0000000000ff"; // 실제로 없는 uid

async function connect() {
  for (const cfg of [
    { host: `db.${PROJECT_REF}.supabase.co`, port: 5432, user: "postgres", password: pw, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 12000 },
    { host: `aws-0-${REGION}.pooler.supabase.com`, port: 5432, user: `postgres.${PROJECT_REF}`, password: pw, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 12000 },
  ]) {
    const c = new pg.Client(cfg);
    try { await c.connect(); return c; } catch (e) { console.log("connect failed:", e.message); await c.end().catch(() => {}); }
  }
  throw new Error("no connection");
}

const client = await connect();
try {
  await client.query("begin");
  await client.query(`select set_config('request.jwt.claims', '{"sub":"${FAKE_UID}","role":"authenticated"}', true)`);
  const uidCheck = await client.query("select auth.uid() as uid");
  console.log("injected auth.uid() =", uidCheck.rows[0].uid);
  await client.query("select public.delete_current_user()");
  console.log("DRY-RUN OK: 본문 전 경로가 prod 스키마와 호환 (0행 매칭, 에러 없음)");
  await client.query("rollback");
  console.log("ROLLED BACK: 실데이터 변경 0건");
} catch (e) {
  await client.query("rollback").catch(() => {});
  console.error("DRY-RUN FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
