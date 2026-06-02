/**
 * 의뢰인 포털 — 사건 기록(전자소송 스타일) 뷰어 페이지.
 *
 * 좌측: 제출일자별 문서 목록 (제출일·문서종류·제출자)
 * 우측: 선택한 문서의 PDF/이미지 미리보기 + 별도 탭으로 "기록 내용"(요지/메모)
 *
 * 핵심 차별점 — PortalCaseDetail 의 "서류" 탭과 달리 이 페이지는 본격 두 패널
 * 레이아웃이고, 의뢰인이 자기 사건의 제출 기록 흐름을 한 번에 파악하도록 설계했다.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { T } from "./portalStyles";
import { STATUS_MAP } from "./portalConstants";

/**
 * 사건 기록 API 는 /api/case-records 네임스페이스에 있어서
 * portalApi (/api/portal/* 베이스) 를 쓸 수 없다. 별도 fetch 헬퍼.
 */
async function fetchCaseRecords(caseId) {
  const res = await fetch(`/api/case-records/portal/cases/${caseId}/documents`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `사건 기록 조회 실패 (HTTP ${res.status})`);
  }
  return json.data || { caseFile: null, documents: [] };
}

/** 우측 패널 탭 — PDF 본문 vs. 텍스트 요지 */
const RIGHT_TABS = [
  { key: "viewer", label: "본문 보기" },
  { key: "summary", label: "기록 내용" },
];

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/** 사건 헤더 — 사건번호/원고/피고/재판부 등 전자소송 메타 */
function CaseHeader({ caseFile }) {
  const status = STATUS_MAP[caseFile.status] || STATUS_MAP["접수"];
  const metaRows = [
    { label: "사건번호", value: caseFile.caseNumber, mono: true },
    { label: "재판부", value: caseFile.court },
    { label: "사건유형", value: caseFile.caseType },
    { label: "원고", value: caseFile.plaintiff },
    { label: "피고", value: caseFile.defendant },
    { label: "제소일", value: caseFile.filedAt },
  ];

  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: 24, marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: T.text, margin: 0, fontFamily: "'Noto Serif KR', serif" }}>
          {caseFile.title}
        </h1>
        <span style={{
          fontSize: 11, padding: "3px 10px", borderRadius: 10,
          background: status.bg, color: status.color, fontWeight: 500,
        }}>
          {caseFile.status}
        </span>
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: "10px 20px",
      }}>
        {metaRows.map((row) => (
          <div key={row.label}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>{row.label}</div>
            <div style={{
              fontSize: 13, color: T.text,
              fontFamily: row.mono ? "monospace" : "inherit",
            }}>
              {row.value || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 좌측 문서 목록 — 제출일자 내림차순 그룹 */
function DocumentList({ documents, selectedId, onSelect }) {
  // 제출일자 기준으로 그룹화 (없으면 createdAt 의 날짜 부분 사용)
  const grouped = useMemo(() => {
    const map = new Map();
    for (const d of documents) {
      const key = d.submissionDate || (d.createdAt ? d.createdAt.slice(0, 10) : "날짜 미상");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(d);
    }
    return Array.from(map.entries()); // [[date, docs[]], ...] 이미 서버에서 정렬되어 있음
  }, [documents]);

  if (documents.length === 0) {
    return (
      <div style={{ padding: 30, textAlign: "center", color: T.textMuted, fontSize: 13 }}>
        아직 등록된 사건 기록이 없습니다
      </div>
    );
  }

  return (
    <div style={{ overflow: "auto" }}>
      {grouped.map(([date, docs]) => (
        <div key={date} style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: T.textMuted,
            padding: "6px 14px", background: "var(--bg-secondary, #f8f8f6)",
            borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`,
          }}>
            {date}
          </div>
          {docs.map((doc) => {
            const isSelected = doc.id === selectedId;
            return (
              <button
                key={doc.id}
                onClick={() => onSelect(doc)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "12px 14px", background: isSelected ? "rgba(59,110,165,0.08)" : "#fff",
                  border: "none", borderBottom: `1px solid ${T.border}`,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <div style={{
                  fontSize: 13, fontWeight: isSelected ? 600 : 500,
                  color: isSelected ? T.accent : T.text, marginBottom: 4,
                }}>
                  {doc.documentType || "(미분류)"}
                </div>
                <div style={{ fontSize: 11, color: T.textMuted, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {doc.submitter && <span>{doc.submitter}</span>}
                  {doc.originalName && <span style={{ color: T.textMuted }}>· {doc.originalName}</span>}
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** 우측 문서 본문 뷰어 — PDF/이미지 미리보기 + 메타 + 요지 탭 */
function DocumentDetail({ doc }) {
  const [tab, setTab] = useState("viewer");

  if (!doc) {
    return (
      <div style={{
        height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        color: T.textMuted, fontSize: 13, padding: 40, textAlign: "center",
      }}>
        좌측에서 문서를 선택하시면 본문을 확인하실 수 있습니다
      </div>
    );
  }

  const isPdf = (doc.mimeType || "").includes("pdf") || /\.pdf$/i.test(doc.url || "");
  const isImage = (doc.mimeType || "").startsWith("image/") || /\.(png|jpg|jpeg|gif|webp)$/i.test(doc.url || "");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* 메타 헤더 */}
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>
          {doc.documentType || "(미분류)"}
        </div>
        <div style={{ fontSize: 12, color: T.textSec, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {doc.submissionDate && <span>제출일: {doc.submissionDate}</span>}
          {doc.submitter && <span>· 제출자: {doc.submitter}</span>}
          {doc.originalName && <span>· {doc.originalName}</span>}
          {doc.fileSize && <span>· {formatBytes(doc.fileSize)}</span>}
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, paddingLeft: 12 }}>
        {RIGHT_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 18px", fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? T.accent : T.textSec,
              background: "transparent", border: "none",
              borderBottom: tab === t.key ? `2px solid ${T.accent}` : "2px solid transparent",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", padding: 8 }}>
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "6px 14px", fontSize: 12, fontWeight: 500,
              color: T.accent, border: `1px solid ${T.accent}`,
              borderRadius: 4, textDecoration: "none",
            }}
          >
            새 창 열기
          </a>
        </div>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, overflow: "auto", background: "#f4f4f0" }}>
        {tab === "viewer" ? (
          isPdf ? (
            <iframe
              key={doc.url}
              src={doc.url}
              title={doc.originalName || doc.documentType || "사건 기록"}
              style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
            />
          ) : isImage ? (
            <div style={{ padding: 20, textAlign: "center" }}>
              <img
                src={doc.url}
                alt={doc.documentType || "사건 기록"}
                style={{ maxWidth: "100%", border: `1px solid ${T.border}`, background: "#fff" }}
              />
            </div>
          ) : (
            <div style={{
              padding: 40, textAlign: "center", color: T.textMuted, fontSize: 13,
            }}>
              <p style={{ marginBottom: 12 }}>이 형식의 파일은 브라우저에서 직접 표시할 수 없습니다.</p>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "8px 18px", fontSize: 13, fontWeight: 500,
                  color: "#fff", background: T.accent, borderRadius: 4,
                  textDecoration: "none", display: "inline-block",
                }}
              >
                다운로드
              </a>
            </div>
          )
        ) : (
          <div style={{ padding: 24, background: "#fff", height: "100%" }}>
            {doc.description ? (
              <p style={{ fontSize: 13, color: T.text, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>
                {doc.description}
              </p>
            ) : (
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
                담당 변호사가 등록한 별도 요지/메모가 없습니다.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PortalCaseRecords() {
  const { id } = useParams();
  const [caseFile, setCaseFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCaseRecords(id);
      setCaseFile(data.caseFile || null);
      setDocuments(data.documents || []);
      setSelectedId((data.documents || [])[0]?.id || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const selected = useMemo(
    () => documents.find((d) => d.id === selectedId) || null,
    [documents, selectedId]
  );

  if (loading) {
    return <p style={{ color: T.textMuted, fontSize: 14, padding: 40, textAlign: "center" }}>로딩 중...</p>;
  }

  if (error || !caseFile) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <p style={{ fontSize: 15, color: T.textSec, marginBottom: 16 }}>
          {error || "사건 정보를 불러올 수 없습니다"}
        </p>
        <Link to="/portal" style={{ fontSize: 13, color: T.accent, textDecoration: "none" }}>
          ← 대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to={`/portal/cases/${id}`} style={{ fontSize: 13, color: T.textMuted, textDecoration: "none", display: "inline-block", marginBottom: 16 }}>
        ← 사건 상세로
      </Link>

      <CaseHeader caseFile={caseFile} />

      {/* 두 패널 레이아웃 */}
      <div style={{
        display: "grid", gridTemplateColumns: "minmax(260px, 320px) 1fr",
        gap: 0, height: 640,
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
        overflow: "hidden",
      }}>
        {/* 좌측 */}
        <div style={{
          borderRight: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{
            padding: "12px 14px", borderBottom: `1px solid ${T.border}`,
            fontSize: 12, fontWeight: 600, color: T.textSec,
          }}>
            제출 기록 ({documents.length}건)
          </div>
          <DocumentList
            documents={documents}
            selectedId={selectedId}
            onSelect={(d) => setSelectedId(d.id)}
          />
        </div>

        {/* 우측 */}
        <div style={{ overflow: "hidden" }}>
          <DocumentDetail doc={selected} />
        </div>
      </div>
    </div>
  );
}
