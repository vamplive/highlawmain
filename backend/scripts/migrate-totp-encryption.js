#!/usr/bin/env node
/**
 * admin_users.totp_secret 평문 → AES-256-GCM 암호화 일괄 전환 스크립트
 *
 * 사용:
 *   node backend/scripts/migrate-totp-encryption.js          # 실제 적용
 *   node backend/scripts/migrate-totp-encryption.js --dry    # 변경 없이 카운트만 출력
 *
 * 멱등성:
 *   - isEncrypted() 가 true 인 행은 스킵하므로 여러 번 실행해도 안전.
 *   - 부분 실패 시(예: 일부 행만 처리) 다시 실행하면 남은 평문만 처리한다.
 *
 * 환경변수:
 *   - SECRETS_ENCRYPTION_KEY (필수, 운영) — backend/.env.example 참조
 *
 * 종료 코드:
 *   0 — 성공 (변경 없음 포함)
 *   1 — 키 미설정 등 치명적 에러
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });

const { sqlite } = require("../db");
const { encryptSecret, isEncrypted } = require("../lib/crypto-vault");

/** CLI 인자 파서 — `--dry`, `--dry-run` 지원 */
function parseArgs(argv) {
  return {
    dry: argv.includes("--dry") || argv.includes("--dry-run"),
  };
}

function main() {
  const { dry } = parseArgs(process.argv.slice(2));

  const rows = sqlite
    .prepare("SELECT id, totp_secret FROM admin_users WHERE totp_secret IS NOT NULL AND totp_secret <> ''")
    .all();

  let plaintext = 0;
  let alreadyEncrypted = 0;
  let updated = 0;

  const updateStmt = sqlite.prepare("UPDATE admin_users SET totp_secret = ? WHERE id = ?");

  for (const row of rows) {
    if (isEncrypted(row.totp_secret)) {
      alreadyEncrypted++;
      continue;
    }
    plaintext++;
    if (dry) continue;
    const enc = encryptSecret(row.totp_secret);
    updateStmt.run(enc, row.id);
    updated++;
  }

  // 사용자 가시 출력 — 운영자가 결과를 즉시 확인할 수 있어야 한다
  console.log(
    JSON.stringify(
      {
        mode: dry ? "dry-run" : "applied",
        scanned: rows.length,
        already_encrypted: alreadyEncrypted,
        plaintext_found: plaintext,
        updated,
      },
      null,
      2
    )
  );
}

try {
  main();
  process.exit(0);
} catch (e) {
  console.error("[migrate-totp-encryption] 실패:", e.message);
  process.exit(1);
}
