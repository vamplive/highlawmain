/**
 * 어드민 영수증 관리 페이지
 * - 드래그&드롭 또는 파일 선택으로 PDF/이미지 업로드 → 서버에서 OCR → 메타 자동 추출
 * - 카드별 합계 + 전체 합계 표시
 * - 인라인 수정(상호/금액/카드/결제일) 및 삭제 지원
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../utils/api";

const KRW = new Intl.NumberFormat("ko-KR");

function formatDateInput(s) {
  if (!s) return "";
  return s.slice(0, 10);
}

function formatPaidAt(s) {
  if (!s) return "—";
  // YYYY-MM-DD HH:mm:ss 까지 정확하게 표기. ISO 형식이면 T를 공백으로
  return s.slice(0, 19).replace("T", " ");
}

function formatPaidDate(s) {
  if (!s) return "—";
  return s.slice(0, 10);
}

function formatPaidTime(s) {
  if (!s) return "—";
  return s.slice(11, 19).replace("T", "");
}

const CATEGORY_OPTIONS = [
  { value: "",        label: "(미분류)" },
  { value: "meal",    label: "식대 / 회식" },
  { value: "coffee",  label: "카페 / 음료" },
  { value: "transit", label: "교통 / 주차" },
  { value: "office",  label: "사무용품 / 비품" },
  { value: "client",  label: "접대 / 의뢰인 응대" },
  { value: "court",   label: "법원 / 인지·송달" },
  { value: "filing",  label: "공탁·등기·인지대" },
  { value: "subscription", label: "구독 / 정기결제" },
  { value: "other",   label: "기타" },
];

function categoryLabel(value) {
  return CATEGORY_OPTIONS.find((c) => c.value === value)?.label || value || "(미분류)";
}

// 등록 카드 ID로 우선 조회 → 휴리스틱(first4/last4+issuer) 매칭으로 폴백.
// 영수증의 paymentCardId가 있으면 그게 정답 (사용자가 직접 지정했거나 업로드 시 자동 매칭됨).
function findLinkedCard(cards, receipt) {
  if (!Array.isArray(cards) || !receipt) return null;
  if (receipt.paymentCardId) {
    const linked = cards.find((c) => c.id === receipt.paymentCardId);
    if (linked) return linked;
    // 연결됐던 카드가 삭제됐을 수도 있으므로 휴리스틱 매칭으로 폴백
  }
  return matchCard(cards, receipt.cardFirst4, receipt.cardLast4, receipt.cardName);
}

// 사전 등록한 카드와 영수증의 first4/last4·issuer를 매칭한다.
// 영수증마다 마스킹 위치가 달라 first4 또는 last4 어느 한쪽으로 매칭한다.
// 1순위: (first4 또는 last4 일치) + issuer 일치
// 2순위: (first4 또는 last4 일치)이 1개뿐
function matchCard(cards, first4, last4, issuer) {
  if (!Array.isArray(cards) || (!first4 && !last4)) return null;
  const candidates = cards.filter((c) => {
    if (c.isActive === false) return false;
    return (last4 && c.last4 === last4) || (first4 && c.first4 === first4);
  });
  if (candidates.length === 0) return null;
  if (issuer) {
    const exact = candidates.find((c) => (c.issuer || "").trim() === issuer.trim());
    if (exact) return exact;
  }
  return candidates.length === 1 ? candidates[0] : null;
}

// 카드 자리수 표기: 가지고 있는 쪽만 노출하고 모르는 쪽은 마스킹
function formatCardDigits(first4, last4) {
  const f = first4 || "****";
  const l = last4 || "****";
  return `${f}-****-****-${l}`;
}

const DEFAULT_CARD_COLOR = "#1a3a6b";
const CARD_COLOR_PRESETS = [
  "#1a3a6b", "#0ea5e9", "#16a34a", "#7c3aed", "#dc2626",
  "#f59e0b", "#0d9488", "#475569", "#db2777", "#ea580c",
];

export default function AdminReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [summary, setSummary] = useState({ byCard: [], overall: { count: 0, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ from: "", to: "", card: "" });
  const [uploadQueue, setUploadQueue] = useState([]); // { name, status, error? }
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [detailReceipt, setDetailReceipt] = useState(null);
  const [cards, setCards] = useState([]);
  const [cardManagerOpen, setCardManagerOpen] = useState(false);
  // 현재 로그인 사용자 + 전체 관리자 목록 (admin만 업로더 변경 가능)
  const [currentUser, setCurrentUser] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const fileInputRef = useRef(null);
  const isAdmin = currentUser?.role === "admin";

  const reloadCards = useCallback(async () => {
    try {
      const res = await api.get("/payment-cards");
      setCards(res.data || []);
    } catch (e) {
      console.warn("payment-cards 로드 실패:", e.message);
    }
  }, []);

  useEffect(() => { reloadCards(); }, [reloadCards]);

  // 현재 사용자 정보 조회 — admin 여부 판단용
  useEffect(() => {
    api.get("/admin-users/me")
      .then((res) => setCurrentUser(res.data || null))
      .catch(() => setCurrentUser(null));
  }, []);

  // 관리자만 업로더를 변경할 수 있으므로, admin인 경우에만 사용자 목록 조회
  useEffect(() => {
    if (!isAdmin) return;
    api.get("/admin-users")
      .then((res) => setAdminUsers(res.data || []))
      .catch(() => setAdminUsers([]));
  }, [isAdmin]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (filter.from) p.set("from", filter.from);
    if (filter.to) p.set("to", filter.to);
    if (filter.card) p.set("card", filter.card);
    return p.toString() ? `?${p.toString()}` : "";
  }, [filter]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        api.get(`/receipts${queryString}`),
        api.get(`/receipts/summary${queryString}`),
      ]);
      setReceipts(list.data || []);
      setSummary(sum.data || { byCard: [], overall: { count: 0, total: 0 } });
    } catch (e) {
      console.error(e);
      alert(e.message || "영수증을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => { reload(); }, [reload]);

  /* ── 다중 업로드 (최대 50건, 동시 4건) ──
   *  토큰 절감 전략 (백엔드 측):
   *   1) sharp로 긴 변 1568px·JPEG 82% 리사이즈 → 토큰 70~80% 절감
   *   2) 시스템 프롬프트 cache_control(ephemeral) → 5분 TTL, 후속 호출 90% 할인
   *  프론트 측:
   *   - 파일별로 별도 HTTP 요청 (1요청 = 1영수증). 실패가 다른 파일에 영향 X.
   *   - 워커 4개로 동시 처리 → API 레이트리밋과 충돌 방지하면서 50건 = 약 1~2분.
   *   - 각 파일 완료마다 표 reload 하지 않고, 전체 끝나고 1회만 reload (DB 부하 절감).
   */
  const MAX_FILES_PER_BATCH = 50;
  const UPLOAD_CONCURRENCY = 4;

  const uploadFiles = useCallback(async (files) => {
    let arr = Array.from(files);
    if (arr.length === 0) return;
    if (arr.length > MAX_FILES_PER_BATCH) {
      alert(`한 번에 최대 ${MAX_FILES_PER_BATCH}개까지만 업로드 가능합니다. 처음 ${MAX_FILES_PER_BATCH}개만 처리합니다.`);
      arr = arr.slice(0, MAX_FILES_PER_BATCH);
    }

    // 큐에 고유 키 부여 (같은 이름 파일 중복 대비)
    const items = arr.map((f, i) => ({
      key: `${Date.now()}-${i}-${f.name}`,
      file: f, name: f.name, status: "queued",
    }));
    setUploadQueue((q) => [...q, ...items]);

    // 워커 풀: 각 워커가 큐에서 pop 해서 처리
    let cursor = 0;
    const total = items.length;
    let succeeded = 0;
    let failed = 0;

    async function worker() {
      while (cursor < items.length) {
        const idx = cursor++;
        const it = items[idx];
        setUploadQueue((q) => q.map((x) => x.key === it.key ? { ...x, status: "uploading" } : x));
        try {
          const res = await api.upload("/receipts/upload", it.file);
          const r = res.data;
          const summary = [
            r.vendor || "(가맹점 미확인)",
            r.amount != null ? `₩${KRW.format(r.amount)}` : "(금액 미확인)",
            r.cardName || "(카드 미확인)",
          ].join(" · ");
          setUploadQueue((q) => q.map((x) => x.key === it.key ? { ...x, status: "done", summary } : x));
          succeeded++;
        } catch (err) {
          setUploadQueue((q) => q.map((x) => x.key === it.key ? { ...x, status: "error", error: err.message } : x));
          failed++;
        }
      }
    }

    const workers = Array.from({ length: Math.min(UPLOAD_CONCURRENCY, total) }, () => worker());
    await Promise.all(workers);

    // 모든 업로드 완료 후 1회만 reload — DB·합계 한 번에 갱신
    await reload();

    // 5초 후 성공 항목 제거. 실패는 사용자가 닫을 때까지 유지.
    setTimeout(() => {
      setUploadQueue((q) => q.filter((it) => it.status !== "done"));
    }, 5000);

    if (failed > 0) {
      alert(`업로드 완료: 성공 ${succeeded}건, 실패 ${failed}건`);
    }
  }, [reload]);

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const onPick = (e) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
    e.target.value = ""; // 같은 파일 재선택 가능
  };

  /* ── 수정/삭제 ── */
  function startEdit(r) {
    setEditingId(r.id);
    setEditForm({
      vendor: r.vendor || "",
      amount: r.amount ?? "",
      paidAt: r.paidAt ? r.paidAt.slice(0, 16).replace(" ", "T") : "",
      cardName: r.cardName || "",
      cardLast4: r.cardLast4 || "",
      paymentCardId: r.paymentCardId || "",
      category: r.category || "",
      notes: r.notes || "",
    });
  }

  async function saveEdit() {
    try {
      const payload = {
        vendor: editForm.vendor || null,
        amount: editForm.amount === "" ? null : Number(editForm.amount),
        paidAt: editForm.paidAt ? editForm.paidAt.replace("T", " ") + ":00" : null,
        cardName: editForm.cardName || null,
        cardLast4: editForm.cardLast4 || null,
        paymentCardId: editForm.paymentCardId || null,
        category: editForm.category || null,
        notes: editForm.notes || null,
      };
      await api.patch(`/receipts/${editingId}`, payload);
      setEditingId(null);
      await reload();
    } catch (e) {
      alert(e.message || "저장 실패");
    }
  }

  async function removeReceipt(id) {
    if (!window.confirm("이 영수증을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/receipts/${id}`);
      await reload();
    } catch (e) {
      alert(e.message || "삭제 실패");
    }
  }

  return (
    <div className="receipts-page" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ReceiptsResponsiveStyles />

      {/* 헤더 — 모바일에서는 세로 스택 */}
      <div className="receipts-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>영수증 관리</h1>
          <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
            PDF나 영수증 사진을 끌어다 놓으면 자동으로 OCR 처리되어 가맹점·금액·카드·결제일이 추출됩니다.
          </p>
        </div>
        <button
          onClick={() => setCardManagerOpen(true)}
          className="receipts-card-manager-btn"
          style={{
            background: "#fff", color: "#1a3a6b", border: "1px solid #1a3a6b", borderRadius: 6,
            padding: "10px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
            minHeight: 40,
          }}
        >
          💳 내 카드 관리 ({cards.filter((c) => c.isActive).length})
        </button>
      </div>

      {/* 카드별 합계 — 모바일에서 한 줄에 2개 */}
      <div className="receipts-summary-grid">
        <SummaryCard label="총 지출" total={summary.overall.total} count={summary.overall.count} highlight />
        {summary.byCard.map((c) => (
          <SummaryCard key={c.card_name} label={c.card_name} total={c.total} count={c.count} />
        ))}
      </div>

      {/* 드롭존 — 모바일에서 패딩 축소 */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onClick={() => fileInputRef.current?.click()}
        className="receipts-dropzone"
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: "#1e293b", marginBottom: 4 }}>
          영수증을 끌어다 놓거나 탭하여 선택
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
          PDF · JPG · PNG · WEBP · HEIC<br className="receipts-mobile-only" />
          파일당 15MB · 최대 50개
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,application/pdf,image/*"
          onChange={onPick}
          style={{ display: "none" }}
        />
      </div>

      {/* 업로드 큐 — 진행률 카운터 포함 */}
      {uploadQueue.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e5e8ed", borderRadius: 8, padding: 12 }}>
          <UploadQueueHeader queue={uploadQueue} />
          <div style={{ maxHeight: 240, overflow: "auto", marginTop: 6 }}>
            {uploadQueue.map((it) => (
              <div key={it.key || it.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", fontSize: 12 }}>
                <span style={{
                  width: 64, fontWeight: 500,
                  color: it.status === "error" ? "#dc2626"
                       : it.status === "done" ? "#16a34a"
                       : it.status === "uploading" ? "#0ea5e9"
                       : "#94a3b8",
                }}>
                  {it.status === "queued" ? "대기" : it.status === "uploading" ? "처리 중" : it.status === "done" ? "완료" : "실패"}
                </span>
                <span style={{ flex: 1, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</span>
                {it.summary && <span style={{ color: "#16a34a" }}>{it.summary}</span>}
                {it.error && <span style={{ color: "#dc2626" }}>{it.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 필터 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <FilterField label="시작일">
          <input type="date" value={filter.from} onChange={(e) => setFilter((f) => ({ ...f, from: e.target.value }))} style={inputStyle} />
        </FilterField>
        <FilterField label="종료일">
          <input type="date" value={filter.to} onChange={(e) => setFilter((f) => ({ ...f, to: e.target.value }))} style={inputStyle} />
        </FilterField>
        <FilterField label="카드">
          <select value={filter.card} onChange={(e) => setFilter((f) => ({ ...f, card: e.target.value }))} style={inputStyle}>
            <option value="">전체</option>
            {summary.byCard.map((c) => <option key={c.card_name} value={c.card_name}>{c.card_name}</option>)}
          </select>
        </FilterField>
        {(filter.from || filter.to || filter.card) && (
          <button onClick={() => setFilter({ from: "", to: "", card: "" })}
            style={{ ...inputStyle, cursor: "pointer", background: "#f1f5f9" }}>필터 초기화</button>
        )}
      </div>

      {/* 목록 — 데스크톱 테이블 + 모바일 카드 (CSS로 토글) */}
      {loading ? (
        <div style={{ background: "#fff", border: "1px solid #e5e8ed", borderRadius: 8, padding: 32, textAlign: "center", color: "#94a3b8" }}>
          불러오는 중…
        </div>
      ) : receipts.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #e5e8ed", borderRadius: 8, padding: 48, textAlign: "center", color: "#94a3b8" }}>
          등록된 영수증이 없습니다. 위에 파일을 끌어다 놓아 시작하세요.
        </div>
      ) : (
        <>
          {/* 데스크톱 — 테이블 */}
          <div className="receipts-desktop-list" style={{ background: "#fff", border: "1px solid #e5e8ed", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e8ed" }}>
                  <Th>날짜</Th>
                  <Th>시간</Th>
                  <Th>가맹점</Th>
                  <Th>품목</Th>
                  <Th align="right">금액</Th>
                  <Th>카드</Th>
                  <Th>분류</Th>
                  <Th>업로더</Th>
                  <Th>OCR</Th>
                  <Th>액션</Th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  editingId === r.id ? (
                    <EditRow
                      key={r.id}
                      receipt={r}
                      form={editForm}
                      onChange={setEditForm}
                      onCancel={() => setEditingId(null)}
                      onSave={saveEdit}
                    />
                  ) : (
                    <tr
                      key={r.id}
                      style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                      onClick={(e) => {
                        const tag = e.target.tagName;
                        if (tag === "BUTTON" || tag === "A") return;
                        setDetailReceipt(r);
                      }}
                    >
                      <Td mono>{formatPaidDate(r.paidAt)}</Td>
                      <Td mono>{formatPaidTime(r.paidAt)}</Td>
                      <Td>{r.vendor || <span style={{ color: "#94a3b8" }}>—</span>}</Td>
                      <Td><ItemsSummary items={r.items} /></Td>
                      <Td align="right" mono>{r.amount != null ? `₩${KRW.format(r.amount)}` : <span style={{ color: "#94a3b8" }}>—</span>}</Td>
                      <Td><CardCell receipt={r} cards={cards} /></Td>
                      <Td>
                        <CategoryBadge value={r.category} />
                        {r.notes && (
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.notes}>
                            📝 {r.notes}
                          </div>
                        )}
                      </Td>
                      <Td>
                        <UploaderCell receipt={r} />
                      </Td>
                      <Td>
                        <OcrBadge status={r.ocrStatus} />
                        {r.aiCostKrw != null && (
                          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                            ₩{r.aiCostKrw.toFixed(1)} · {((r.aiInputTokens || 0) + (r.aiOutputTokens || 0)).toLocaleString()}tok
                          </div>
                        )}
                      </Td>
                      <Td>
                        <button onClick={() => startEdit(r)} style={btnGhost}>수정</button>
                        <button onClick={() => removeReceipt(r.id)} style={{ ...btnGhost, color: "#dc2626" }}>삭제</button>
                      </Td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 — 카드 리스트 */}
          <div className="receipts-mobile-list">
            {receipts.map((r) => (
              <ReceiptMobileCard
                key={r.id}
                receipt={r}
                cards={cards}
                onOpen={() => setDetailReceipt(r)}
                onDelete={() => removeReceipt(r.id)}
              />
            ))}
          </div>
        </>
      )}

      {detailReceipt && (
        <DetailModal
          receipt={detailReceipt}
          cards={cards}
          adminUsers={adminUsers}
          isAdmin={isAdmin}
          onClose={() => setDetailReceipt(null)}
          onSaved={async () => { await reload(); }}
          onDeleted={async () => { setDetailReceipt(null); await reload(); }}
        />
      )}

      {cardManagerOpen && (
        <CardManagerModal
          cards={cards}
          onClose={() => setCardManagerOpen(false)}
          onChanged={async () => {
            await reloadCards();
            // 새 카드를 등록했을 수 있으니 미연결 영수증을 일괄 매칭한다.
            try {
              const res = await api.post("/receipts/backfill-card-matches");
              if (res.data?.matched > 0) {
                await reload();
              }
            } catch (e) {
              console.warn("backfill 실패:", e.message);
            }
          }}
          onReloadReceipts={reload}
        />
      )}
    </div>
  );
}

/* ───────── 보조 컴포넌트 ───────── */

function SummaryCard({ label, total, count, highlight }) {
  return (
    <div style={{
      background: highlight ? "linear-gradient(135deg, #1a3a6b 0%, #2a4f8a 100%)" : "#fff",
      color: highlight ? "#fff" : "#1e293b",
      border: highlight ? "none" : "1px solid #e5e8ed",
      borderRadius: 8, padding: "14px 16px",
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", opacity: highlight ? 0.8 : 0.6, color: highlight ? "#fff" : "#64748b" }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>
        ₩{KRW.format(total || 0)}
      </div>
      <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7 }}>{count}건</div>
    </div>
  );
}

function UploadQueueHeader({ queue }) {
  const total = queue.length;
  const done = queue.filter((q) => q.status === "done").length;
  const err = queue.filter((q) => q.status === "error").length;
  const inFlight = queue.filter((q) => q.status === "uploading").length;
  const pending = queue.filter((q) => q.status === "queued").length;
  const pct = total > 0 ? Math.round(((done + err) / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569", marginBottom: 6 }}>
        <span>
          업로드 진행 — 완료 {done}/{total}
          {inFlight > 0 && <span style={{ color: "#0ea5e9", marginLeft: 8 }}>(처리중 {inFlight})</span>}
          {pending > 0 && <span style={{ color: "#94a3b8", marginLeft: 8 }}>(대기 {pending})</span>}
          {err > 0 && <span style={{ color: "#dc2626", marginLeft: 8 }}>(실패 {err})</span>}
        </span>
        <span style={{ fontWeight: 500 }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: "#e5e8ed", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: err > 0 ? "#f59e0b" : "#16a34a", transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#64748b" }}>
      <span style={{ fontWeight: 500 }}>{label}</span>
      {children}
    </label>
  );
}

function Th({ children, align = "left" }) {
  return <th style={{ textAlign: align, padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase" }}>{children}</th>;
}

function Td({ children, align = "left", mono, colSpan }) {
  return <td colSpan={colSpan} style={{ padding: "12px", textAlign: align, color: "#1e293b", fontFamily: mono ? "monospace" : undefined }}>{children}</td>;
}

function OcrBadge({ status }) {
  const map = {
    done:           { bg: "#dcfce7", fg: "#166534", label: "AI 추출완료" },
    low_confidence: { bg: "#fef3c7", fg: "#92400e", label: "확인 필요" },
    pending:        { bg: "#fef3c7", fg: "#92400e", label: "대기" },
    manual:         { bg: "#e0e7ff", fg: "#3730a3", label: "수동입력" },
    failed:         { bg: "#fee2e2", fg: "#991b1b", label: "실패" },
  };
  const s = map[status] || map.pending;
  return <span style={{ background: s.bg, color: s.fg, fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>{s.label}</span>;
}

function EditRow({ form, onChange, onCancel, onSave }) {
  const set = (k) => (e) => onChange({ ...form, [k]: e.target.value });
  return (
    <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#fefce8" }}>
      <Td colSpan={2}>
        <input
          type="datetime-local"
          step="1"
          value={form.paidAt ? form.paidAt.slice(0, 19) : formatDateInput(form.paidAt)}
          onChange={set("paidAt")}
          style={inputStyle}
        />
      </Td>
      <Td><input value={form.vendor} onChange={set("vendor")} style={inputStyle} placeholder="가맹점" /></Td>
      <Td><span style={{ color: "#94a3b8", fontSize: 12 }}>—</span></Td>
      <Td align="right"><input type="number" value={form.amount} onChange={set("amount")} style={{ ...inputStyle, textAlign: "right", width: 100 }} placeholder="금액" /></Td>
      <Td>
        <input value={form.cardName} onChange={set("cardName")} style={{ ...inputStyle, width: 100 }} placeholder="카드사" />
        <input value={form.cardLast4} onChange={set("cardLast4")} maxLength={4} style={{ ...inputStyle, width: 60, marginLeft: 4 }} placeholder="끝4자리" />
      </Td>
      <Td>
        <select value={form.category || ""} onChange={set("category")} style={{ ...inputStyle, width: 140 }}>
          {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input value={form.notes} onChange={set("notes")} style={{ ...inputStyle, marginTop: 4, width: 200 }} placeholder="메모 (선택)" />
      </Td>
      <Td>—</Td>
      <Td>—</Td>
      <Td>
        <button onClick={onSave} style={{ ...btnGhost, color: "#16a34a" }}>저장</button>
        <button onClick={onCancel} style={btnGhost}>취소</button>
      </Td>
    </tr>
  );
}

function ItemsSummary({ items }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>;
  }
  const first = items[0]?.name || "";
  const rest = items.length - 1;
  const tooltip = items.map((it) => {
    const qty = it.quantity ? ` x${it.quantity}` : "";
    const price = it.price != null ? ` (₩${KRW.format(it.price)})` : "";
    return `• ${it.name}${qty}${price}`;
  }).join("\n");
  return (
    <div title={tooltip} style={{ fontSize: 12, color: "#475569", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      🛒 {first}{rest > 0 ? <span style={{ color: "#94a3b8" }}> 외 {rest}건</span> : null}
    </div>
  );
}

function CategoryBadge({ value }) {
  const palette = {
    meal:    { bg: "#fef3c7", fg: "#92400e" },
    coffee:  { bg: "#fce7f3", fg: "#9d174d" },
    transit: { bg: "#dbeafe", fg: "#1e40af" },
    office:  { bg: "#e0e7ff", fg: "#3730a3" },
    client:  { bg: "#fee2e2", fg: "#991b1b" },
    court:   { bg: "#dcfce7", fg: "#166534" },
    filing:  { bg: "#d1fae5", fg: "#065f46" },
    subscription: { bg: "#ede9fe", fg: "#5b21b6" },
    other:   { bg: "#f1f5f9", fg: "#475569" },
  };
  const p = palette[value] || { bg: "#f8fafc", fg: "#94a3b8" };
  return (
    <span style={{ background: p.bg, color: p.fg, fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>
      {categoryLabel(value)}
    </span>
  );
}

/* ───────── 카드 표시 ───────── */
// 업로더 표시 — name 우선, 없으면 username, 둘 다 없으면 "—"
// admin 역할이면 별표 강조 (관리자 vs 직원 구분)
function UploaderCell({ receipt }) {
  const name = receipt.uploaderName || receipt.uploaderUsername;
  if (!name) return <span style={{ color: "#94a3b8" }}>—</span>;
  const isAdmin = receipt.uploaderRole === "admin";
  return (
    <div>
      <span style={{
        fontSize: 12, fontWeight: 500,
        color: isAdmin ? "#1a3a6b" : "#475569",
      }}>
        {name}
      </span>
      {isAdmin && (
        <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 4 }}>관리자</span>
      )}
      {receipt.uploaderUsername && receipt.uploaderName && (
        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
          @{receipt.uploaderUsername}
        </div>
      )}
    </div>
  );
}

function CardCell({ receipt, cards }) {
  const linked = findLinkedCard(cards, receipt);
  const isExplicit = linked && receipt.paymentCardId === linked.id;

  if (linked) {
    const color = linked.color || DEFAULT_CARD_COLOR;
    return (
      <div>
        <span style={{
          display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 12,
          fontWeight: 500, background: `${color}20`, color, border: `1px solid ${color}40`,
        }} title={isExplicit ? "등록 카드로 연결됨" : "앞/끝 4자리·카드사로 자동 매칭 (확정 아님)"}>
          {linked.label}{isExplicit ? "" : " ?"}
        </span>
        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
          {linked.issuer || receipt.cardName || "—"} {formatCardDigits(receipt.cardFirst4 || linked.first4, receipt.cardLast4 || linked.last4)}
        </div>
      </div>
    );
  }
  // 미등록 카드: 추출된 카드사·자리 그대로 표시
  if (!receipt.cardName && !receipt.cardLast4 && !receipt.cardFirst4) {
    return <span style={{ color: "#94a3b8" }}>—</span>;
  }
  return (
    <div>
      <div>{receipt.cardName || <span style={{ color: "#94a3b8" }}>—</span>}</div>
      {(receipt.cardFirst4 || receipt.cardLast4) && (
        <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", marginTop: 2 }}>
          {formatCardDigits(receipt.cardFirst4, receipt.cardLast4)}
        </div>
      )}
    </div>
  );
}

/* ───────── 카드 관리 모달 ─────────
 *  운영자가 보유 카드(법인/개인/체크/연회비 면제 카드 등)를 미리 등록.
 *  영수증의 last4 + 카드사를 매칭하여 별칭·색상으로 표기한다.
 */
function CardManagerModal({ cards, onClose, onChanged, onReloadReceipts }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ first4: "", last4: "", issuer: "", label: "", color: DEFAULT_CARD_COLOR, memo: "" });
  const [saving, setSaving] = useState(false);
  const [backfilling, setBackfilling] = useState(false);

  // 기존 영수증 일괄 재매칭 — 등록 카드가 추가/수정된 후, 그 카드와 일치하는
  // 미연결 영수증(payment_card_id IS NULL)을 한 번에 연결한다.
  async function runBackfill() {
    if (backfilling) return;
    setBackfilling(true);
    try {
      const res = await api.post("/receipts/backfill-card-matches");
      const { scanned = 0, matched = 0 } = res.data || {};
      alert(`재매칭 완료: 미연결 ${scanned}건 중 ${matched}건 카드와 연결되었습니다.`);
      if (matched > 0) await onReloadReceipts?.();
    } catch (e) {
      alert(e.message || "재매칭 실패");
    } finally {
      setBackfilling(false);
    }
  }

  function startNew() {
    setEditing("new");
    setForm({ first4: "", last4: "", issuer: "", label: "", color: DEFAULT_CARD_COLOR, memo: "" });
  }
  function startEdit(c) {
    setEditing(c.id);
    setForm({
      first4: c.first4 || "",
      last4: c.last4 || "",
      issuer: c.issuer || "",
      label: c.label || "",
      color: c.color || DEFAULT_CARD_COLOR,
      memo: c.memo || "",
    });
  }
  function cancel() { setEditing(null); }

  async function save() {
    const f4 = form.first4.trim();
    const l4 = form.last4.trim();
    if (!f4 && !l4) { alert("앞 4자리 또는 끝 4자리 중 하나는 입력해야 합니다"); return; }
    if (f4 && !/^\d{4}$/.test(f4)) { alert("앞 4자리는 숫자 4자리로 입력하세요"); return; }
    if (l4 && !/^\d{4}$/.test(l4)) { alert("끝 4자리는 숫자 4자리로 입력하세요"); return; }
    if (!form.label.trim()) { alert("카드 별칭은 필수입니다"); return; }
    setSaving(true);
    try {
      const payload = {
        first4: f4 || null,
        last4:  l4 || null,
        issuer: form.issuer.trim() || null,
        label:  form.label.trim(),
        color:  form.color || null,
        memo:   form.memo.trim() || null,
      };
      if (editing === "new") {
        await api.post("/payment-cards", payload);
      } else {
        await api.patch(`/payment-cards/${editing}`, payload);
      }
      await onChanged?.();
      setEditing(null);
    } catch (e) {
      alert(e.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("이 카드를 삭제하시겠습니까? (이 카드로 결제한 기존 영수증은 그대로 남고, 별칭만 사라집니다)")) return;
    try {
      await api.delete(`/payment-cards/${id}`);
      await onChanged?.();
    } catch (e) {
      alert(e.message || "삭제 실패");
    }
  }

  async function toggleActive(c) {
    try {
      await api.patch(`/payment-cards/${c.id}`, { isActive: !c.isActive });
      await onChanged?.();
    } catch (e) {
      alert(e.message || "상태 변경 실패");
    }
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.55)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 12, width: "100%", maxWidth: 700,
        maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #e5e8ed", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>💳 내 카드 관리</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              사전 등록한 카드는 영수증의 앞/끝 4자리·카드사와 자동 매칭되어 별칭으로 표시됩니다.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={runBackfill}
              disabled={backfilling}
              title="이미 업로드된 영수증 중 카드 미연결인 건을 등록 카드의 앞/끝 4자리로 일괄 재매칭합니다"
              style={{
                background: "#fff", color: "#1a3a6b", border: "1px solid #1a3a6b", borderRadius: 6,
                padding: "6px 12px", fontSize: 12, fontWeight: 500,
                cursor: backfilling ? "wait" : "pointer", opacity: backfilling ? 0.6 : 1, whiteSpace: "nowrap",
              }}
            >
              {backfilling ? "재매칭 중…" : "🔄 기존 영수증 재매칭"}
            </button>
            <button onClick={onClose} style={{ ...btnGhost, fontSize: 22, padding: "0 8px" }}>×</button>
          </div>
        </div>

        <div style={{ padding: 20, overflow: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 등록된 카드 목록 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>등록된 카드 ({cards.length}개)</span>
              {editing !== "new" && (
                <button onClick={startNew} style={{
                  background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6,
                  padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}>+ 카드 추가</button>
              )}
            </div>
            {cards.length === 0 && editing !== "new" && (
              <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13, background: "#f8fafc", borderRadius: 6 }}>
                아직 등록된 카드가 없습니다. 위 "+ 카드 추가"로 첫 카드를 등록하세요.
              </div>
            )}
            {cards.map((c) => (
              editing === c.id ? (
                <CardForm key={c.id} form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
              ) : (
                <div key={c.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                  borderBottom: "1px solid #f1f5f9", opacity: c.isActive ? 1 : 0.5,
                }}>
                  <span style={{
                    display: "inline-block", padding: "4px 10px", borderRadius: 4, fontSize: 13, fontWeight: 500,
                    background: `${c.color || DEFAULT_CARD_COLOR}20`,
                    color: c.color || DEFAULT_CARD_COLOR,
                    border: `1px solid ${c.color || DEFAULT_CARD_COLOR}40`,
                    minWidth: 80, textAlign: "center",
                  }}>{c.label}</span>
                  <span style={{ fontSize: 13, color: "#1e293b" }}>{c.issuer || "—"}</span>
                  <span style={{ fontSize: 13, color: "#475569", fontFamily: "monospace" }}>
                    {c.first4 ? c.first4 : "****"}-****-****-{c.last4 ? c.last4 : "****"}
                  </span>
                  <span style={{ flex: 1, fontSize: 12, color: "#94a3b8" }}>{c.memo || ""}</span>
                  {!c.isActive && <span style={{ fontSize: 11, color: "#94a3b8" }}>(비활성)</span>}
                  <button onClick={() => toggleActive(c)} style={btnGhost}>{c.isActive ? "비활성화" : "활성화"}</button>
                  <button onClick={() => startEdit(c)} style={btnGhost}>수정</button>
                  <button onClick={() => remove(c.id)} style={{ ...btnGhost, color: "#dc2626" }}>삭제</button>
                </div>
              )
            ))}
          </div>

          {/* 신규 등록 폼 */}
          {editing === "new" && (
            <CardForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} isNew />
          )}
        </div>
      </div>
    </div>
  );
}

function CardForm({ form, setForm, onSave, onCancel, saving, isNew }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 6, padding: 14, marginBottom: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#854d0e", marginBottom: 10 }}>
        {isNew ? "+ 새 카드 등록" : "카드 수정"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="별칭 (필수)">
          <input value={form.label} onChange={set("label")} placeholder="법카-법인 / 개인 신한 The 등" style={{ ...inputStyle, width: "100%" }} />
        </Field>
        <Field label="카드사">
          <input value={form.issuer} onChange={set("issuer")} placeholder="신한카드, KB국민카드 등" style={{ ...inputStyle, width: "100%" }} />
        </Field>
        <Field label="앞 4자리 (선택)">
          <input value={form.first4} onChange={set("first4")} maxLength={4} placeholder="1234 (앞자리 보이는 영수증용)" style={{ ...inputStyle, width: "100%", fontFamily: "monospace" }} />
        </Field>
        <Field label="끝 4자리 (선택)">
          <input value={form.last4} onChange={set("last4")} maxLength={4} placeholder="9876 (끝자리 보이는 영수증용)" style={{ ...inputStyle, width: "100%", fontFamily: "monospace" }} />
        </Field>
        <Field label="표시 색상">
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {CARD_COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                style={{
                  width: 24, height: 24, borderRadius: 4, background: c,
                  border: form.color === c ? "2px solid #1e293b" : "1px solid rgba(0,0,0,0.1)",
                  cursor: "pointer",
                }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>
        <Field label="메모 (선택)" full>
          <input value={form.memo} onChange={set("memo")} placeholder="연회비 면제 / 사용 한도 / 만료일 등" style={{ ...inputStyle, width: "100%" }} />
        </Field>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={btnGhost}>취소</button>
        <button onClick={onSave} disabled={saving} style={{
          background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6,
          padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: saving ? "wait" : "pointer",
          opacity: saving ? 0.6 : 1,
        }}>{saving ? "저장 중…" : "저장"}</button>
      </div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <label style={{ display: "block", gridColumn: full ? "1 / -1" : undefined }}>
      <span style={{ display: "block", fontSize: 11, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  );
}

/* ───────── 상세 모달 ─────────
 * 영수증 한 건의 모든 정보를 한 화면에 표시:
 *  - 좌측: 원본 파일 미리보기 (이미지 인라인 / PDF iframe) + 다운로드 버튼
 *  - 우측: 추출된 메타·품목·AI 사용량 + 분류·메모 편집
 */
function DetailModal({ receipt, cards = [], adminUsers = [], isAdmin = false, onClose, onSaved, onDeleted }) {
  const linkedCard = findLinkedCard(cards, receipt);
  const [category, setCategory] = useState(receipt.category || "");
  const [notes, setNotes] = useState(receipt.notes || "");
  // 사용자 명시 연결: paymentCardId가 있으면 그것, 없으면 빈 값 (자동 매칭은 휴리스틱이라 저장 안 함)
  const [paymentCardId, setPaymentCardId] = useState(receipt.paymentCardId || "");
  // 업로더 — admin만 변경 가능. 빈 값은 미지정.
  const [createdByAdminId, setCreatedByAdminId] = useState(receipt.createdByAdminId || "");
  const [saving, setSaving] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const isImage = (receipt.mimeType || "").startsWith("image/");
  const isPdf = (receipt.mimeType || "") === "application/pdf";

  async function reprocess() {
    if (!window.confirm("AI에게 이 영수증을 다시 분석시키고 품목·메타를 새로 받습니다. (수동 입력한 가맹점·금액은 유지됩니다)\n진행할까요?")) return;
    setReprocessing(true);
    try {
      await api.post(`/receipts/${receipt.id}/reprocess`);
      await onSaved?.();
      onClose?.();
    } catch (e) {
      alert(e.message || "재추출 실패");
    } finally {
      setReprocessing(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        category: category || null,
        notes: notes || null,
        paymentCardId: paymentCardId || null,
      };
      // 업로더 변경은 admin만 허용 (백엔드도 별도 검증)
      if (isAdmin) payload.createdByAdminId = createdByAdminId || null;
      await api.patch(`/receipts/${receipt.id}`, payload);
      await onSaved?.();
    } catch (e) {
      alert(e.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm("이 영수증을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/receipts/${receipt.id}`);
      await onDeleted?.();
    } catch (e) {
      alert(e.message || "삭제 실패");
    }
  }

  const tokensTotal = (receipt.aiInputTokens || 0) + (receipt.aiOutputTokens || 0);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="receipts-detail-modal"
      >
        {/* 헤더 */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #e5e8ed", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {receipt.vendor || "(가맹점 미확인)"}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {receipt.fileName} · {(receipt.fileSize / 1024).toFixed(0)}KB
            </div>
          </div>
          <button onClick={onClose} style={{ ...btnGhost, fontSize: 22, padding: "0 8px", flexShrink: 0 }} aria-label="닫기">×</button>
        </div>

        {/* 본문: 데스크톱 2열 / 모바일 세로 스택 */}
        <div className="receipts-detail-body">
          {/* 좌측 — 파일 미리보기 */}
          <div className="receipts-detail-preview">
            {isImage ? (
              <img src={receipt.fileUrl} alt={receipt.fileName} style={{ maxWidth: "100%", height: "auto", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
            ) : isPdf ? (
              <iframe
                src={receipt.fileUrl}
                title={receipt.fileName}
                style={{ width: "100%", height: "100%", minHeight: 400, border: "none", background: "#fff", borderRadius: 6 }}
              />
            ) : (
              <div style={{ padding: 40, color: "#64748b", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📎</div>
                미리보기 불가능한 형식입니다.
              </div>
            )}
          </div>

          {/* 우측 — 메타 + 편집 */}
          <div className="receipts-detail-meta">
            {/* 핵심 정보 */}
            <Section title="결제 정보">
              <KV label="가맹점" value={receipt.vendor} />
              <KV label="금액" value={receipt.amount != null ? `₩${KRW.format(receipt.amount)}` : null} mono />
              <KV label="결제 일시" value={formatPaidAt(receipt.paidAt)} mono />
              <KV
                label="카드"
                value={receipt.cardName ? `${receipt.cardName}${receipt.cardLast4 ? ` (****${receipt.cardLast4})` : ""}` : null}
              />
              {!isAdmin && (
                <KV
                  label="업로더"
                  value={receipt.uploaderName || receipt.uploaderUsername
                    ? `${receipt.uploaderName || receipt.uploaderUsername}${receipt.uploaderRole === "admin" ? " (관리자)" : ""}`
                    : null}
                />
              )}
            </Section>

            {/* 업로더 변경 — admin 전용 */}
            {isAdmin && (
              <Section title="업로더">
                <select
                  value={createdByAdminId}
                  onChange={(e) => setCreatedByAdminId(e.target.value)}
                  style={{ ...inputStyle, width: "100%" }}
                >
                  <option value="">(미지정)</option>
                  {adminUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.username}{u.role === "admin" ? " (관리자)" : ""} · @{u.username}
                    </option>
                  ))}
                </select>
                <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>
                  현재 표시: {receipt.uploaderName || receipt.uploaderUsername || "—"}
                </div>
              </Section>
            )}

            {/* 등록 카드 선택 (사용자 직접 지정) */}
            <Section title="사용 카드 (등록된 내 카드)">
              <select
                value={paymentCardId}
                onChange={(e) => setPaymentCardId(e.target.value)}
                style={{ ...inputStyle, width: "100%" }}
              >
                <option value="">
                  {linkedCard && !receipt.paymentCardId
                    ? `(자동 매칭: ${linkedCard.label} — 저장하면 확정)`
                    : "(미지정 / 자동 매칭에 맡김)"}
                </option>
                {cards.filter((c) => c.isActive).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} — {c.issuer || "—"} ****{c.last4}
                  </option>
                ))}
                {cards.filter((c) => !c.isActive).length > 0 && (
                  <optgroup label="비활성 카드">
                    {cards.filter((c) => !c.isActive).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label} — ****{c.last4} (비활성)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              {linkedCard && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                  현재 표시:{" "}
                  <span style={{
                    display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 500,
                    background: `${linkedCard.color || DEFAULT_CARD_COLOR}20`,
                    color: linkedCard.color || DEFAULT_CARD_COLOR,
                    border: `1px solid ${linkedCard.color || DEFAULT_CARD_COLOR}40`,
                  }}>{linkedCard.label}</span>
                  {!receipt.paymentCardId && <span style={{ color: "#f59e0b", marginLeft: 8 }}>※ 자동 매칭 (저장하면 확정)</span>}
                </div>
              )}
            </Section>

            {/* 분류 + 메모 (편집) */}
            <Section title="분류 / 메모">
              <label style={{ display: "block", fontSize: 11, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>분류</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, width: "100%", marginBottom: 12 }}>
                {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <label style={{ display: "block", fontSize: 11, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>메모</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="이 영수증에 대한 메모를 적어주세요. (예: 김철수 의뢰인 자문 회의 비용)"
                style={{ ...inputStyle, width: "100%", resize: "vertical", fontFamily: "inherit" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  onClick={save}
                  disabled={saving}
                  style={{
                    background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 6,
                    padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: saving ? "wait" : "pointer",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "저장 중…" : "분류·메모 저장"}
                </button>
                <a
                  href={receipt.downloadUrl}
                  style={{
                    background: "#fff", color: "#1a3a6b", border: "1px solid #1a3a6b", borderRadius: 6,
                    padding: "8px 16px", fontSize: 13, fontWeight: 500, textDecoration: "none",
                  }}
                >
                  ⬇ 원본 다운로드
                </a>
                <button onClick={remove} style={{ ...btnGhost, color: "#dc2626", marginLeft: "auto" }}>삭제</button>
              </div>
            </Section>

            {/* 품목 */}
            {(!receipt.items || receipt.items.length === 0) ? (
              <Section title="구매 품목">
                <div style={{ fontSize: 12, color: "#64748b", padding: "8px 0" }}>
                  추출된 품목이 없습니다. 영수증에 품목이 적혀 있는데도 비어 있다면 아래 버튼으로 AI에게 다시 분석시켜 보세요.
                </div>
                <button
                  onClick={reprocess}
                  disabled={reprocessing}
                  style={{
                    background: "#fff", color: "#1a3a6b", border: "1px solid #1a3a6b",
                    borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 500,
                    cursor: reprocessing ? "wait" : "pointer", opacity: reprocessing ? 0.6 : 1,
                  }}
                >
                  {reprocessing ? "재추출 중…" : "↻ AI 재추출"}
                </button>
              </Section>
            ) : (
              <Section title={`구매 품목 (${receipt.items.length}건)`}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5e8ed", color: "#64748b" }}>
                      <th style={{ textAlign: "left", padding: "6px 4px", fontWeight: 500 }}>품목</th>
                      <th style={{ textAlign: "right", padding: "6px 4px", fontWeight: 500, width: 50 }}>수량</th>
                      <th style={{ textAlign: "right", padding: "6px 4px", fontWeight: 500, width: 90 }}>금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "6px 4px", color: "#1e293b" }}>{it.name}</td>
                        <td style={{ padding: "6px 4px", textAlign: "right", fontFamily: "monospace", color: "#475569" }}>
                          {it.quantity ?? "—"}
                        </td>
                        <td style={{ padding: "6px 4px", textAlign: "right", fontFamily: "monospace", color: "#1e293b" }}>
                          {it.price != null ? `₩${KRW.format(it.price)}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {/* AI 사용량 */}
            {receipt.aiModel && (
              <Section title="AI 사용량">
                <div style={{ marginBottom: 8 }}>
                  <button
                    onClick={reprocess}
                    disabled={reprocessing}
                    style={{
                      background: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1",
                      borderRadius: 6, padding: "4px 10px", fontSize: 11,
                      cursor: reprocessing ? "wait" : "pointer", opacity: reprocessing ? 0.6 : 1,
                    }}
                  >
                    {reprocessing ? "재추출 중…" : "↻ AI 재추출"}
                  </button>
                </div>
                <KV label="모델" value={receipt.aiModel} mono />
                <KV label="신뢰도" value={receipt.aiConfidence != null ? `${(receipt.aiConfidence * 100).toFixed(0)}%` : null} />
                <KV label="입력 토큰" value={receipt.aiInputTokens?.toLocaleString()} mono />
                <KV label="출력 토큰" value={receipt.aiOutputTokens?.toLocaleString()} mono />
                <KV label="합계 토큰" value={tokensTotal.toLocaleString()} mono />
                <KV
                  label="비용 (추정)"
                  value={
                    receipt.aiCostKrw != null
                      ? `₩${receipt.aiCostKrw.toFixed(2)} (${receipt.aiCostUsd != null ? `$${receipt.aiCostUsd.toFixed(5)}` : "—"})`
                      : null
                  }
                  mono
                />
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function KV({ label, value, mono }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8, padding: "4px 0", fontSize: 13 }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ color: value ? "#1e293b" : "#cbd5e1", fontFamily: mono ? "monospace" : undefined }}>
        {value || "—"}
      </span>
    </div>
  );
}

const inputStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: 4,
  padding: "5px 8px",
  fontSize: 12,
  color: "#1e293b",
  background: "#fff",
};

const btnGhost = {
  border: "none",
  background: "none",
  cursor: "pointer",
  fontSize: 12,
  color: "#475569",
  padding: "4px 8px",
  marginRight: 4,
};

/* ───────── 모바일 카드 ─────────
 * 데스크톱 테이블 1행에 들어가던 정보(날짜·시간·가맹점·금액·카드·분류·메모·업로더)를
 * 한 카드에 시각적으로 정리한다. 카드 전체가 클릭 가능 → 상세 모달로.
 */
function ReceiptMobileCard({ receipt: r, cards, onOpen, onDelete }) {
  return (
    <div
      onClick={(e) => {
        const tag = e.target.tagName;
        if (tag === "BUTTON" || tag === "A") return;
        onOpen?.();
      }}
      style={{
        background: "#fff", border: "1px solid #e5e8ed", borderRadius: 10,
        padding: 14, cursor: "pointer", display: "flex", flexDirection: "column", gap: 10,
      }}
    >
      {/* 1행: 날짜·시간 + 금액 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>
          {formatPaidDate(r.paidAt)} <span style={{ color: "#cbd5e1" }}>·</span> {formatPaidTime(r.paidAt)}
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: "#1e293b", fontFamily: "monospace", whiteSpace: "nowrap" }}>
          {r.amount != null ? `₩${KRW.format(r.amount)}` : <span style={{ color: "#cbd5e1" }}>—</span>}
        </div>
      </div>

      {/* 2행: 가맹점 */}
      <div style={{ fontSize: 15, fontWeight: 500, color: "#1e293b", lineHeight: 1.4, wordBreak: "keep-all" }}>
        {r.vendor || <span style={{ color: "#94a3b8" }}>(가맹점 미확인)</span>}
      </div>

      {/* 3행: 카드 + 분류 배지 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <CardCell receipt={r} cards={cards} />
        <CategoryBadge value={r.category} />
        <OcrBadge status={r.ocrStatus} />
      </div>

      {/* 4행: 메모 (전체 표시, 줄바꿈 허용) */}
      {r.notes && (
        <div style={{
          fontSize: 12, color: "#475569", background: "#f8fafc",
          padding: "8px 10px", borderRadius: 6, lineHeight: 1.55,
          wordBreak: "break-word", whiteSpace: "pre-wrap",
        }}>
          📝 {r.notes}
        </div>
      )}

      {/* 5행: 업로더 + 액션 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, paddingTop: 6, borderTop: "1px solid #f1f5f9" }}>
        <div style={{ fontSize: 11, color: "#64748b" }}>
          👤 <UploaderInline receipt={r} />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
          style={{ background: "none", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", minHeight: 32 }}
        >
          삭제
        </button>
      </div>
    </div>
  );
}

// 인라인 업로더 표시 (모바일 카드 하단용)
function UploaderInline({ receipt }) {
  const name = receipt.uploaderName || receipt.uploaderUsername;
  if (!name) return <span style={{ color: "#cbd5e1" }}>업로더 미지정</span>;
  return (
    <span style={{ color: "#475569" }}>
      {name}{receipt.uploaderRole === "admin" && <span style={{ color: "#1a3a6b", marginLeft: 4 }}>관리자</span>}
    </span>
  );
}

/* ───────── 반응형 CSS ─────────
 * 768px 미만: 모바일 — 카드 리스트, 세로 스택 헤더, 단일 컬럼 모달
 * 768px 이상: 데스크톱 — 테이블, 가로 헤더, 2열 모달
 */
function ReceiptsResponsiveStyles() {
  return (
    <style>{`
      .receipts-page { color: #1e293b; }

      /* 헤더 */
      .receipts-header {
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }
      .receipts-card-manager-btn { width: 100%; }

      /* 합계 카드 — 모바일 2열 */
      .receipts-summary-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      /* 드롭존 — 모바일 더 작게 */
      .receipts-dropzone {
        border: 2px dashed #cbd5e1;
        border-radius: 12px;
        padding: 24px 16px;
        text-align: center;
        background: #fff;
        cursor: pointer;
        transition: background 0.15s;
      }
      .receipts-dropzone:hover { background: #f8fafc; }

      /* 데스크톱 테이블 / 모바일 카드 토글 */
      .receipts-desktop-list { display: none; }
      .receipts-mobile-list { display: flex; flex-direction: column; gap: 10px; }
      .receipts-mobile-only { display: inline; }

      /* 상세 모달 */
      .receipts-detail-modal {
        background: #fff;
        border-radius: 12px;
        width: 100%;
        max-width: 1100px;
        max-height: 95vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .receipts-detail-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: auto;
      }
      .receipts-detail-preview {
        background: #f1f5f9;
        padding: 12px;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        max-height: 40vh;
        overflow: auto;
        flex-shrink: 0;
      }
      .receipts-detail-meta {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* ─── 데스크톱 (≥768px) ─── */
      @media (min-width: 768px) {
        .receipts-header {
          flex-direction: row;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .receipts-card-manager-btn { width: auto; }
        .receipts-summary-grid {
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .receipts-dropzone { padding: 48px 24px; }
        .receipts-desktop-list { display: block; }
        .receipts-mobile-list { display: none; }
        .receipts-mobile-only { display: none; }

        .receipts-detail-body {
          flex-direction: row;
          overflow: hidden;
        }
        .receipts-detail-preview {
          flex: 1.1;
          max-height: none;
          padding: 16px;
        }
        .receipts-detail-meta {
          flex: 1;
          padding: 20px;
          gap: 18px;
          overflow: auto;
        }
      }
    `}</style>
  );
}
