/**
 * 의뢰인 예치금(Trust Account) 관리자 페이지
 *
 * - 사무실 총 예치금(은행 잔액과 비교용) + 활성 의뢰인 수
 * - 의뢰인별 잔액 목록 (잔액≠0)
 * - 의뢰인 선택 시 거래 원장(running balance) + 입금/출금 등록 폼
 * - 거래 취소(void) — 잔액 보존, 감사 추적용
 *
 * 도메인 규칙:
 *  - 입금은 양수, 출금은 음수 금액으로 입력
 *  - 출금이 잔액 초과 시 backend 에서 409 거부 (commingling 방지)
 *  - 등록된 거래는 수정 불가 — 잘못된 거래는 void 후 새 거래 등록
 */
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../utils/api";
import {
  COLORS, btnStyle, badgeStyle, fieldStyle, labelStyle, thStyle, tdStyle,
  PageHeader, EmptyState, ErrorBanner, RelatedLinks,
} from "../../../components/admin";
import { ERP_LINKS } from "../layout/erpLinks";
import { formatDateTime } from "../../../utils/formatters";

const TX_TYPES = [
  { value: "deposit", label: "입금", color: COLORS.success },
  { value: "withdrawal", label: "출금", color: COLORS.danger },
  { value: "adjustment", label: "조정", color: COLORS.warning },
];
const REF_TYPES = [
  { value: "", label: "(없음)" },
  { value: "manual", label: "수동" },
  { value: "invoice", label: "송장" },
  { value: "receipt", label: "영수증" },
  { value: "refund", label: "환불" },
];

function formatKrw(value) {
  if (value == null) return "0원";
  const sign = value < 0 ? "-" : "";
  return `${sign}${Math.abs(Math.round(value)).toLocaleString("ko-KR")}원`;
}

function nowLocal() {
  return new Date().toISOString().slice(0, 16);
}

/**
 * 입금/출금/조정 등록 폼
 */
function RecordForm({ clientId, onRecorded }) {
  const blank = {
    transactionType: "deposit",
    amountKrw: "",
    description: "",
    referenceType: "",
    referenceId: "",
    occurredAt: nowLocal(),
    memo: "",
  };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    if (!form.description.trim() || !form.amountKrw) {
      setErr("금액과 설명은 필수입니다.");
      return;
    }
    let amount = Math.abs(parseInt(form.amountKrw, 10) || 0);
    if (amount === 0) { setErr("금액은 0보다 커야 합니다."); return; }
    if (form.transactionType === "withdrawal") amount = -amount;
    /* adjustment 는 사용자가 직접 부호 결정 — 하지만 UI 단순화를 위해 amountKrw 부호 유지 */
    if (form.transactionType === "adjustment") {
      amount = parseInt(form.amountKrw, 10); // 양/음 그대로
    }

    setBusy(true); setErr(null);
    try {
      await api.post("/trust-accounts/transactions", {
        clientId,
        transactionType: form.transactionType,
        amountKrw: amount,
        description: form.description.trim(),
        referenceType: form.referenceType || null,
        referenceId: form.referenceId || null,
        occurredAt: `${form.occurredAt}:00`,
        memo: form.memo || null,
      });
      setForm(blank);
      onRecorded?.();
    } catch (e) {
      setErr(e.message || "거래 등록 실패");
    } finally { setBusy(false); }
  };

  return (
    <div style={{
      padding: 14, marginBottom: 12, background: "#fff",
      border: `1px solid ${COLORS.border}`, borderRadius: 8,
    }}>
      <h3 style={{ margin: 0, marginBottom: 10, fontSize: 13, fontWeight: 600 }}>거래 등록</h3>
      {err && <ErrorBanner message={err} onDismiss={() => setErr(null)} />}
      <div style={{ display: "grid", gridTemplateColumns: "120px 140px 1fr 140px", gap: 8 }}>
        <select style={fieldStyle} value={form.transactionType}
          onChange={(e) => setForm({ ...form, transactionType: e.target.value })}>
          {TX_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input style={fieldStyle} type="number" placeholder="금액(원)"
          value={form.amountKrw} onChange={(e) => setForm({ ...form, amountKrw: e.target.value })} />
        <input style={fieldStyle} placeholder="거래 설명 (예: 1차 착수금)"
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input style={fieldStyle} type="datetime-local"
          value={form.occurredAt} onChange={(e) => setForm({ ...form, occurredAt: e.target.value })} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr 100px", gap: 8, marginTop: 8 }}>
        <select style={fieldStyle} value={form.referenceType}
          onChange={(e) => setForm({ ...form, referenceType: e.target.value })}>
          {REF_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <input style={fieldStyle} placeholder="참조 ID (선택)"
          value={form.referenceId} onChange={(e) => setForm({ ...form, referenceId: e.target.value })} />
        <input style={fieldStyle} placeholder="메모 (선택)"
          value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
        <button onClick={submit} disabled={busy} style={btnStyle("primary")}>
          {busy ? "저장 중..." : "기록"}
        </button>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: COLORS.textMuted }}>
        💡 입금: 양수 / 출금: 양수 입력(자동 음수 처리) / 조정: 부호 직접 입력
      </div>
    </div>
  );
}

export default function TrustAccountsPage() {
  const [total, setTotal] = useState(null);
  const [balances, setBalances] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [clientBalance, setClientBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const loadOverview = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [tot, bals, cls] = await Promise.all([
        api.get("/trust-accounts/total"),
        api.get("/trust-accounts/balances"),
        api.get("/clients?limit=500"),
      ]);
      setTotal(tot.data);
      setBalances(bals.data || []);
      setClients(cls.data || []);
    } catch (e) {
      setErr(e.message || "데이터를 불러오지 못했습니다");
    } finally { setLoading(false); }
  }, []);

  const loadClientLedger = useCallback(async (clientId) => {
    if (!clientId) { setTransactions([]); setClientBalance(null); return; }
    setErr(null);
    try {
      const [bal, txs] = await Promise.all([
        api.get(`/trust-accounts/clients/${clientId}/balance`),
        api.get(`/trust-accounts/clients/${clientId}/transactions?limit=200`),
      ]);
      setClientBalance(bal.data);
      setTransactions(txs.data || []);
    } catch (e) {
      setErr(e.message || "원장 조회 실패");
    }
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => { loadClientLedger(selectedClientId); }, [selectedClientId, loadClientLedger]);

  const handleVoid = async (id) => {
    const reason = window.prompt("거래 취소 사유를 입력하세요:");
    if (!reason || !reason.trim()) return;
    try {
      await api.post(`/trust-accounts/transactions/${id}/void`, { reason });
      await loadClientLedger(selectedClientId);
      await loadOverview();
    } catch (e) {
      setErr(e.message || "취소 실패");
    }
  };

  const refreshAll = useCallback(async () => {
    await Promise.all([loadOverview(), loadClientLedger(selectedClientId)]);
  }, [loadOverview, loadClientLedger, selectedClientId]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div>
      <PageHeader
        title="의뢰인 예치금"
        subtitle="신탁 계좌 원장 — 의뢰인별 입출금 내역 및 잔액 관리 (commingling 방지)"
      />
      <RelatedLinks links={ERP_LINKS("/admin/trust-accounts")} label="빠른 이동" />
      <ErrorBanner message={err} onDismiss={() => setErr(null)} />

      {/* 사무실 전체 합계 카드 */}
      {total && (
        <div style={{
          display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16,
          padding: 16, background: "#f8fafc", border: `1px solid ${COLORS.border}`, borderRadius: 8,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              사무실 총 예치금 (은행 잔액 reconciliation 비교용)
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.text }}>
              {formatKrw(total.totalKrw)}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>
              활성 의뢰인 {total.activeClients}명
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 360px) 1fr", gap: 16 }}>
        {/* 좌: 의뢰인 잔액 목록 */}
        <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 600 }}>
            잔액 보유 의뢰인 ({balances.length}명)
          </div>
          {loading ? (
            <div style={{ padding: 20, textAlign: "center", color: COLORS.muted }}>로딩 중...</div>
          ) : balances.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: COLORS.muted, fontSize: 12 }}>
              잔액이 있는 의뢰인이 없습니다.
              <br /><br />
              아래 "+ 신규 등록" 버튼으로 의뢰인을 선택해 첫 입금을 기록하세요.
            </div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              {balances.map((b) => (
                <button key={b.clientId}
                  onClick={() => setSelectedClientId(b.clientId)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "10px 14px",
                    background: selectedClientId === b.clientId ? "#e0f2fe" : "transparent",
                    border: "none", borderBottom: `1px solid ${COLORS.border}`,
                    cursor: "pointer", fontSize: 13,
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, color: COLORS.text }}>{b.clientName}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: b.balance > 0 ? COLORS.success : COLORS.danger }}>
                      {formatKrw(b.balance)}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>
                    거래 {b.transactionCount}건 · 최근 {formatDateTime(b.lastTxAt)}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 신규 등록 — 잔액 없는 의뢰인에서도 첫 입금 가능 */}
          <div style={{ padding: 12, borderTop: `1px solid ${COLORS.border}` }}>
            <label style={labelStyle}>의뢰인 선택 (신규 거래)</label>
            <select style={fieldStyle} value={selectedClientId || ""}
              onChange={(e) => setSelectedClientId(e.target.value || null)}>
              <option value="">선택...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* 우: 선택된 의뢰인 원장 */}
        <div>
          {!selectedClientId ? (
            <EmptyState message="좌측에서 의뢰인을 선택하면 원장이 표시됩니다." />
          ) : (
            <>
              {/* 의뢰인 헤더 + 잔액 */}
              <div style={{
                padding: 14, marginBottom: 12, background: "#fff",
                border: `1px solid ${COLORS.border}`, borderRadius: 8,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase" }}>의뢰인</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.text }}>
                    {selectedClient?.name || "(미상)"}
                  </div>
                </div>
                {clientBalance && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase" }}>현재 잔액</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: clientBalance.balance > 0 ? COLORS.success : clientBalance.balance < 0 ? COLORS.danger : COLORS.text }}>
                      {formatKrw(clientBalance.balance)}
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted }}>
                      거래 {clientBalance.transactionCount}건
                    </div>
                  </div>
                )}
              </div>

              <RecordForm clientId={selectedClientId} onRecorded={refreshAll} />

              {/* 거래 원장 */}
              <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 600 }}>
                  원장 (최신순, running balance 포함)
                </div>
                {transactions.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: COLORS.muted, fontSize: 12 }}>
                    거래 내역이 없습니다.
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table data-mobile-cards="true" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: COLORS.bgHeader }}>
                          <th style={thStyle}>일시</th>
                          <th style={thStyle}>유형</th>
                          <th style={thStyle}>설명</th>
                          <th style={thStyle}>참조</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>금액</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>잔액</th>
                          <th style={thStyle}>기록자</th>
                          <th style={thStyle}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => {
                          const tmeta = TX_TYPES.find((t) => t.value === tx.transactionType);
                          const isVoided = !!tx.voidedAt;
                          return (
                            <tr key={tx.id} style={{
                              borderTop: `1px solid ${COLORS.border}`,
                              background: isVoided ? "#fafafa" : "transparent",
                              opacity: isVoided ? 0.55 : 1,
                            }}>
                              <td data-label="일시" style={tdStyle}>{formatDateTime(tx.occurredAt)}</td>
                              <td data-label="유형" style={tdStyle}>
                                <span style={badgeStyle(tmeta?.color || COLORS.muted)}>
                                  {tmeta?.label || tx.transactionType}
                                </span>
                              </td>
                              <td data-label="설명" style={{ ...tdStyle, maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: isVoided ? "line-through" : "none" }}
                                title={tx.description}>
                                {tx.description}
                                {isVoided && <span style={{ marginLeft: 6, fontSize: 10, color: COLORS.danger }}>(취소: {tx.voidReason})</span>}
                              </td>
                              <td data-label="참조" style={tdStyle}>
                                {tx.referenceType ? `${tx.referenceType}${tx.referenceId ? `:${tx.referenceId.slice(0, 8)}` : ""}` : "-"}
                              </td>
                              <td data-label="금액" style={{ ...tdStyle, textAlign: "right", fontWeight: 600, color: tx.amountKrw > 0 ? COLORS.success : COLORS.danger }}>
                                {tx.amountKrw > 0 ? "+" : ""}{formatKrw(tx.amountKrw)}
                              </td>
                              <td data-label="잔액" style={{ ...tdStyle, textAlign: "right", color: COLORS.textMuted }}>
                                {formatKrw(tx.runningBalance)}
                              </td>
                              <td data-label="기록자" style={tdStyle}>{tx.recordedBy || "-"}</td>
                              <td style={tdStyle}>
                                {!isVoided && (
                                  <button onClick={() => handleVoid(tx.id)}
                                    style={{ ...btnStyle("ghost"), fontSize: 11, padding: "3px 7px", color: COLORS.danger }}>
                                    취소
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
