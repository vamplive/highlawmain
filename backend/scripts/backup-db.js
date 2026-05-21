#!/usr/bin/env node
/**
 * SQLite DB 백업 스크립트 — better-sqlite3 의 원자적 backup() API 사용
 *
 * 사용:
 *   node backend/scripts/backup-db.js              # 기본 설정으로 백업
 *   node backend/scripts/backup-db.js --keep=30    # 최근 30개 유지
 *   node backend/scripts/backup-db.js --out=/path  # 출력 디렉토리 지정
 *
 * 환경변수(선택):
 *   DB_BACKUP_DIR   — 출력 디렉토리 (기본 backend/data/backups)
 *   DB_BACKUP_KEEP  — 보관할 파일 개수 (기본 14)
 *
 * 종료 코드:
 *   0 — 성공
 *   1 — 소스 DB 없음 / 백업 실패
 *
 * 왜 better-sqlite3 backup() 인가:
 *   - 단순 cp 는 쓰기 중이면 파일이 잘릴 수 있음 (WAL/SHM 분리 문제)
 *   - .dump 는 텍스트로 커져서 용량·속도 불리
 *   - sqlite3 CLI 의존 없이 Node 만으로 동작 → launchd/cron 배치 이식성 확보
 */

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

/** 간단한 CLI 인자 파서 (--key=value, --key value 모두 허용) */
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const [k, v] = a.slice(2).split("=");
    if (v !== undefined) args[k] = v;
    else if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
      args[k] = argv[++i];
    } else {
      args[k] = true;
    }
  }
  return args;
}

/** 로컬 타임존 기준 YYYY-MM-DD_HHmmss */
function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

/** 백업 파일명 패턴 검증 (안전한 이름만 삭제 대상에 포함) */
const BACKUP_FILENAME_RE = /^second-brain_\d{4}-\d{2}-\d{2}_\d{6}\.db$/;

/** 오래된 백업 로테이션: keep 개수만 남기고 삭제 */
function rotate(backupDir, keep) {
  const entries = fs
    .readdirSync(backupDir)
    .filter((f) => BACKUP_FILENAME_RE.test(f))
    .map((f) => ({
      name: f,
      full: path.join(backupDir, f),
      mtime: fs.statSync(path.join(backupDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  const toDelete = entries.slice(keep);
  for (const e of toDelete) {
    try {
      fs.unlinkSync(e.full);
      console.log(`[backup] rotated out: ${e.name}`);
    } catch (err) {
      console.error(`[backup] rotation delete failed (${e.name}): ${err.message}`);
    }
  }
  return { kept: entries.length - toDelete.length, removed: toDelete.length };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const sourceDb = path.resolve(
    __dirname,
    "..",
    "data",
    "db",
    "yjlaw.db",
  );
  const outDir = path.resolve(
    args.out || process.env.DB_BACKUP_DIR || path.join(__dirname, "..", "data", "backups"),
  );
  const keep = Number(args.keep || process.env.DB_BACKUP_KEEP || 14);

  if (!fs.existsSync(sourceDb)) {
    console.error(`[backup] source DB not found: ${sourceDb}`);
    process.exit(1);
  }
  if (!Number.isFinite(keep) || keep < 1) {
    console.error(`[backup] invalid --keep value (must be >=1): ${keep}`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const destName = `second-brain_${timestamp()}.db`;
  const destPath = path.join(outDir, destName);

  const startedAt = Date.now();
  const db = new Database(sourceDb, { readonly: true });
  try {
    await db.backup(destPath);
  } finally {
    db.close();
  }

  const elapsedMs = Date.now() - startedAt;
  const sizeKb = (fs.statSync(destPath).size / 1024).toFixed(1);
  console.log(
    `[backup] ok: ${destName} (${sizeKb} KB) in ${elapsedMs} ms → ${outDir}`,
  );

  const rot = rotate(outDir, keep);
  console.log(`[backup] retention: kept ${rot.kept}, removed ${rot.removed} (keep=${keep})`);
}

main().catch((err) => {
  console.error(`[backup] failed: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
