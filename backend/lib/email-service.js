/**
 * 이메일 발송 서비스 (Nodemailer + Gmail SMTP)
 * - 환경변수: GMAIL_USER, GMAIL_APP_PASSWORD
 */
const nodemailer = require("nodemailer");

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

/** Nodemailer 트랜스포터 (싱글톤) */
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

/**
 * 이메일 발송
 * @param {string} to - 수신 이메일
 * @param {string} subject - 제목
 * @param {string} html - HTML 본문
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
async function sendEmail(to, subject, html) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    return { success: false, error: "Gmail 계정 정보가 설정되지 않았습니다." };
  }

  try {
    // UTF-8 인코딩 명시하여 한글 깨짐 방지
    const info = await getTransporter().sendMail({
      from: `=?UTF-8?B?${Buffer.from("윤정 법률사무소").toString("base64")}?= <${GMAIL_USER}>`,
      to,
      subject,
      html,
      encoding: "utf-8",
      headers: { "Content-Type": "text/html; charset=UTF-8" },
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("[Email Error]", err.message || err);
    return { success: false, error: err.message || "이메일 발송에 실패했습니다." };
  }
}

module.exports = { sendEmail };
