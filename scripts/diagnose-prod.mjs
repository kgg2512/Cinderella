// prod Supabase 현재 상태 진단 (읽기 전용). 회장 자격증명은 .env.local에서 node가 직접 로드 → 콘솔 미노출.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const env = Object.fromEntries(
  raw.split(/\r?\n/).filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) { console.log("MISSING url/key in .env.local"); process.exit(1); }
console.log("project host:", new URL(url).host); // 공개 URL(비밀 아님)

const sb = createClient(url, key, { auth: { persistSession: false } });
const tables = ["users", "items", "transactions", "chats", "messages", "wishlist"];
for (const t of tables) {
  try {
    const { error, count } = await sb.from(t).select("*", { count: "exact", head: true });
    console.log(t.padEnd(14), error ? `ERR ${error.code ?? ""} ${error.message}` : `OK (rows=${count})`);
  } catch (e) { console.log(t.padEnd(14), "THROW", e.message); }
}
// RPC 존재 여부 (anon은 grant 없어 실행은 거부되지만, 함수 부재면 PGRST202로 구분됨)
try {
  const { error } = await sb.rpc("delete_current_user");
  console.log("rpc delete_current_user:", error ? `${error.code ?? ""} ${error.message}` : "callable");
} catch (e) { console.log("rpc delete_current_user: THROW", e.message); }
