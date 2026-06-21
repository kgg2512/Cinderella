// prod Supabase Storage 현황 진단 (읽기 전용): 버킷·객체수·경로패턴·RLS 정책
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

const c = await connect();
try {
  const b = await c.query("select name, public, file_size_limit, allowed_mime_types from storage.buckets order by name");
  console.log("=== BUCKETS ===");
  console.log(b.rows.length ? JSON.stringify(b.rows, null, 2) : "(버킷 없음)");

  const o = await c.query("select bucket_id, count(*)::int as objects from storage.objects group by bucket_id order by bucket_id");
  console.log("=== OBJECT COUNT by bucket ===");
  console.log(o.rows.length ? JSON.stringify(o.rows, null, 2) : "(객체 없음)");

  const s = await c.query("select bucket_id, name, owner from storage.objects order by created_at desc nulls last limit 8");
  console.log("=== SAMPLE paths (최근 8) ===");
  console.log(s.rows.length ? JSON.stringify(s.rows, null, 2) : "(샘플 없음)");

  const pol = await c.query("select policyname, cmd, roles, qual, with_check from pg_policies where schemaname='storage' and tablename='objects' order by policyname");
  console.log("=== storage.objects RLS POLICIES ===");
  console.log(pol.rows.length ? JSON.stringify(pol.rows, null, 2) : "(정책 없음 — RLS 미설정?)");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await c.end();
}
