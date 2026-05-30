/**
 * 초대(invitations) 생성 + SMS/이메일 발송 통합 유틸
 * - 3종 초대(consultation / engagement / settlement)를 하나의 함수로 처리
 * - sendSMS / sendEmail / messageLogs 기록까지 일괄 수행
 *
 * 관리자가 외부인에게 "행동 요청 링크"를 보내는 모든 지점에서 이 유틸을 사용한다.
 */
const crypto = require("crypto");
const { sqlite } = require("../db");
const { sendSMS } = require("./sms-service");
const { sendEmail } = require("./email-service");
const { logEvent } = require("./audit-log");

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:5173";
const DEFAULT_EXPIRES_DAYS = 14;
const FIRM_NAME = "법무법인 하이로";

/** 초대 URL 조립 */
function buildInviteUrl(token) {
  const base = PUBLIC_BASE_URL.replace(/\/$/, "");
  return `${base}/invite/${token}`;
}

/**
 * 템플릿 치환 — {name}, {url}, {expires}, {firm}, {title}
 * @param {string} template
 * @param {object} vars
 */
function renderTemplate(template, vars) {
  return String(template || "")
    .replace(/\{name\}/g, vars.name || "")
    .replace(/\{url\}/g, vars.url || "")
    .replace(/\{expires\}/g, vars.expires || "")
    .replace(/\{firm\}/g, vars.firm || FIRM_NAME)
    .replace(/\{title\}/g, vars.title || "");
}

/** 기본 SMS 본문 (템플릿 미선택 시) */
const DEFAULT_SMS_BY_TYPE = {
  consultation: "[{firm}] {name}님, 상담 신청 링크를 보내드립니다: {url} ({expires} 유효)",
  engagement: "[{firm}] {name}님, 위임계약서 서명을 요청드립니다: {url}",
  settlement: "[{firm}] {name}님, 합의서 서명을 요청드립니다. 본인 확인 후 서명해주세요: {url}",
};

const DEFAULT_EMAIL_SUBJECT_BY_TYPE = {
  consultation: "[{firm}] 상담 신청 링크 안내",
  engagement: "[{firm}] 위임계약서 서명 요청",
  settlement: "[{firm}] 합의서 서명 요청",
};

/**
 * 초대 생성 + 발송
 * @param {object} opts
 * @param {'consultation'|'engagement'|'settlement'} opts.type
 * @param {string} [opts.targetRef] - 연결 대상 (계약서/파티 id 등)
 * @param {string} [opts.name]
 * @param {string} [opts.phone]
 * @param {string} [opts.email]
 * @param {string} [opts.category]         - 상담초대용 분야
 * @param {number} [opts.expiresInDays=14]
 * @param {string} [opts.adminUserId]
 * @param {string[]} [opts.channels=['sms']] - 'sms' | 'email'
 * @param {string} [opts.smsTemplate]      - 커스텀 SMS 본문
 * @param {string} [opts.emailSubject]
 * @param {string} [opts.emailHtml]
 * @param {string} [opts.title]            - 계약서 제목(치환용)
 * @param {string} [opts.contractId]
 * @param {string} [opts.partyId]
 * @returns {Promise<{ invitation, smsResult?, emailResult? }>}
 */
async function createAndSendInvitation(opts) {
  if (!opts || !opts.type) throw new Error("초대 유형이 필요합니다");
  if (!["consultation", "engagement", "settlement"].includes(opts.type)) {
    throw new Error("지원하지 않는 초대 유형");
  }

  const channels = (opts.channels && opts.channels.length > 0) ? opts.channels : ["sms"];
  const id = crypto.randomUUID();
  const token = crypto.randomBytes(24).toString("base64url");
  const expiresInDays = opts.expiresInDays || DEFAULT_EXPIRES_DAYS;
  const expiresAt = new Date(Date.now() + expiresInDays * 86400_000).toISOString();
  const url = buildInviteUrl(token);

  sqlite.prepare(`
    INSERT INTO invitations (
      id, type, token, target_ref, prefilled_name, prefilled_phone, prefilled_email,
      category, status, sent_at, expires_at, created_by_admin_id,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sent', datetime('now'), ?, ?, datetime('now'), datetime('now'))
  `).run(
    id, opts.type, token, opts.targetRef || null,
    opts.name || null, opts.phone || null, opts.email || null,
    opts.category || null, expiresAt, opts.adminUserId || null,
  );

  const vars = {
    name: opts.name || "귀하",
    url,
    expires: formatExpires(expiresAt),
    firm: FIRM_NAME,
    title: opts.title || "",
  };

  const result = { invitation: { id, type: opts.type, token, url, expiresAt } };

  // SMS 발송
  if (channels.includes("sms") && opts.phone) {
    const template = opts.smsTemplate || DEFAULT_SMS_BY_TYPE[opts.type] || DEFAULT_SMS_BY_TYPE.consultation;
    const text = renderTemplate(template, vars);
    const sr = await sendSMS(opts.phone, text);
    // message_logs 기록
    const logId = crypto.randomUUID();
    sqlite.prepare(`
      INSERT INTO message_logs (
        id, channel, recipient_name, recipient_contact, template_id,
        content, status, error_message, sent_at, metadata, created_at
      ) VALUES (?, 'sms', ?, ?, NULL, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      logId,
      opts.name || null,
      opts.phone,
      text,
      sr.success ? "sent" : "failed",
      sr.error || null,
      sr.success ? new Date().toISOString() : null,
      JSON.stringify({ invitationId: id, type: opts.type, contractId: opts.contractId, partyId: opts.partyId }),
    );
    sqlite.prepare("UPDATE invitations SET message_log_id = ? WHERE id = ?").run(logId, id);
    result.smsResult = { ...sr, logId };
  }

  // 이메일 발송
  if (channels.includes("email") && opts.email) {
    const subject = renderTemplate(opts.emailSubject || DEFAULT_EMAIL_SUBJECT_BY_TYPE[opts.type] || "초대", vars);
    const html = opts.emailHtml
      ? renderTemplate(opts.emailHtml, vars)
      : defaultEmailHtml(opts.type, vars);
    const er = await sendEmail(opts.email, subject, html);
    const logId = crypto.randomUUID();
    sqlite.prepare(`
      INSERT INTO message_logs (
        id, channel, recipient_name, recipient_contact, template_id,
        subject, content, status, error_message, sent_at, metadata, created_at
      ) VALUES (?, 'email', ?, ?, NULL, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      logId,
      opts.name || null,
      opts.email,
      subject,
      html,
      er.success ? "sent" : "failed",
      er.error || null,
      er.success ? new Date().toISOString() : null,
      JSON.stringify({ invitationId: id, type: opts.type, contractId: opts.contractId, partyId: opts.partyId }),
    );
    sqlite.prepare("UPDATE invitations SET email_message_log_id = ? WHERE id = ?").run(logId, id);
    result.emailResult = { ...er, logId };
  }

  // 감사 로그
  logEvent({
    contractId: opts.contractId,
    partyId: opts.partyId,
    invitationId: id,
    actorType: "admin",
    actorIdentifier: opts.adminUserId || null,
    action: "link_sent",
    details: {
      type: opts.type,
      channels,
      smsSuccess: result.smsResult?.success,
      emailSuccess: result.emailResult?.success,
    },
  });

  return result;
}

function formatExpires(isoString) {
  try {
    const d = new Date(isoString);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  } catch { return "14일 이내"; }
}

function defaultEmailHtml(type, vars) {
  const labelByType = {
    consultation: "상담 신청 링크",
    engagement: "위임계약서 서명",
    settlement: "합의서 서명",
  };
  const label = labelByType[type] || "링크";
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#222">
      <h2 style="color:#b08d57;font-weight:600">${vars.firm}</h2>
      <p>${vars.name}님,</p>
      <p>${label}을(를) 보내드립니다. 아래 버튼을 눌러 진행해주세요.</p>
      <p style="text-align:center;margin:32px 0">
        <a href="${vars.url}" style="display:inline-block;padding:12px 28px;background:#b08d57;color:#fff;text-decoration:none;border-radius:4px;font-weight:600">
          진행하기
        </a>
      </p>
      <p style="font-size:12px;color:#666">링크 만료: ${vars.expires}</p>
      <p style="font-size:12px;color:#999">링크가 동작하지 않을 경우 아래 주소를 복사해서 붙여넣으세요:<br>${vars.url}</p>
    </div>
  `;
}

module.exports = {
  createAndSendInvitation,
  buildInviteUrl,
  renderTemplate,
};
