/**
 * 계약서 양식(템플릿) 관리 — 관리자 페이지
 * - 목록 / 추가 / 편집 / 삭제
 * - "이 양식으로 발행" → 의뢰인 맞춤 계약서 인스턴스 생성
 * - HWP/PDF 원본 파일 첨부 및 다운로드
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../utils/api";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";


const CATEGORIES = [
  { value: "engagement", label: "위임계약서" },
  { value: "settlement", label: "합의서" },
  { value: "nda", label: "비밀유지" },
  { value: "consent", label: "동의서" },
  { value: "custom", label: "기타" },
];

export default function AdminContractTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [issueOpen, setIssueOpen] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const hwpInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const uploadTargetRef = useRef(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/contract-templates");
      setTemplates(res.data || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!confirm("이 양식을 삭제할까요?")) return;
    await api.delete(`/contract-templates/${id}`);
    load();
  }

  async function handleEdit(t) {
    // 목록에는 content_json이 빠져있으므로 상세를 다시 가져온다
    try {
      const res = await api.get(`/contract-templates/${t.id}`);
      setEditing(res.data || t);
    } catch {
      setEditing(t);
    }
    setEditorOpen(true);
  }

  function handleNew() {
    setEditing(null);
    setEditorOpen(true);
  }

  async function handleIssue(templateId, payload) {
    const res = await api.post(`/contract-templates/${templateId}/clone-for-client`, payload);
    setIssueOpen(null);
    navigate(`/admin/contracts/${res.data.contract.id}`);
  }

  function triggerFileUpload(templateId, type) {
    uploadTargetRef.current = { id: templateId, type };
    if (type === "hwp") hwpInputRef.current?.click();
    else pdfInputRef.current?.click();
  }

  async function handleFileSelected(e, type) {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetRef.current) return;
    const { id } = uploadTargetRef.current;
    const formData = new FormData();
    formData.append("file", file);
    setUploadingId(`${id}-${type}`);
    try {
      await api.upload(`/contract-templates/${id}/upload-file`, formData);
      await load();
    } catch (err) {
      alert(err.message || "파일 업로드 실패");
    } finally {
      setUploadingId(null);
      e.target.value = "";
      uploadTargetRef.current = null;
    }
  }

  async function handleFileDelete(templateId, type) {
    if (!confirm(`이 ${type.toUpperCase()} 파일을 삭제할까요?`)) return;
    await api.delete(`/contract-templates/${templateId}/file/${type}`);
    load();
  }

  return (
    <div className="p-6">
      {/* 숨김 파일 입력 — triggerFileUpload()로 프로그래밍적으로 클릭 */}
      <input ref={hwpInputRef} type="file" accept=".hwp,.hwpx,.doc,.docx" className="hidden" onChange={(e) => handleFileSelected(e, "hwp")} />
      <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileSelected(e, "pdf")} />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">계약서 양식 관리</h1>
          <p className="text-sm text-gray-500">위임계약서, 합의서, NDA 등 양식을 만들고 관리합니다.</p>
        </div>
        <Button onClick={handleNew}>새 양식 만들기</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">제목</th>
              <th className="px-4 py-3 text-left">분류</th>
              <th className="px-4 py-3 text-left">설명</th>
              <th className="px-4 py-3 text-left">기본</th>
              <th className="px-4 py-3 text-left">원본 파일</th>
              <th className="px-4 py-3 text-left">수정일</th>
              <th className="px-4 py-3 text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">불러오는 중...</td></tr>
            )}
            {!loading && templates.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                양식이 없습니다. 새 양식을 만들어보세요.
              </td></tr>
            )}
            {templates.map((t) => (
              <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.title}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{labelOf(t.category)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{t.description || "-"}</td>
                <td className="px-4 py-3 text-xs">{t.is_default ? <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">기본</span> : "-"}</td>
                <td className="px-4 py-3">
                  <TemplateFileBadges
                    template={t}
                    uploading={uploadingId}
                    onUpload={(type) => triggerFileUpload(t.id, type)}
                    onDelete={(type) => handleFileDelete(t.id, type)}
                  />
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{fmt(t.updated_at)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIssueOpen(t)} className="text-xs text-[#2e588a] hover:underline">발행</button>
                    <button onClick={() => handleEdit(t)} className="text-xs text-blue-600 hover:underline">편집</button>
                    <button onClick={() => handleDelete(t.id)} className="text-xs text-red-600 hover:underline">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editorOpen && (
        <TemplateEditor
          initial={editing}
          onClose={() => setEditorOpen(false)}
          onSaved={() => { setEditorOpen(false); load(); }}
        />
      )}

      {issueOpen && (
        <IssueDialog
          template={issueOpen}
          onClose={() => setIssueOpen(null)}
          onIssue={(payload) => handleIssue(issueOpen.id, payload)}
        />
      )}
    </div>
  );
}

/**
 * 템플릿 행의 HWP/PDF 파일 배지 — 다운로드 링크 + 업로드/삭제 버튼
 */
function TemplateFileBadges({ template, uploading, onUpload, onDelete }) {
  const isUploadingHwp = uploading === `${template.id}-hwp`;
  const isUploadingPdf = uploading === `${template.id}-pdf`;

  return (
    <div className="flex flex-col gap-1 text-xs">
      {/* HWP */}
      <div className="flex items-center gap-1">
        {template.file_url_hwp ? (
          <>
            <a
              href={template.file_url_hwp}
              download
              className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-emerald-800 hover:bg-emerald-100"
              title="HWP 다운로드"
            >
              HWP ↓
            </a>
            <button onClick={() => onDelete("hwp")} className="text-[10px] text-red-400 hover:text-red-700" title="HWP 파일 삭제">✕</button>
          </>
        ) : (
          <button
            onClick={() => onUpload("hwp")}
            disabled={isUploadingHwp}
            className="rounded border border-dashed border-gray-300 px-1.5 py-0.5 text-gray-400 hover:border-gray-500 hover:text-gray-600 disabled:opacity-50"
            title="HWP 파일 업로드"
          >
            {isUploadingHwp ? "업로드 중..." : "HWP +"}
          </button>
        )}
      </div>
      {/* PDF */}
      <div className="flex items-center gap-1">
        {template.file_url_pdf ? (
          <>
            <a
              href={template.file_url_pdf}
              download
              className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-red-800 hover:bg-red-100"
              title="PDF 다운로드"
            >
              PDF ↓
            </a>
            <button onClick={() => onDelete("pdf")} className="text-[10px] text-red-400 hover:text-red-700" title="PDF 파일 삭제">✕</button>
          </>
        ) : (
          <button
            onClick={() => onUpload("pdf")}
            disabled={isUploadingPdf}
            className="rounded border border-dashed border-gray-300 px-1.5 py-0.5 text-gray-400 hover:border-gray-500 hover:text-gray-600 disabled:opacity-50"
            title="PDF 파일 업로드"
          >
            {isUploadingPdf ? "업로드 중..." : "PDF +"}
          </button>
        )}
      </div>
    </div>
  );
}

function labelOf(cat) {
  return CATEGORIES.find(c => c.value === cat)?.label || cat;
}

function fmt(s) {
  if (!s) return "-";
  try {
    const d = new Date(s + (s.includes("Z") ? "" : "Z"));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch { return s; }
}

/**
 * 템플릿 편집기 — 본문/미리보기/변수 탭으로 구성
 * - 본문: 일반 텍스트 + {{var:key}}, {{sign:역할}} placeholder 직접 편집
 * - 미리보기: 변수는 노란색 칩, 서명자리는 파란색 칩으로 강조 표시
 * - 변수: variables_schema 추가/수정/삭제
 */
function TemplateEditor({ initial, onClose, onSaved }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [category, setCategory] = useState(initial?.category || "engagement");
  const [body, setBody] = useState(() => {
    if (!initial?.content_json) return "";
    try {
      const json = JSON.parse(initial.content_json);
      return extractPlainText(json);
    } catch { return ""; }
  });
  const [variables, setVariables] = useState(() => parseVariablesSchema(initial?.variables_schema));
  const [isDefault, setIsDefault] = useState(!!initial?.is_default);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("body"); // body | preview | vars

  async function handleSave() {
    setError(null);
    if (!title.trim()) { setError("제목이 필요합니다"); return; }
    setSaving(true);
    try {
      const contentJson = buildTipTapJson(body);
      const contentHtml = buildHtml(body);
      const payload = {
        title, description, category, contentJson, contentHtml, isDefault,
        variablesSchema: variables,
      };
      if (initial) {
        await api.patch(`/contract-templates/${initial.id}`, payload);
      } else {
        await api.post("/contract-templates", payload);
      }
      onSaved?.();
    } catch (e) {
      setError(e.message);
    } finally { setSaving(false); }
  }

  // 본문에서 사용 중인 변수 키 추출 (스키마 누락/미사용 감지)
  const usedVarKeys = extractUsedVarKeys(body);
  const definedKeys = new Set(variables.map(v => v.key));
  const undefinedVars = usedVarKeys.filter(k => !definedKeys.has(k));
  const unusedVars = variables.filter(v => !usedVarKeys.includes(v.key));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex h-[92vh] w-full max-w-6xl flex-col rounded-xl bg-white shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold">{initial ? "양식 편집" : "새 양식 만들기"}</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              <code className="rounded bg-yellow-100 px-1 text-yellow-900">{"{{var:키}}"}</code> 발행 시 치환 ·{" "}
              <code className="rounded bg-blue-100 px-1 text-blue-900">{"{{sign:역할}}"}</code> 서명 자리
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">✕</button>
        </div>

        {/* 메타 입력 */}
        <div className="grid grid-cols-1 gap-3 border-b border-gray-100 px-5 py-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-gray-600">제목</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="위임계약서 (민사)" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">분류</label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </div>
          <div className="sm:col-span-3">
            <label className="mb-1 block text-xs text-gray-600">설명</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="이 양식의 용도 설명" />
          </div>
        </div>

        {/* 탭 */}
        <div className="flex items-center gap-1 border-b border-gray-100 px-5 pt-2">
          <TabButton active={tab === "body"} onClick={() => setTab("body")}>
            본문 편집
          </TabButton>
          <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
            미리보기
          </TabButton>
          <TabButton active={tab === "vars"} onClick={() => setTab("vars")}>
            변수 정의 <span className="ml-1 rounded bg-gray-100 px-1.5 text-[11px] text-gray-700">{variables.length}</span>
          </TabButton>
          {(undefinedVars.length > 0 || unusedVars.length > 0) && (
            <div className="ml-auto flex items-center gap-2 text-[11px]">
              {undefinedVars.length > 0 && (
                <span className="rounded bg-red-50 px-2 py-0.5 text-red-700" title={undefinedVars.join(", ")}>
                  ⚠ 본문에 정의되지 않은 변수 {undefinedVars.length}개
                </span>
              )}
              {unusedVars.length > 0 && (
                <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-700" title={unusedVars.map(v=>v.key).join(", ")}>
                  ℹ 본문에 사용되지 않는 변수 {unusedVars.length}개
                </span>
              )}
            </div>
          )}
        </div>

        {/* 본문 영역 */}
        <div className="flex-1 overflow-hidden px-5 py-3">
          {tab === "body" && (
            <BodyEditor body={body} onChange={setBody} />
          )}
          {tab === "preview" && (
            <PreviewPane body={body} variables={variables} />
          )}
          {tab === "vars" && (
            <VariablesEditor
              variables={variables}
              onChange={setVariables}
              usedKeys={usedVarKeys}
              onInsert={(key) => setBody((prev) => prev + (prev.endsWith("\n") || !prev ? "" : "\n") + `{{var:${key}}}`)}
            />
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-5 py-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            기본 양식으로 설정
          </label>
          <div className="flex items-center gap-2">
            {error && <div className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">{error}</div>}
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "저장"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-t-md border-b-2 px-3 py-2 text-sm transition ${
        active
          ? "border-[#2e588a] font-semibold text-[#2e588a]"
          : "border-transparent text-gray-500 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

/** 본문 편집기 — placeholder 삽입 버튼 + 큰 textarea */
function BodyEditor({ body, onChange }) {
  const taRef = useRef(null);
  function insertAtCursor(text) {
    const ta = taRef.current;
    if (!ta) { onChange((body || "") + text); return; }
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? body.length;
    const next = body.slice(0, start) + text + body.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-gray-500">자주 쓰는 placeholder:</span>
        {[
          ["{{var:client.name}}", "의뢰인 이름"],
          ["{{var:client.phone}}", "전화"],
          ["{{var:client.address}}", "주소"],
          ["{{var:fee.retainerAmount}}", "착수보수"],
          ["{{var:contractDate}}", "계약일"],
          ["{{sign:의뢰인}}", "의뢰인 서명"],
          ["{{sign:변호사}}", "변호사 서명"],
        ].map(([token, label]) => (
          <button
            key={token}
            type="button"
            onClick={() => insertAtCursor(token)}
            className={`rounded border px-2 py-0.5 transition hover:opacity-80 ${
              token.startsWith("{{var:")
                ? "border-yellow-200 bg-yellow-50 text-yellow-900"
                : "border-blue-200 bg-blue-50 text-blue-900"
            }`}
            title={`삽입: ${token}`}
          >
            {label}
          </button>
        ))}
      </div>
      <textarea
        ref={taRef}
        value={body}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"위 임 계 약 서\n\n위임인: {{var:client.name}}\n주소: {{var:client.address}}\n\n... 본문 ...\n\n{{var:contractDate}}\n\n의뢰인 서명: {{sign:의뢰인}}\n변호사 서명: {{sign:변호사}}"}
        className="w-full flex-1 resize-none rounded-md border border-[var(--border-color)] bg-transparent px-3 py-2 font-mono text-sm leading-6 transition-colors placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]"
        style={{ minHeight: "40vh" }}
      />
    </div>
  );
}

/** 미리보기 — 변수/서명 placeholder를 색상 칩으로 강조 */
function PreviewPane({ body, variables }) {
  const labelMap = new Map(variables.map(v => [v.key, v.label]));
  const lines = (body || "").split(/\n/);
  return (
    <div className="h-full overflow-y-auto rounded border border-gray-200 bg-[#fefcf8] p-6">
      <div className="mx-auto max-w-3xl whitespace-pre-wrap break-words text-[14px] leading-7 text-gray-800" style={{ fontFamily: '"Malgun Gothic", "맑은 고딕", serif' }}>
        {lines.map((line, idx) => (
          <div key={idx} className={line.trim() ? "" : "h-4"}>
            {renderLineWithChips(line, labelMap)}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderLineWithChips(line, labelMap) {
  if (!line) return null;
  const regex = /\{\{(var|sign):([^}]+)\}\}/g;
  const out = [];
  let last = 0;
  let m;
  let i = 0;
  while ((m = regex.exec(line))) {
    if (m.index > last) out.push(<span key={`t${i++}`}>{line.slice(last, m.index)}</span>);
    const [token, kind, key] = m;
    if (kind === "var") {
      const label = labelMap.get(key) || key;
      out.push(
        <span key={`v${i++}`} className="mx-0.5 inline-block rounded border border-yellow-300 bg-yellow-50 px-1.5 text-[12px] font-medium text-yellow-900" title={`변수: ${key}`}>
          {label}
        </span>
      );
    } else {
      out.push(
        <span key={`s${i++}`} className="mx-0.5 inline-block rounded border border-blue-300 bg-blue-50 px-2 py-0.5 text-[12px] font-medium text-blue-900" title={`서명자리: ${key}`}>
          ✍ {key} 서명
        </span>
      );
    }
    last = m.index + token.length;
  }
  if (last < line.length) out.push(<span key={`t${i++}`}>{line.slice(last)}</span>);
  return out;
}

/** 변수 스키마 편집기 */
function VariablesEditor({ variables, onChange, usedKeys, onInsert }) {
  function update(idx, patch) {
    const next = variables.map((v, i) => i === idx ? { ...v, ...patch } : v);
    onChange(next);
  }
  function remove(idx) {
    if (!confirm("이 변수를 삭제할까요? (본문에서 해당 placeholder는 그대로 남으니 직접 정리하세요)")) return;
    onChange(variables.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([
      ...variables,
      { group: "기타", key: `field${variables.length + 1}`, label: "새 항목", type: "text", required: false, placeholder: "" },
    ]);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-600">
        <span>발행 시 폼으로 입력받을 변수 목록입니다. <code>{"{{var:키}}"}</code>로 본문에서 참조하세요.</span>
        <Button size="sm" onClick={add}>+ 변수 추가</Button>
      </div>
      <div className="flex-1 overflow-y-auto rounded border border-gray-200">
        {variables.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-gray-400">정의된 변수가 없습니다.</div>
        )}
        <table className="min-w-full text-sm">
          {variables.length > 0 && (
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-2 py-2 text-left">그룹</th>
                <th className="px-2 py-2 text-left">키 (key)</th>
                <th className="px-2 py-2 text-left">라벨</th>
                <th className="px-2 py-2 text-left">타입</th>
                <th className="px-2 py-2 text-left">placeholder</th>
                <th className="px-2 py-2 text-center">필수</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
          )}
          <tbody>
            {variables.map((v, idx) => {
              const used = usedKeys.includes(v.key);
              return (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="px-2 py-1"><Input value={v.group || ""} onChange={(e) => update(idx, { group: e.target.value })} /></td>
                  <td className="px-2 py-1">
                    <div className="flex items-center gap-1">
                      <Input value={v.key} onChange={(e) => update(idx, { key: e.target.value })} className="font-mono text-xs" />
                      {!used && (
                        <button type="button" onClick={() => onInsert(v.key)}
                          className="whitespace-nowrap rounded border border-yellow-200 bg-yellow-50 px-1.5 py-1 text-[10px] text-yellow-900 hover:bg-yellow-100"
                          title="본문에 삽입">
                          본문에 삽입
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1"><Input value={v.label || ""} onChange={(e) => update(idx, { label: e.target.value })} /></td>
                  <td className="px-2 py-1">
                    <Select value={v.type || "text"} onChange={(e) => update(idx, { type: e.target.value })}>
                      <option value="text">text</option>
                      <option value="longText">longText</option>
                      <option value="number">number</option>
                      <option value="date">date</option>
                      <option value="email">email</option>
                      <option value="tel">tel</option>
                    </Select>
                  </td>
                  <td className="px-2 py-1"><Input value={v.placeholder || ""} onChange={(e) => update(idx, { placeholder: e.target.value })} /></td>
                  <td className="px-2 py-1 text-center">
                    <input type="checkbox" checked={!!v.required} onChange={(e) => update(idx, { required: e.target.checked })} />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <button onClick={() => remove(idx)} className="text-xs text-red-600 hover:underline">삭제</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function extractUsedVarKeys(body) {
  const set = new Set();
  const regex = /\{\{var:([^}]+)\}\}/g;
  let m;
  while ((m = regex.exec(body || ""))) set.add(m[1]);
  return Array.from(set);
}

function IssueDialog({ template, onClose, onIssue }) {
  const schema = parseVariablesSchema(template.variables_schema);
  const [title, setTitle] = useState(template.title);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [vars, setVars] = useState(() => initialVars(schema));
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState(null);

  // 변수에서 의뢰인 정보 자동 추출 (수동 입력이 비어있을 때)
  function effectiveClientName() { return clientName || vars["client.name"] || ""; }
  function effectiveClientPhone() { return clientPhone || vars["client.phone"] || ""; }
  function effectiveClientEmail() { return clientEmail || vars["client.email"] || ""; }

  function setVar(key, val) {
    setVars((prev) => ({ ...prev, [key]: val }));
  }

  async function submit() {
    setError(null);
    // 필수 변수 검증
    const missing = schema.filter((d) => d.required && !String(vars[d.key] ?? "").trim());
    if (missing.length) {
      setError(`필수 항목이 비어있습니다: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    setIssuing(true);
    try {
      await onIssue({
        title,
        partyName: effectiveClientName(),
        partyPhone: effectiveClientPhone(),
        partyEmail: effectiveClientEmail(),
        variables: vars,
      });
    } catch (e) {
      setError(e.message);
    } finally { setIssuing(false); }
  }

  // 변수 그룹화
  const groups = groupSchema(schema);
  const hasVars = schema.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold">계약서 발행</h3>
            <p className="mt-0.5 text-xs text-gray-500">{template.title}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">✕</button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className="mb-1 block text-xs text-gray-600">계약서 제목</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {hasVars ? (
            <div className="space-y-4">
              {groups.map((g) => (
                <fieldset key={g.name} className="rounded-lg border border-gray-200 p-3">
                  <legend className="px-1 text-xs font-semibold text-gray-700">{g.name}</legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {g.items.map((def) => (
                      <VariableField key={def.key} def={def} value={vars[def.key] ?? ""} onChange={(v) => setVar(def.key, v)} />
                    ))}
                  </div>
                </fieldset>
              ))}
              <p className="text-[11px] text-gray-500">
                * 의뢰인 정보(성명/전화/이메일)는 위 변수에서 자동 추출되어 서명 발송에 사용됩니다.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-xs text-gray-600">의뢰인 이름</label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="홍길동" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">의뢰인 휴대폰</label>
                <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="010-1234-5678" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">의뢰인 이메일 (선택)</label>
                <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              </div>
            </>
          )}

          {error && <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</div>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={submit} disabled={issuing}>{issuing ? "생성 중..." : "발행 → 편집"}</Button>
        </div>
      </div>
    </div>
  );
}

function parseVariablesSchema(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; }
}

function initialVars(schema) {
  const o = {};
  for (const d of schema) o[d.key] = "";
  return o;
}

function groupSchema(schema) {
  const map = new Map();
  for (const def of schema) {
    const g = def.group || "기타";
    if (!map.has(g)) map.set(g, { name: g, items: [] });
    map.get(g).items.push(def);
  }
  return Array.from(map.values());
}

function VariableField({ def, value, onChange }) {
  const labelEl = (
    <label className="mb-1 block text-xs text-gray-600">
      {def.label}{def.required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
  const colSpan = def.type === "longText" ? "sm:col-span-2" : "";
  if (def.type === "longText") {
    return (
      <div className={colSpan}>
        {labelEl}
        <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder || ""} />
      </div>
    );
  }
  if (def.type === "number") {
    return (
      <div className={colSpan}>
        {labelEl}
        <Input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
          placeholder={def.placeholder || ""}
        />
        {value && <p className="mt-1 text-[11px] text-gray-500">{Number(value).toLocaleString("ko-KR")} 원</p>}
      </div>
    );
  }
  if (def.type === "date") {
    return (
      <div className={colSpan}>
        {labelEl}
        <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  return (
    <div className={colSpan}>
      {labelEl}
      <Input type={def.type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder || ""} />
    </div>
  );
}

/** 본문 plain text에서 TipTap JSON 생성 (단순: paragraph만) */
function buildTipTapJson(text) {
  const lines = (text || "").split(/\n/);
  const content = lines.map((line) => {
    if (!line.trim()) return { type: "paragraph" };
    const parts = splitBySignature(line);
    const children = parts.map((p) => {
      if (p.type === "sig") {
        return {
          type: "signatureField",
          attrs: {
            fieldKey: `sig-${p.role}-${Math.random().toString(36).slice(2, 8)}`,
            role: mapRole(p.role),
            label: p.role,
            required: true,
          },
        };
      }
      return { type: "text", text: p.text };
    });
    return { type: "paragraph", content: children.filter(Boolean) };
  });
  return { type: "doc", content };
}

function buildHtml(text) {
  const escape = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = (text || "").split(/\n/);
  return lines.map((line) => {
    if (!line.trim()) return "<p></p>";
    const parts = splitBySignature(line);
    const inner = parts.map((p) => p.type === "sig"
      ? `<signature-field data-role="${mapRole(p.role)}" data-label="${escape(p.role)}" data-required="1">${escape(p.role)}</signature-field>`
      : escape(p.text)).join("");
    return `<p>${inner}</p>`;
  }).join("\n");
}

function splitBySignature(line) {
  const parts = [];
  const regex = /\{\{sign:([^}]+)\}\}/g;
  let last = 0;
  let m;
  while ((m = regex.exec(line))) {
    if (m.index > last) parts.push({ type: "text", text: line.slice(last, m.index) });
    parts.push({ type: "sig", role: m[1] });
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push({ type: "text", text: line.slice(last) });
  return parts.filter(p => p.type === "sig" || (p.text && p.text.length));
}

function mapRole(label) {
  const s = String(label || "").toLowerCase();
  if (s.includes("의뢰") || s === "our_client") return "our_client";
  if (s.includes("변호") || s === "lawyer") return "lawyer";
  if (s.includes("대리") || s === "counterparty_rep") return "counterparty_rep";
  if (s.includes("상대") || s === "counterparty") return "counterparty";
  if (s.includes("증인") || s === "witness") return "witness";
  return "our_client";
}

function extractPlainText(json) {
  if (!json) return "";
  const lines = [];
  (json.content || []).forEach((node) => {
    if (node.type !== "paragraph") return;
    let line = "";
    (node.content || []).forEach((child) => {
      if (child.type === "text") line += child.text || "";
      else if (child.type === "signatureField") line += `{{sign:${child.attrs?.label || child.attrs?.role || "서명"}}}`;
    });
    lines.push(line);
  });
  return lines.join("\n");
}
