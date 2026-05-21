/**
 * 관리자 사건 기록 패널 — 전자소송 스타일 PDF 업로드/메타데이터 관리.
 *
 * 한 사건(case_files)의 첨부 문서(case_documents)를 한 화면에서:
 *   1) 업로드 (PDF/이미지/한글/워드, 메타데이터 입력)
 *   2) 기존 문서 목록 조회 (제출일자/문서종류/제출자/요지)
 *   3) 메타데이터 수정 / 삭제 / 의뢰인 공개여부 토글
 *
 * - 업로드 시에는 multipart/form-data 로 파일 + 메타를 한 번에 전송한다.
 *   기존 utils/api.js 의 upload 헬퍼는 파일 단일 필드만 지원하므로
 *   여기서는 fetch 를 직접 사용해 폼 데이터를 보낸다.
 */
import { useState, useEffect, useCallback } from "react";
import { COLORS, labelStyle, fieldStyle, btnStyle, outlineBtnStyle } from "../../../components/admin";
import { showToast } from "../../../utils/showToast";
import { api } from "../../../utils/api";

/** 전자소송 호환 문서 종류 옵션 */
const DOCUMENT_TYPES = [
  "소장", "답변서", "준비서면", "보정명령", "보정서",
  "증거설명서", "갑호증", "을호증", "신청서", "결정문",
  "판결문", "공판조서", "녹취서", "감정서", "조정조서", "기타",
];

/** 제출자 옵션 */
const SUBMITTERS = ["우리측", "원고", "피고", "법원", "감정인", "기타"];

/** CSRF 쿠키 헬퍼 — utils/api.js 와 동일한 로직을 다시 사용한다. */
function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** multipart 업로드 — 메타데이터를 함께 보낸다. */
async function uploadDocument(caseFileId, file, meta) {
  const form = new FormData();
  form.append("file", file);
  for (const [key, value] of Object.entries(meta)) {
    if (value !== undefined && value !== null && value !== "") {
      form.append(key, String(value));
    }
  }
  const csrf = getCookie("csrf-token");
  const headers = {};
  if (csrf) headers["x-csrf-token"] = csrf;

  const res = await fetch(`/api/case-records/admin/cases/${caseFileId}/documents`, {
    method: "POST",
    credentials: "include",
    headers,
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || `업로드 실패 (HTTP ${res.status})`);
    err.status = res.status;
    throw err;
  }
  return json;
}

/** 파일 크기 표시 헬퍼 */
function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/** 단일 문서 행 — 메타데이터 + 액션 버튼 */
function DocumentRow({ doc, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(doc);

  const save = async () => {
    try {
      await api.patch(`/case-records/admin/documents/${doc.id}`, {
        documentType: draft.documentType || null,
        submitter: draft.submitter || null,
        submissionDate: draft.submissionDate || null,
        description: draft.description || null,
        isVisibleToClient: draft.isVisibleToClient ? 1 : 0,
      });
      setEditing(false);
      onUpdate();
    } catch (err) {
      showToast("수정 실패: " + err.message);
    }
  };

  const remove = async () => {
    if (!confirm(`"${doc.documentType || doc.originalName || doc.filename}" 을(를) 삭제할까요?`)) return;
    try {
      await api.delete(`/case-records/admin/documents/${doc.id}`);
      onRemove();
    } catch (err) {
      showToast("삭제 실패: " + err.message);
    }
  };

  return (
    <div style={{
      padding: 14, background: "#fff", border: `1px solid ${COLORS.borderLight}`,
      borderRadius: 6, marginBottom: 8,
    }}>
      {!editing ? (
        <div className="flex items-center gap-3">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <strong style={{ fontSize: 13 }}>{doc.documentType || "(미분류)"}</strong>
              {doc.submitter && (
                <span style={{ fontSize: 11, padding: "1px 8px", background: "#f0f0f0", borderRadius: 4 }}>
                  {doc.submitter}
                </span>
              )}
              {doc.submissionDate && (
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>{doc.submissionDate}</span>
              )}
              {doc.isVisibleToClient !== 1 && (
                <span style={{ fontSize: 11, padding: "1px 8px", background: "#fff3e0", color: "#e65100", borderRadius: 4 }}>
                  의뢰인 비공개
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 }}>
              {doc.originalName || doc.filename}
              {doc.fileSize && <span style={{ color: COLORS.textMuted }}> &middot; {formatBytes(doc.fileSize)}</span>}
            </div>
            {doc.description && (
              <p style={{ fontSize: 12, color: COLORS.textSecondary, margin: 0, lineHeight: 1.5 }}>
                {doc.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <a href={doc.url} target="_blank" rel="noopener noreferrer" style={outlineBtnStyle(COLORS.accent)}>
              열기
            </a>
            <button onClick={() => { setDraft(doc); setEditing(true); }} style={outlineBtnStyle()}>수정</button>
            <button onClick={remove} style={outlineBtnStyle(COLORS.danger)}>삭제</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2" style={{ marginBottom: 8 }}>
            <select
              style={fieldStyle}
              value={draft.documentType || ""}
              onChange={(e) => setDraft({ ...draft, documentType: e.target.value })}
            >
              <option value="">문서 종류</option>
              {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              style={fieldStyle}
              value={draft.submitter || ""}
              onChange={(e) => setDraft({ ...draft, submitter: e.target.value })}
            >
              <option value="">제출자</option>
              {SUBMITTERS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              type="date"
              style={fieldStyle}
              value={draft.submissionDate || ""}
              onChange={(e) => setDraft({ ...draft, submissionDate: e.target.value })}
            />
            <label className="flex items-center gap-2" style={{ fontSize: 12 }}>
              <input
                type="checkbox"
                checked={draft.isVisibleToClient === 1 || draft.isVisibleToClient === true}
                onChange={(e) => setDraft({ ...draft, isVisibleToClient: e.target.checked ? 1 : 0 })}
              />
              의뢰인에게 공개
            </label>
          </div>
          <textarea
            style={{ ...fieldStyle, minHeight: 60, marginBottom: 8 }}
            value={draft.description || ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="문서 요지/메모 (의뢰인이 우측 패널에서 확인합니다)"
          />
          <div className="flex gap-2">
            <button onClick={save} style={btnStyle(COLORS.accent)}>저장</button>
            <button onClick={() => setEditing(false)} style={btnStyle(COLORS.muted)}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CaseRecordsPanel({ caseFileId }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  /** 업로드 폼 상태 */
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({
    documentType: "", submitter: "우리측",
    submissionDate: new Date().toISOString().slice(0, 10),
    description: "", isVisibleToClient: 1,
  });

  const load = useCallback(async () => {
    if (!caseFileId) return;
    setLoading(true);
    try {
      const res = await api.get(`/case-records/admin/cases/${caseFileId}/documents`);
      setDocs(res.data ?? []);
    } catch (err) {
      showToast("문서 목록 조회 실패: " + err.message);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [caseFileId]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async () => {
    if (!file) {
      showToast("파일을 선택해주세요");
      return;
    }
    setUploading(true);
    try {
      await uploadDocument(caseFileId, file, meta);
      // 성공 시 폼 초기화
      setFile(null);
      const fileInput = document.getElementById(`case-record-file-${caseFileId}`);
      if (fileInput) fileInput.value = "";
      setMeta({
        documentType: "", submitter: "우리측",
        submissionDate: new Date().toISOString().slice(0, 10),
        description: "", isVisibleToClient: 1,
      });
      load();
    } catch (err) {
      showToast("업로드 실패: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* ── 업로드 폼 ── */}
      <div style={{
        padding: 16, background: "#fff", border: `1px dashed ${COLORS.border}`,
        borderRadius: 6, marginBottom: 16,
      }}>
        <label style={{ ...labelStyle, marginBottom: 8 }}>새 사건 기록 등록</label>
        <input
          id={`case-record-file-${caseFileId}`}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.hwp,.hwpx,.docx,.doc,.xlsx,.xls,.zip"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ marginBottom: 10, fontSize: 13 }}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2" style={{ marginBottom: 8 }}>
          <select
            style={fieldStyle}
            value={meta.documentType}
            onChange={(e) => setMeta({ ...meta, documentType: e.target.value })}
          >
            <option value="">문서 종류 선택</option>
            {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            style={fieldStyle}
            value={meta.submitter}
            onChange={(e) => setMeta({ ...meta, submitter: e.target.value })}
          >
            {SUBMITTERS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            type="date"
            style={fieldStyle}
            value={meta.submissionDate}
            onChange={(e) => setMeta({ ...meta, submissionDate: e.target.value })}
          />
        </div>
        <textarea
          style={{ ...fieldStyle, minHeight: 56, marginBottom: 8 }}
          placeholder="문서 요지/메모 (의뢰인 우측 패널에 표시됩니다)"
          value={meta.description}
          onChange={(e) => setMeta({ ...meta, description: e.target.value })}
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2" style={{ fontSize: 12, color: COLORS.textSecondary }}>
            <input
              type="checkbox"
              checked={meta.isVisibleToClient === 1}
              onChange={(e) => setMeta({ ...meta, isVisibleToClient: e.target.checked ? 1 : 0 })}
            />
            의뢰인에게 공개
          </label>
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            style={{ ...btnStyle(COLORS.accent), opacity: uploading || !file ? 0.5 : 1 }}
          >
            {uploading ? "업로드 중..." : "+ 사건 기록 등록"}
          </button>
        </div>
      </div>

      {/* ── 문서 목록 ── */}
      {loading ? (
        <p style={{ fontSize: 13, color: COLORS.textMuted }}>로딩 중...</p>
      ) : docs.length === 0 ? (
        <p style={{ fontSize: 13, color: COLORS.textMuted, textAlign: "center", padding: 20 }}>
          등록된 사건 기록이 없습니다
        </p>
      ) : (
        <div>
          {docs.map((d) => (
            <DocumentRow key={d.id} doc={d} onUpdate={load} onRemove={load} />
          ))}
        </div>
      )}
    </div>
  );
}
