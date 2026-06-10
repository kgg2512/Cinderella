/**
 * capacitor-build.mjs
 *
 * Next.js 세그먼트 설정(dynamicParams)은 리터럴 불리언만 허용되어
 * 환경변수 분기가 불가능하다 (Turbopack 빌드 에러).
 *
 * 해결: 빌드 전 동적 라우트 page.tsx의 @capacitor-swap 블록을
 * 모바일용(dynamicParams=false + placeholder)으로 치환하고,
 * 빌드 종료 후 (성공/실패 무관) 웹용으로 복원한다.
 *
 * 실행: npm run build:mobile
 */
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const PAGES = [
  "src/app/items/[id]/page.tsx",
  "src/app/transactions/[id]/page.tsx",
  "src/app/chats/[id]/page.tsx",
];

const WEB_BLOCK = `export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}`;

const MOBILE_BLOCK = `export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}`;

function swap(from, to) {
  for (const p of PAGES) {
    // CRLF 환경(git autocrlf) 대비 LF로 정규화 후 치환
    const src = readFileSync(p, "utf8").replace(/\r\n/g, "\n");
    if (!src.includes(from)) {
      throw new Error(`${p}: 치환 대상 블록을 찾지 못함 — @capacitor-swap 블록 확인 필요`);
    }
    writeFileSync(p, src.replace(from, to));
  }
}

console.log("[capacitor-build] 동적 라우트 → 모바일(정적) 설정으로 치환");
swap(WEB_BLOCK, MOBILE_BLOCK);

let status = 1;
try {
  const r = spawnSync("npx", ["cross-env", "CAPACITOR_BUILD=true", "next", "build"], {
    stdio: "inherit",
    shell: true,
  });
  status = r.status ?? 1;
} finally {
  console.log("[capacitor-build] 동적 라우트 → 웹 설정으로 복원");
  swap(MOBILE_BLOCK, WEB_BLOCK);
}

process.exit(status);
