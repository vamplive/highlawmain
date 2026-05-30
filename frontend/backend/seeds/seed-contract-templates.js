/**
 * 기본 계약서 템플릿 시드 스크립트
 * - 표준 위임계약서, 간단 합의서 2종 시드
 * - 이미 존재하면 중복 생성하지 않음
 *
 * 실행: node backend/seed-contract-templates.js
 */
require("dotenv").config();
const crypto = require("crypto");
const { sqlite } = require("../db");

const ENGAGEMENT_TEMPLATE_TITLE = "표준 위임계약서";
const SETTLEMENT_TEMPLATE_TITLE = "표준 합의서";

/** 위임계약서 기본 본문 */
const ENGAGEMENT_BODY_LINES = [
  "위임계약서",
  "",
  "법무법인 하이로(이하 \"수임인\")과 의뢰인(이하 \"위임인\")은 다음과 같이 소송/법률사무 처리를 위한 위임계약을 체결한다.",
  "",
  "제1조 (위임의 목적)",
  "위임인은 자신의 법률사무 처리를 수임인에게 위임하고, 수임인은 이를 수락한다.",
  "",
  "제2조 (수임료)",
  "수임인이 제공하는 법률서비스에 대한 수임료는 당사자 간의 별도 합의에 따른다. 착수금, 성공보수의 지급 시기 및 방법은 별지 또는 구두 합의로 정한다.",
  "",
  "제3조 (실비의 부담)",
  "본 건 처리에 소요되는 인지대, 송달료, 감정비 등의 실비는 위임인이 부담한다.",
  "",
  "제4조 (신의성실의 원칙)",
  "수임인은 변호사의 직업윤리와 신의성실의 원칙에 따라 위임 사무를 처리한다.",
  "",
  "제5조 (비밀유지)",
  "수임인은 본 건 처리 과정에서 알게 된 위임인의 비밀을 법령에 따른 경우를 제외하고는 제3자에게 누설하지 않는다.",
  "",
  "제6조 (해지)",
  "위임인과 수임인은 언제든지 본 계약을 해지할 수 있으며, 해지 시 기성 업무에 상응하는 보수는 정산한다.",
  "",
  "제7조 (관할)",
  "본 계약과 관련한 분쟁은 서울중앙지방법원을 제1심 합의관할로 한다.",
  "",
  "위 계약의 성립을 증명하기 위하여 본 계약서에 각 당사자가 서명하고, 각자 1부씩 보관한다.",
  "",
  "",
  "위임인 성명 및 서명: {{sign:의뢰인}}",
  "",
  "수임인(담당 변호사) 서명: {{sign:변호사}}",
];

/** 합의서 기본 본문 */
const SETTLEMENT_BODY_LINES = [
  "합의서",
  "",
  "아래 당사자들은 상호 간 분쟁을 원만히 해결하기 위하여 다음과 같이 합의한다.",
  "",
  "제1조 (합의의 대상)",
  "본 합의의 대상은 당사자들 사이에 발생한 [사건 내용]이며, 본 합의로써 위 사건과 관련된 모든 청구가 종결됨을 확인한다.",
  "",
  "제2조 (합의금)",
  "본 합의금은 당사자 간 별도 합의로 정하며, 지급 방법과 기일은 별지에 따른다.",
  "",
  "제3조 (비밀유지)",
  "본 합의의 내용은 법령에 따른 공개 요구가 있는 경우를 제외하고는 외부에 공개하지 않는다.",
  "",
  "제4조 (부제소 합의)",
  "당사자들은 본 합의의 대상에 대하여 향후 민·형사상 어떠한 청구나 고소·고발도 하지 않는다.",
  "",
  "제5조 (해석)",
  "본 합의서의 해석에 관한 의문이 있는 경우 당사자들은 신의성실의 원칙에 따라 협의하여 결정한다.",
  "",
  "당사자들은 본 합의서의 내용을 충분히 이해하였으며, 진정한 의사로서 서명한다.",
  "",
  "",
  "갑 (의뢰인): {{sign:의뢰인}}",
  "",
  "을 (상대방): {{sign:상대방}}",
  "",
  "대리인(법무법인 하이로): {{sign:변호사}}",
];

function buildJson(lines) {
  const doc = {
    type: "doc",
    content: lines.map((line) => {
      if (!line.trim()) return { type: "paragraph" };
      const children = [];
      const regex = /\{\{sign:([^}]+)\}\}/g;
      let last = 0;
      let m;
      while ((m = regex.exec(line))) {
        if (m.index > last) {
          children.push({ type: "text", text: line.slice(last, m.index) });
        }
        children.push({
          type: "signatureField",
          attrs: {
            fieldKey: `sig-${m[1]}-${Math.random().toString(36).slice(2, 8)}`,
            role: mapRole(m[1]),
            label: m[1],
            required: true,
          },
        });
        last = m.index + m[0].length;
      }
      if (last < line.length) {
        children.push({ type: "text", text: line.slice(last) });
      }
      return { type: "paragraph", content: children };
    }),
  };
  return JSON.stringify(doc);
}

function mapRole(label) {
  const s = String(label || "").toLowerCase();
  if (s.includes("의뢰")) return "our_client";
  if (s.includes("변호")) return "lawyer";
  if (s.includes("대리")) return "counterparty_rep";
  if (s.includes("상대")) return "counterparty";
  if (s.includes("증인")) return "witness";
  return "our_client";
}

function buildHtml(lines) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return lines.map((line) => {
    if (!line.trim()) return "<p></p>";
    return "<p>" + line.replace(/\{\{sign:([^}]+)\}\}/g, (_, role) => {
      return `<signature-field data-role="${mapRole(role)}" data-label="${esc(role)}" data-required="1">${esc(role)}</signature-field>`;
    }) + "</p>";
  }).join("\n");
}

function seed() {
  const insert = sqlite.prepare(`
    INSERT INTO contract_templates (
      id, title, description, category, content_json, content_html,
      is_default, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `);

  const existingEngagement = sqlite.prepare("SELECT id FROM contract_templates WHERE title = ?").get(ENGAGEMENT_TEMPLATE_TITLE);
  if (!existingEngagement) {
    insert.run(
      crypto.randomUUID(),
      ENGAGEMENT_TEMPLATE_TITLE,
      "법무법인 하이로 기본 위임계약서 양식 (서명 2인: 의뢰인 + 변호사)",
      "engagement",
      buildJson(ENGAGEMENT_BODY_LINES),
      buildHtml(ENGAGEMENT_BODY_LINES),
    );
    console.log("[SEED] 위임계약서 템플릿 생성");
  } else {
    console.log("[SEED] 위임계약서 템플릿 이미 존재 - 건너뜀");
  }

  const existingSettlement = sqlite.prepare("SELECT id FROM contract_templates WHERE title = ?").get(SETTLEMENT_TEMPLATE_TITLE);
  if (!existingSettlement) {
    insert.run(
      crypto.randomUUID(),
      SETTLEMENT_TEMPLATE_TITLE,
      "기본 합의서 양식 (서명 3인: 의뢰인, 상대방, 변호사)",
      "settlement",
      buildJson(SETTLEMENT_BODY_LINES),
      buildHtml(SETTLEMENT_BODY_LINES),
    );
    console.log("[SEED] 합의서 템플릿 생성");
  } else {
    console.log("[SEED] 합의서 템플릿 이미 존재 - 건너뜀");
  }
}

seed();
process.exit(0);
