/**
 * 이해상충 검토(Conflict of Interest Check) 서비스.
 *
 * 변호사 윤리 규정상, 한 사무실은 같은 사건에서 양쪽 당사자를 대리할 수 없고,
 * 과거에 상대방으로 등장했던 사람을 새 의뢰인으로 받아도 안 된다.
 *
 * 이 서비스는 신규 의뢰인(또는 기존 의뢰인 검토 시) 의 이름·전화·이메일을
 * 받아 과거 계약서(contract_parties) 에 상대방(counterparty / counterparty_rep) 으로
 * 등장한 적이 있는지 검사한다.
 *
 * 정규화 규칙:
 *  - 이름: 공백 제거 + 소문자 (한글은 그대로)
 *  - 전화: 숫자만 추출 (예: 010-1234-5678 → 01012345678) + 마지막 4자리
 *  - 이메일: 소문자
 *
 * 매치 강도(severity):
 *  - high: 전화 전체 일치 또는 이메일 일치 (확실한 동일인)
 *  - medium: 이름 일치 + (전화 마지막 4자리 일치 OR 생년월일 일치)
 *  - low: 이름만 일치 (동명이인 가능)
 */
const { sqlite } = require("../db");
const { ServiceError } = require("./helpers");

function normalizeName(s) {
  return String(s || "").replace(/\s+/g, "").toLowerCase();
}
function normalizePhone(s) {
  return String(s || "").replace(/\D/g, "");
}
function normalizeEmail(s) {
  return String(s || "").trim().toLowerCase();
}

const COUNTERPARTY_ROLES = ["counterparty", "counterparty_rep"];

/**
 * @param {{ name?: string, phone?: string, email?: string, birthdate?: string,
 *           clientId?: string }} query
 * @returns {{ severity: 'high'|'medium'|'low'|'clear', matches: Array }}
 */
function checkConflict(query = {}) {
  const name = normalizeName(query.name);
  const phone = normalizePhone(query.phone);
  const phoneLast4 = phone.slice(-4);
  const email = normalizeEmail(query.email);
  const birthdate = (query.birthdate || "").trim();
  const ourClientId = query.clientId || null;

  if (!name && !phone && !email) {
    throw new ServiceError("이름·전화·이메일 중 하나 이상이 필요합니다", 400);
  }

  /* 후보 추출 — 상대방 역할의 과거 계약서 당사자 + 의뢰인 ID 와 다른 사람 */
  const rows = sqlite.prepare(`
    SELECT
      cp.id AS party_id,
      cp.contract_id,
      cp.role,
      cp.display_name,
      cp.legal_name,
      cp.phone_number,
      cp.phone_last4,
      cp.email,
      cp.birthdate,
      cp.signed_at,
      c.title AS contract_title,
      c.status AS contract_status,
      c.client_id AS our_client_id,
      c.created_at AS contract_created_at,
      cl.name AS our_client_name
    FROM contract_parties cp
    JOIN contracts c ON c.id = cp.contract_id
    LEFT JOIN clients cl ON cl.id = c.client_id
    WHERE cp.role IN ('counterparty', 'counterparty_rep')
  `).all();

  const matches = [];
  let highest = "clear";

  for (const r of rows) {
    /* 본인을 상대방에 등록한 경우 (이상 데이터) 는 일단 제외하지 않는다 — 검출 가치 있음 */
    const candidateName = normalizeName(r.legal_name || r.display_name);
    const candidatePhone = normalizePhone(r.phone_number);
    const candidatePhone4 = String(r.phone_last4 || "").trim() || candidatePhone.slice(-4);
    const candidateEmail = normalizeEmail(r.email);
    const candidateBirth = (r.birthdate || "").trim();

    let severity = null;
    const reasons = [];

    /* 전화 전체 일치 — 가장 강한 신호 */
    if (phone && candidatePhone && phone === candidatePhone) {
      severity = "high";
      reasons.push("전화번호 일치");
    }
    /* 이메일 일치 */
    if (email && candidateEmail && email === candidateEmail) {
      severity = "high";
      reasons.push("이메일 일치");
    }
    /* 이름 + 전화 마지막 4자리 */
    if (!severity && name && candidateName && name === candidateName) {
      if (phoneLast4 && candidatePhone4 && phoneLast4 === candidatePhone4) {
        severity = "medium";
        reasons.push("이름 일치 + 전화 끝 4자리 일치");
      } else if (birthdate && candidateBirth && birthdate === candidateBirth) {
        severity = "medium";
        reasons.push("이름 일치 + 생년월일 일치");
      } else {
        severity = "low";
        reasons.push("이름 일치 (동명이인 가능)");
      }
    }
    /* 이름 없이 전화 끝 4자리만 */
    if (!severity && phoneLast4 && candidatePhone4 && phoneLast4 === candidatePhone4 && phoneLast4.length === 4) {
      severity = "low";
      reasons.push("전화 끝 4자리 일치");
    }

    if (severity) {
      matches.push({
        partyId: r.party_id,
        contractId: r.contract_id,
        contractTitle: r.contract_title,
        contractStatus: r.contract_status,
        contractCreatedAt: r.contract_created_at,
        role: r.role,
        opposingPartyName: r.display_name || r.legal_name,
        ourClientId: r.our_client_id,
        ourClientName: r.our_client_name,
        signedAt: r.signed_at,
        severity,
        reasons,
        /* 본 의뢰인이 자기 자신과 충돌하는 경우 즉, 같은 client_id 면 noise — 표시는 하되 isSelf 로 마킹 */
        isSelf: ourClientId && r.our_client_id === ourClientId,
      });
      if (severity === "high" || (severity === "medium" && highest !== "high") ||
          (severity === "low" && highest === "clear")) {
        highest = severity;
      }
    }
  }

  /* 정렬: severity high → medium → low, 최근 계약 먼저 */
  const order = { high: 0, medium: 1, low: 2 };
  matches.sort((a, b) => {
    if (a.severity !== b.severity) return order[a.severity] - order[b.severity];
    return (b.contractCreatedAt || "").localeCompare(a.contractCreatedAt || "");
  });

  return {
    severity: highest,
    matchCount: matches.length,
    matches,
    query: { name: query.name || null, phone: query.phone || null, email: query.email || null, birthdate: query.birthdate || null },
  };
}

/**
 * 기존 의뢰인 ID 로 conflict 검토 — clients 테이블에서 정보 조회 후 checkConflict 위임.
 */
function checkExistingClient(clientId) {
  if (!clientId) throw new ServiceError("clientId 가 필요합니다", 400);
  const client = sqlite.prepare("SELECT * FROM clients WHERE id = ?").get(clientId);
  if (!client) throw new ServiceError("의뢰인을 찾을 수 없습니다", 404);
  return checkConflict({
    clientId,
    name: client.name,
    phone: client.phone,
    email: client.email,
  });
}

module.exports = {
  checkConflict,
  checkExistingClient,
  COUNTERPARTY_ROLES,
};
