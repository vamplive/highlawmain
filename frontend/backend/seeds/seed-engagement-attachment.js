/**
 * 보전처분(채권가압류) 위임계약서 — 박성재 케이스 기반 표준 양식 시드
 *
 * 변수 placeholder: {{var:key}} 형태. 발행 시 의뢰인 정보·금액 등을 폼으로 입력받아
 * 본문에 치환된 새 계약서가 만들어진다 (clone-for-client 시점).
 *
 * 실행: node backend/seeds/seed-engagement-attachment.js
 */
require("dotenv").config();
const crypto = require("crypto");
const { sqlite } = require("../db");

const TITLE = "위임계약서 — 보전처분(채권가압류) 표준";

/** 발행 시 입력받는 변수 정의 (UI에서 폼으로 렌더링됨) */
const VARIABLES_SCHEMA = [
  { group: "의뢰인", key: "client.name",     label: "성명",            type: "text",     required: true,  placeholder: "박성재" },
  { group: "의뢰인", key: "client.rrn",      label: "주민등록번호",     type: "text",     required: false, placeholder: "940227-1******" },
  { group: "의뢰인", key: "client.address",  label: "주소",            type: "text",     required: true,  placeholder: "서울특별시 광진구 …" },
  { group: "의뢰인", key: "client.phone",    label: "전화",            type: "tel",      required: true,  placeholder: "010-3537-8653" },
  { group: "의뢰인", key: "client.email",    label: "이메일",          type: "email",    required: false, placeholder: "younsehwan@snu.ac.kr" },
  { group: "사건",   key: "case.matterTitle",   label: "사건명",         type: "text",     required: true,  placeholder: "채권가압류 신청" },
  { group: "사건",   key: "case.matterSubtitle", label: "사건 부제",      type: "text",     required: false, placeholder: "디아드청담1 — 에스크로 예치금" },
  { group: "사건",   key: "case.opponent",      label: "상대방",         type: "text",     required: true,  placeholder: "주식회사 디아드청담1" },
  { group: "사건",   key: "case.thirdDebtor",   label: "제3채무자",      type: "text",     required: false, placeholder: "법무법인(유한) 평산" },
  { group: "사건",   key: "case.court",         label: "관할법원",       type: "text",     required: true,  placeholder: "서울중앙지방법원" },
  { group: "사건",   key: "case.scope",         label: "위임사무 내용", type: "longText", required: true,
    placeholder: "보전처분(채권가압류) 신청서 작성 및 제출, 담보제공 관련 의견서 작성, 결정문 수령 및 송달 확인 등 가압류 인용에 이르기까지의 일체의 업무." },
  { group: "보수",   key: "fee.retainerAmount", label: "착수보수 (원, 부가세 별도)", type: "number", required: true, placeholder: "2000000" },
  { group: "보수",   key: "fee.successClause",  label: "성공보수 조항", type: "longText", required: true,
    placeholder: "본 계약에서 별도의 성공보수는 약정하지 아니한다. 다만, 가압류의 인용으로 보전된 금액이 본안소송의 회수금액에 산입되는 경우의 처리는 본안소송 위임계약에서 별도로 정한다." },
  { group: "기타",   key: "contractDate",      label: "계약일",         type: "date",     required: true,  placeholder: "" },
];

/** 본문 — 변수 자리는 {{var:key}}, 서명 자리는 {{sign:라벨}} */
const BODY_LINES = [
  "위 임 계 약 서",
  "ATTORNEY  RETAINER  AGREEMENT",
  "",
  "위 임 인 (갑)",
  "{{var:client.name}}",
  "주민등록번호  {{var:client.rrn}}",
  "{{var:client.address}}",
  "전화  {{var:client.phone}}",
  "",
  "수 임 인 (을)",
  "법무법인 하이로",
  "대표변호사  윤  세  환",
  "서울 서초구 서초대로 327, 5층",
  "전화  02-594-5593      팩스  02-594-5584",
  "이메일  younsehwan@highlaw.co.kr",
  "",
  "위 위임인(이하 「갑」이라 한다)과 수임인(이하 「을」이라 한다)은 아래 사건의 처리에 관하여 다음과 같이 위임계약을 체결한다.",
  "",
  "제 1 조   [수임의 범위]",
  "「갑」은 「을」에게 다음 사건의 처리(이하 「위임사무」라 한다)를 위임하고, 「을」은 이를 수임한다.",
  "①  사 건 명 :  {{var:case.matterTitle}} ({{var:case.matterSubtitle}})",
  "②  상 대 방 :  {{var:case.opponent}}   /   제3채무자 : {{var:case.thirdDebtor}}",
  "③  관할 법원 :  {{var:case.court}}",
  "④  위임사무의 내용 :  {{var:case.scope}}",
  "",
  "제 2 조   [위임의 한계]",
  "「을」이 위임받는 사무의 범위는 해당 심급 및 본 사건에 한한다. 환송심, 상소의 제기 및 그 수행, 강제집행, 다른 보전처분, 이의신청 및 별소의 제기 등은 별개의 위임사무로 보아 별도의 위임계약을 체결한다.",
  "",
  "제 3 조   [성실의무]",
  "①  「을」은 변호사법 및 위임의 본지에 따라 선량한 관리자의 주의로써 위임사무를 처리한다.",
  "②  「갑」은 위임사무의 처리에 필요한 자료의 제출, 사실관계의 진술, 조회에 대한 회신 등 협조의무를 성실히 이행하여야 한다.",
  "③  「갑」이 성실의무를 위반하거나 신뢰관계가 훼손되어 사건 수행에 장애가 발생한 경우, 「을」은 「갑」에게 상당한 기간을 정하여 그 시정을 요구할 수 있고, 그 기간 내에 시정되지 아니하는 때에는 본 위임계약을 해지할 수 있으며, 이로 인한 책임을 지지 아니한다.",
  "",
  "제 4 조   [보  수]",
  "①  본 사건에 관한 착수보수는 금 {{var:fee.retainerAmount}}원(부가가치세 별도)으로 한다.",
  "②  착수보수의 지급시기는 본 계약 체결 시로 한다.",
  "③  「갑」은 착수보수 및 관련 비용을 다음의 보수계좌로 지급한다.",
  "보수계좌    우리은행   1005-604-257444  예금주  윤세환(법무법인 하이로)",
  "",
  "제 5 조   [착수보수 지급의 지체]",
  "「갑」이 착수보수 또는 위임사무 처리에 필요한 비용 등의 지급을 지체하는 경우, 「을」은 위임사무에 착수하지 아니하거나 본 위임계약을 해제할 수 있다.",
  "",
  "제 6 조   [착수보수의 반환]",
  "①  「갑」은 원칙적으로 「을」에게 지급한 착수보수의 반환을 청구할 수 없다.",
  "②  다만, 「을」이 위임사무에 전혀 착수하지 아니한 경우에는 착수보수 전액을, 일부 착수한 경우에는 그 진행 정도에 상응하는 금액을 공제한 잔액을 「갑」에게 반환한다.",
  "③  「을」의 개인적 사유로 위임사무를 처리할 수 없게 된 때에는 위 ②항에 준하여 반환한다.",
  "",
  "제 7 조   [성공보수]",
  "{{var:fee.successClause}}",
  "",
  "제 8 조   [보전처분 사건의 특수 책임]",
  "①  「갑」은 본 사건이 보전처분 사건이라는 특성상, 법원의 담보제공명령이 있는 경우 그 기한 내에 담보(공탁금 또는 보증보험증권)를 제공할 의무가 있음을 확인한다.",
  "②  「갑」이 위 ①항의 담보제공의무를 지체하여 가압류 신청이 기각·각하되는 경우, 「을」은 어떠한 책임도 부담하지 아니한다.",
  "③  본안소송에서 「갑」이 패소하여 부당보전처분으로 인한 손해배상책임(민사집행법 제307조 등)이 발생하는 경우, 그 책임은 전적으로 「갑」에게 귀속되며, 「을」은 이에 대하여 책임을 지지 아니한다.",
  "",
  "제 9 조   [비용의 부담 및 정산]",
  "①  인지대, 송달료, 공탁금, 보증보험료 등 법원 및 관계기관에 납부하여야 할 비용은 모두 「갑」이 부담한다.",
  "②  「을」이 위 비용을 부득이 선납한 경우, 「갑」은 「을」의 청구를 받은 날로부터 7일 이내에 이를 정산·지급하여야 한다.",
  "③  담보취소 신청, 공탁금 회수 등의 후속 업무는 별도의 위임사무로 한다.",
  "",
  "제 10 조   [계약 해지]",
  "「갑」이 본 위임계약상의 의무를 이행하지 아니하거나, 위임사무의 내용에 관하여 「갑」이 진술한 사실이 허위이거나 중요사항을 은폐한 것으로 밝혀진 때에는, 「을」은 본 계약을 해지하고 사임할 수 있다.",
  "",
  "제 11 조   [통지의무]",
  "「을」은 위임사무 처리의 중요한 진행상황 및 그 결과를 「갑」에게 지체 없이 통지하며, 위임사무가 종료된 때에는 그 결과를 「갑」에게 신속히 통지하여야 한다.",
  "",
  "제 12 조   [자료의 보관 및 폐기]",
  "「을」이 위임사무의 처리를 위하여 「갑」으로부터 제공받은 자료는 위임 종료 시 「갑」에게 수령할 것을 통지한 후 3개월 내에 별다른 의사표시가 없는 경우 「을」이 임의로 폐기할 수 있다.",
  "",
  "제 13 조   [지급 보장]",
  "①  「을」은 본 계약에서 정한 비용 또는 보수의 지급을 확보하기 위하여 「갑」에게 필요한 조치를 요구할 수 있다.",
  "②  「갑」이 비용 또는 보수의 지급의무를 이행하지 아니하는 경우, 「을」은 위임사무의 처리를 위하여 보관하고 있는 금전, 문서 또는 자료 등을 유치하거나 사무처리를 거부할 수 있다.",
  "③  위 ②항의 경우, 「을」은 신속히 「갑」에게 그 취지를 통지하여야 한다.",
  "",
  "제 14 조   [인감의 사용]",
  "본 위임사무의 수행을 위하여 필요한 경우, 「을」은 「갑」으로부터 당사자의 인감을 교부받아 사용할 수 있다. 이 경우 「을」은 인감의 보관 및 사용내역을 「갑」에게 통지하여야 한다.",
  "",
  "제 15 조   [비밀유지]",
  "「을」은 업무상 취득한 「갑」의 모든 비밀정보를 비밀로 유지하며, 업무수행의 범위를 벗어나거나 법령상 요구되는 경우를 제외하고는 「갑」의 동의 없이 이를 제3자에게 공개하여서는 아니 된다.",
  "",
  "제 16 조   [광 고]",
  "「을」은 본 계약에 의한 위임사건을 「을」의 업무 실적 광고에 활용할 수 있다. 다만, 「갑」을 특정할 수 있는 정보는 공개하지 아니한다.",
  "",
  "제 17 조   [관 할]",
  "본 계약으로 인하여 발생하는 일체의 분쟁에 관한 소송의 관할법원은 서울중앙지방법원으로 한다.",
  "",
  "제 18 조   [민법과의 관계]",
  "본 위임계약서에 특별히 규정되어 있지 아니한 사항에 관하여는 민법상 위임에 관한 규정이 정하는 바에 따른다.",
  "",
  "특  약  사  항",
  "1.  본안소송은 별도의 위임계약에 의한다.",
  "2.  인지대, 송달료, 공탁금, 담보보증보험료 등 법원 납부 비용은 「갑」이 별도로 부담한다.",
  "3.  본 계약서는 2부를 작성하여 「갑」과 「을」이 각 1부씩 보관한다.",
  "",
  "{{var:contractDate}}",
  "",
  "위 임 인  (갑)",
  "{{var:client.name}}",
  "{{var:client.address}}",
  "{{var:client.phone}}",
  "서명: {{sign:의뢰인}}",
  "",
  "수 임 인  (을)",
  "법무법인 하이로",
  "대표변호사  윤  세  환",
  "서울 서초구 서초대로 327, 5층",
  "T. 02-594-5593     F. 02-594-5584",
  "서명: {{sign:변호사}}",
];

function mapRole(label) {
  const s = String(label || "").toLowerCase();
  if (s.includes("의뢰")) return "our_client";
  if (s.includes("변호")) return "lawyer";
  if (s.includes("대리")) return "counterparty_rep";
  if (s.includes("상대")) return "counterparty";
  if (s.includes("증인")) return "witness";
  return "our_client";
}

/** 본문 라인을 TipTap doc JSON으로 변환 (텍스트 + signatureField 노드) */
function buildJson(lines) {
  const placeholderRe = /(\{\{sign:[^}]+\}\}|\{\{var:[^}]+\}\})/g;
  const content = lines.map((line) => {
    if (!line.trim()) return { type: "paragraph" };
    const children = [];
    let last = 0;
    let m;
    while ((m = placeholderRe.exec(line))) {
      if (m.index > last) children.push({ type: "text", text: line.slice(last, m.index) });
      const token = m[0];
      if (token.startsWith("{{sign:")) {
        const role = token.slice(7, -2);
        children.push({
          type: "signatureField",
          attrs: {
            fieldKey: `sig-${role}-${Math.random().toString(36).slice(2, 8)}`,
            role: mapRole(role),
            label: role,
            required: true,
          },
        });
      } else {
        children.push({ type: "text", text: token }); // {{var:key}} 는 텍스트로 보존 → 발행 시 치환
      }
      last = m.index + token.length;
    }
    if (last < line.length) children.push({ type: "text", text: line.slice(last) });
    return { type: "paragraph", content: children.filter(Boolean) };
  });
  return JSON.stringify({ type: "doc", content });
}

function buildHtml(lines) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return lines.map((line) => {
    if (!line.trim()) return "<p></p>";
    const inner = line.replace(/\{\{sign:([^}]+)\}\}/g, (_, role) => {
      return `<signature-field data-role="${mapRole(role)}" data-label="${esc(role)}" data-required="1">${esc(role)}</signature-field>`;
    });
    // {{var:key}} 는 그대로 보존 (치환 단계에서 처리)
    return `<p>${inner}</p>`;
  }).join("\n");
}

function seed() {
  const exists = sqlite.prepare("SELECT id FROM contract_templates WHERE title = ?").get(TITLE);
  if (exists) {
    sqlite.prepare(`
      UPDATE contract_templates SET
        description = ?, category = 'engagement',
        content_json = ?, content_html = ?,
        variables_schema = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      "보전처분(채권가압류) 표준 양식 — 의뢰인 정보·착수금·성공보수만 입력하면 즉시 발행됩니다.",
      buildJson(BODY_LINES),
      buildHtml(BODY_LINES),
      JSON.stringify(VARIABLES_SCHEMA),
      exists.id,
    );
    console.log("[SEED] 보전처분 위임계약서 갱신:", exists.id);
    return;
  }
  const id = crypto.randomUUID();
  sqlite.prepare(`
    INSERT INTO contract_templates (
      id, title, description, category, content_json, content_html,
      variables_schema, is_default, created_at, updated_at
    ) VALUES (?, ?, ?, 'engagement', ?, ?, ?, 0, datetime('now'), datetime('now'))
  `).run(
    id,
    TITLE,
    "보전처분(채권가압류) 표준 양식 — 의뢰인 정보·착수금·성공보수만 입력하면 즉시 발행됩니다.",
    buildJson(BODY_LINES),
    buildHtml(BODY_LINES),
    JSON.stringify(VARIABLES_SCHEMA),
  );
  console.log("[SEED] 보전처분 위임계약서 생성:", id);
}

seed();
process.exit(0);
