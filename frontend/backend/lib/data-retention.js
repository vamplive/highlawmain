/**
 * 데이터 보존 정책 — 불필요한 개인정보 자동 삭제
 * - 듀오 사태 교훈: 필요 이상의 개인정보를 보관하지 않는다
 * - 정기적으로 실행하여 오래된 데이터를 정리
 *
 * 보존 기간:
 * - 페이지뷰 로그: 90일
 * - 메시지 발송 로그: 1년
 * - 챗봇 세션: 30일
 * - 감사 로그: 2년 (법적 요구사항)
 */
const path = require("path");
const fs = require("fs");

/**
 * 데이터 보존 정책 실행
 * @param {import("better-sqlite3").Database} sqlite
 */
function runRetentionPolicy(sqlite) {
  const results = [];

  // 1. 페이지뷰 로그 — 90일 초과 삭제
  try {
    const r = sqlite.prepare(
      "DELETE FROM page_views WHERE created_at < datetime('now', '-90 days')"
    ).run();
    if (r.changes > 0) results.push(`page_views: ${r.changes}건 삭제`);
  } catch (e) { results.push(`page_views 실패: ${e.message}`); }

  // 2. 챗봇 세션 — 30일 초과 삭제
  try {
    const r = sqlite.prepare(
      "DELETE FROM chat_sessions WHERE updated_at < datetime('now', '-30 days')"
    ).run();
    if (r.changes > 0) results.push(`chat_sessions: ${r.changes}건 삭제`);
  } catch (e) { results.push(`chat_sessions 실패: ${e.message}`); }

  // 3. 메시지 발송 로그 — 1년 초과, 개인정보 익명화
  try {
    const r = sqlite.prepare(
      "UPDATE message_logs SET recipient_name = '(삭제됨)', recipient_contact = '(삭제됨)' WHERE created_at < datetime('now', '-365 days') AND recipient_name != '(삭제됨)'"
    ).run();
    if (r.changes > 0) results.push(`message_logs 익명화: ${r.changes}건`);
  } catch (e) { results.push(`message_logs 실패: ${e.message}`); }

  // 4. 만료된 예약 메시지 — 6개월 초과 삭제
  try {
    const r = sqlite.prepare(
      "DELETE FROM scheduled_messages WHERE status IN ('sent', 'failed', 'cancelled') AND created_at < datetime('now', '-180 days')"
    ).run();
    if (r.changes > 0) results.push(`scheduled_messages: ${r.changes}건 삭제`);
  } catch (e) { results.push(`scheduled_messages 실패: ${e.message}`); }

  // 5. 블로그 조회 이벤트 — 6개월 초과 삭제
  try {
    const r = sqlite.prepare(
      "DELETE FROM blog_view_events WHERE created_at < datetime('now', '-180 days')"
    ).run();
    if (r.changes > 0) results.push(`blog_view_events: ${r.changes}건 삭제`);
  } catch (e) { results.push(`blog_view_events 실패: ${e.message}`); }

  // 6. OTP 본인확인 이력 — 6개월 초과 개인정보/챌린지 익명화
  try {
    const r = sqlite.prepare(`
      UPDATE identity_verifications
      SET phone_number = '(삭제됨)',
          challenge_hash = NULL,
          provider_response = NULL,
          ip_address = NULL,
          user_agent = NULL
      WHERE created_at < datetime('now', '-180 days')
        AND (phone_number IS NOT NULL OR challenge_hash IS NOT NULL OR ip_address IS NOT NULL)
    `).run();
    if (r.changes > 0) results.push(`identity_verifications 익명화: ${r.changes}건`);
  } catch (e) { results.push(`identity_verifications 실패: ${e.message}`); }

  // 7. 상담 생성에 연결되지 않은 임시 개인정보 동의/서명 — 30일 초과 삭제
  try {
    const orphanConsentSignatures = sqlite.prepare(`
      SELECT signature_id FROM privacy_consents
      WHERE consultation_id IS NULL
        AND client_id IS NULL
        AND consented_at < datetime('now', '-30 days')
    `).all().map((row) => row.signature_id).filter(Boolean);

    const r = sqlite.prepare(`
      DELETE FROM privacy_consents
      WHERE consultation_id IS NULL
        AND client_id IS NULL
        AND consented_at < datetime('now', '-30 days')
    `).run();

    if (orphanConsentSignatures.length > 0) {
      const delSig = sqlite.prepare("DELETE FROM signatures WHERE id = ?");
      for (const id of orphanConsentSignatures) delSig.run(id);
    }
    if (r.changes > 0) results.push(`privacy_consents 임시 레코드: ${r.changes}건 삭제`);
  } catch (e) { results.push(`privacy_consents 실패: ${e.message}`); }

  // 8. 완료/취소/만료된 초대 링크 — 1년 초과 사전입력 개인정보 익명화
  try {
    const r = sqlite.prepare(`
      UPDATE invitations
      SET prefilled_name = NULL,
          prefilled_phone = NULL,
          prefilled_email = NULL,
          notes = NULL
      WHERE (
          status IN ('completed', 'cancelled')
          OR (expires_at IS NOT NULL AND expires_at < datetime('now'))
        )
        AND updated_at < datetime('now', '-365 days')
        AND (prefilled_name IS NOT NULL OR prefilled_phone IS NOT NULL OR prefilled_email IS NOT NULL OR notes IS NOT NULL)
    `).run();
    if (r.changes > 0) results.push(`invitations 개인정보 익명화: ${r.changes}건`);
  } catch (e) { results.push(`invitations 실패: ${e.message}`); }

  // 9. 감사 로그 파일 — 2년 초과 삭제
  try {
    const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
    const auditDir = path.join(STORAGE_PATH, "audit");
    if (fs.existsSync(auditDir)) {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const files = fs.readdirSync(auditDir).filter((f) => f.startsWith("audit-") && f.endsWith(".jsonl"));
      let deleted = 0;
      for (const file of files) {
        const dateStr = file.replace("audit-", "").replace(".jsonl", "");
        if (new Date(dateStr) < twoYearsAgo) {
          fs.unlinkSync(path.join(auditDir, file));
          deleted++;
        }
      }
      if (deleted > 0) results.push(`audit logs: ${deleted}개 파일 삭제`);
    }
  } catch (e) { results.push(`audit logs 실패: ${e.message}`); }

  if (results.length > 0) {
    console.log("[데이터 보존] 정리 완료:", results.join(", "));
  }
}

module.exports = { runRetentionPolicy };
