/**
 * 메시지 템플릿 시드 데이터
 * - 법률사무소에서 자주 사용하는 SMS/이메일 샘플 템플릿
 * - 실행: node seed-messages.js
 */
require("dotenv").config();
const { db } = require("../db");
const { messageTemplates } = require("../db/schema");

const SEED_TEMPLATES = [
  // ── SMS 템플릿 ──
  {
    name: "상담 접수 확인",
    channel: "sms",
    content: "[윤정 법률사무소] {name}님, 상담 신청이 접수되었습니다. 담당 변호사 배정 후 연락드리겠습니다. 문의: 02-594-5583",
    sortOrder: 1,
  },
  {
    name: "상담 일정 확정",
    channel: "sms",
    content: "[윤정 법률사무소] {name}님, {category} 관련 상담이 확정되었습니다. 일시: {date}. 장소: 서울시 서초구 서초대로 327, 5층. 문의: 02-594-5583",
    sortOrder: 2,
  },
  {
    name: "상담 일정 변경 안내",
    channel: "sms",
    content: "[윤정 법률사무소] {name}님, 예약하신 상담 일정이 변경되었습니다. 변경된 일시는 별도 안내 예정입니다. 문의: 02-594-5583",
    sortOrder: 3,
  },
  {
    name: "상담 리마인더",
    channel: "sms",
    content: "[윤정 법률사무소] {name}님, 내일 예약하신 상담이 있습니다. 준비 서류가 있으시면 지참 부탁드립니다. 장소: 서초구 서초대로 327, 5층. 문의: 02-594-5583",
    sortOrder: 4,
  },
  {
    name: "상담 완료 감사",
    channel: "sms",
    content: "[윤정 법률사무소] {name}님, 상담에 참석해주셔서 감사합니다. 추가 문의 사항이 있으시면 언제든 연락 주시기 바랍니다. 02-594-5583",
    sortOrder: 5,
  },
  {
    name: "서류 제출 요청",
    channel: "sms",
    content: "[윤정 법률사무소] {name}님, {category} 사건 진행을 위해 관련 서류 제출이 필요합니다. 자세한 안내는 이메일 또는 전화로 드리겠습니다. 02-594-5583",
    sortOrder: 6,
  },

  // ── 이메일 템플릿 ──
  {
    name: "상담 접수 확인 (이메일)",
    channel: "email",
    subject: "[윤정 법률사무소] 상담 신청이 접수되었습니다",
    content: `<div style="font-family:'맑은 고딕',sans-serif;max-width:600px;margin:0 auto;padding:30px;color:#333">
  <div style="border-bottom:2px solid #b08d57;padding-bottom:16px;margin-bottom:24px">
    <h2 style="margin:0;color:#1a1a2e;font-size:20px">윤정 법률사무소</h2>
    <p style="margin:4px 0 0;color:#b08d57;font-size:12px;letter-spacing:2px">YOUNJEONG LAW OFFICE</p>
  </div>
  <p>{name}님, 안녕하세요.</p>
  <p>윤정 법률사무소에 상담을 신청해주셔서 감사합니다.</p>
  <p>접수하신 <strong>{category}</strong> 관련 상담 신청이 정상적으로 접수되었으며, 담당 변호사 배정 후 빠른 시일 내에 연락드리겠습니다.</p>
  <div style="background:#f8f9fa;padding:16px;border-radius:6px;margin:20px 0">
    <p style="margin:0;font-size:13px;color:#666"><strong>접수일:</strong> {date}</p>
    <p style="margin:8px 0 0;font-size:13px;color:#666"><strong>상담 분야:</strong> {category}</p>
  </div>
  <p>추가 문의 사항이 있으시면 아래 연락처로 연락 주시기 바랍니다.</p>
  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e0e0e0;font-size:12px;color:#888">
    <p style="margin:0"><strong>윤정 법률사무소</strong></p>
    <p style="margin:4px 0">서울특별시 서초구 서초대로 327, 5층</p>
    <p style="margin:4px 0">전화: 02-594-5583 | 이메일: younsehwan@younjeong.com</p>
  </div>
</div>`,
    sortOrder: 1,
  },
  {
    name: "상담 일정 확정 (이메일)",
    channel: "email",
    subject: "[윤정 법률사무소] 상담 일정이 확정되었습니다",
    content: `<div style="font-family:'맑은 고딕',sans-serif;max-width:600px;margin:0 auto;padding:30px;color:#333">
  <div style="border-bottom:2px solid #b08d57;padding-bottom:16px;margin-bottom:24px">
    <h2 style="margin:0;color:#1a1a2e;font-size:20px">윤정 법률사무소</h2>
    <p style="margin:4px 0 0;color:#b08d57;font-size:12px;letter-spacing:2px">YOUNJEONG LAW OFFICE</p>
  </div>
  <p>{name}님, 안녕하세요.</p>
  <p>{category} 관련 상담 일정이 아래와 같이 확정되었습니다.</p>
  <div style="background:#f0f4ff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #b08d57">
    <p style="margin:0;font-size:15px;font-weight:600;color:#1a1a2e">상담 일정 안내</p>
    <p style="margin:10px 0 4px;font-size:14px"><strong>일시:</strong> {date}</p>
    <p style="margin:4px 0;font-size:14px"><strong>장소:</strong> 서울특별시 서초구 서초대로 327, 5층</p>
    <p style="margin:4px 0;font-size:14px"><strong>분야:</strong> {category}</p>
  </div>
  <p><strong>준비 사항:</strong></p>
  <ul style="color:#555;line-height:1.8">
    <li>관련 서류 사본 (계약서, 통지서 등)</li>
    <li>사건 경과를 정리한 메모</li>
    <li>신분증</li>
  </ul>
  <p>시간 변경이 필요하시면 사전에 연락 부탁드립니다.</p>
  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e0e0e0;font-size:12px;color:#888">
    <p style="margin:0"><strong>윤정 법률사무소</strong></p>
    <p style="margin:4px 0">전화: 02-594-5583 | 이메일: younsehwan@younjeong.com</p>
  </div>
</div>`,
    sortOrder: 2,
  },
  {
    name: "상담 완료 감사 (이메일)",
    channel: "email",
    subject: "[윤정 법률사무소] 상담에 참석해주셔서 감사합니다",
    content: `<div style="font-family:'맑은 고딕',sans-serif;max-width:600px;margin:0 auto;padding:30px;color:#333">
  <div style="border-bottom:2px solid #b08d57;padding-bottom:16px;margin-bottom:24px">
    <h2 style="margin:0;color:#1a1a2e;font-size:20px">윤정 법률사무소</h2>
    <p style="margin:4px 0 0;color:#b08d57;font-size:12px;letter-spacing:2px">YOUNJEONG LAW OFFICE</p>
  </div>
  <p>{name}님, 안녕하세요.</p>
  <p>바쁘신 중에 상담에 참석해주셔서 진심으로 감사드립니다.</p>
  <p>상담 내용을 바탕으로 검토를 진행할 예정이며, 추가적인 안내가 필요한 경우 별도로 연락드리겠습니다.</p>
  <p>추가 궁금하신 사항이나 보충할 내용이 있으시면 언제든 연락 주시기 바랍니다.</p>
  <p style="margin-top:20px">감사합니다.</p>
  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e0e0e0;font-size:12px;color:#888">
    <p style="margin:0"><strong>윤정 법률사무소</strong></p>
    <p style="margin:4px 0">서울특별시 서초구 서초대로 327, 5층</p>
    <p style="margin:4px 0">전화: 02-594-5583 | 이메일: younsehwan@younjeong.com</p>
  </div>
</div>`,
    sortOrder: 3,
  },
];

async function seed() {
  console.log("메시지 템플릿 시드 데이터 삽입 중...");

  for (const tpl of SEED_TEMPLATES) {
    await db.insert(messageTemplates).values({
      name: tpl.name,
      channel: tpl.channel,
      subject: tpl.subject || null,
      content: tpl.content,
      isActive: 1,
      sortOrder: tpl.sortOrder,
    });
    console.log(`  ✓ ${tpl.channel.toUpperCase()} — ${tpl.name}`);
  }

  console.log(`\n총 ${SEED_TEMPLATES.length}개 템플릿 삽입 완료!`);
}

seed().catch((err) => {
  console.error("시드 실패:", err);
  process.exit(1);
});
