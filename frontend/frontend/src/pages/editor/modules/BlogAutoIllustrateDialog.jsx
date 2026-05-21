/**
 * BlogAutoIllustrateDialog — 본문 자동 일러스트레이션 워크플로우 다이얼로그
 *
 * 1) Claude 가 본문을 읽고 N개의 DALL-E 프롬프트를 제안 (POST /api/media/suggest-prompts)
 * 2) 운영자가 각 프롬프트를 자유롭게 수정·삭제·추가
 * 3) "이미지 생성 및 본문 삽입" 클릭 시 각 프롬프트마다 DALL-E 호출
 * 4) 생성된 이미지를 TipTap 에디터의 본문 끝에 순서대로 삽입
 *
 * 본문 어디에 삽입할지의 정밀 위치 추정은 단순화를 위해 "본문 맨 끝에 순서대로" 로 한다.
 * 운영자가 인서트 후 드래그&드롭으로 직접 위치 조정 가능.
 */
import { useEffect, useState } from "react";
import { Sparkles, Trash2, Plus, Loader2, Wand2, X, RotateCcw } from "lucide-react";
import {
  loadAiConfig,
  getStoredPromptModel, setStoredPromptModel,
  getStoredImageModel, setStoredImageModel,
  PROMPT_MODEL_LABELS, IMAGE_MODEL_LABELS,
} from "./aiModelStore";

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 9999, padding: 16,
};

const dialogStyle = {
  width: "min(640px, 100%)", maxHeight: "90vh", overflow: "auto",
  background: "#fff", borderRadius: 8, boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
  display: "flex", flexDirection: "column",
};

const headerStyle = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "14px 18px", borderBottom: "1px solid #e2e8f0",
  fontSize: 14, fontWeight: 600, color: "#0f172a",
};

const sectionStyle = { padding: "14px 18px", display: "grid", gap: 10 };

const inputStyle = {
  fontSize: 12, fontFamily: "inherit",
  padding: 8, border: "1px solid #cbd5e1", borderRadius: 3,
  width: "100%", minHeight: 60, resize: "vertical",
};

const smallButtonStyle = {
  display: "inline-flex", alignItems: "center", gap: 4,
  height: 28, padding: "0 10px", fontSize: 11,
  border: "1px solid #cbd5e1", borderRadius: 3,
  background: "#fff", color: "#1e293b", cursor: "pointer",
};

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function callApi(path, body) {
  const headers = { "Content-Type": "application/json" };
  const csrf = getCookie("csrf-token");
  if (csrf) headers["x-csrf-token"] = csrf;
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "요청 실패");
  return json;
}

/**
 * 본문(HTML) 에서 일반 텍스트만 추출. 8000자 제한.
 * @param {string} html
 */
function htmlToPlain(html) {
  if (!html) return "";
  if (typeof DOMParser === "undefined") return html.replace(/<[^>]+>/g, " ");
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 8000);
}

export default function BlogAutoIllustrateDialog({ open, onClose, editor, doc }) {
  const [phase, setPhase] = useState("idle"); // idle | suggesting | reviewing | generating
  const [items, setItems] = useState([]); // [{ id, prompt, summary, status: "pending"|"done"|"failed", url? }]
  const [errorMsg, setErrorMsg] = useState("");

  // 모델 선택 — 백엔드 ai-config 로드 + localStorage 사용자 마지막 선택값
  const [aiConfig, setAiConfig] = useState(null);
  const [imageModel, setImageModel] = useState("");
  const [promptModel, setPromptModel] = useState("");
  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      const cfg = await loadAiConfig();
      if (!alive) return;
      setAiConfig(cfg);
      setImageModel(getStoredImageModel() || cfg?.image?.defaultModel || "dall-e-3");
      setPromptModel(getStoredPromptModel() || cfg?.prompt?.defaultModel || "claude-haiku-4-5");
    })();
    return () => { alive = false; };
  }, [open]);
  const handleImageModelChange = (m) => { setImageModel(m); setStoredImageModel(m); };
  const handlePromptModelChange = (m) => { setPromptModel(m); setStoredPromptModel(m); };

  useEffect(() => {
    if (!open) {
      setPhase("idle");
      setItems([]);
      setErrorMsg("");
    }
  }, [open]);

  if (!open) return null;

  const handleSuggest = async () => {
    setErrorMsg("");
    const html = editor?.getHTML?.() || "";
    const plain = htmlToPlain(html);
    if (plain.length < 30 && (!doc?.title || doc.title.length < 5)) {
      setErrorMsg("프롬프트 추천을 위해 본문을 좀 더 입력해주세요. (최소 30자)");
      return;
    }
    setPhase("suggesting");
    try {
      const json = await callApi("/api/media/suggest-prompts", {
        title: doc?.title || "",
        body: plain,
        count: 3,
        scope: "inline",
        model: promptModel,
      });
      const next = (json.data || []).map((p, i) => ({
        id: `sug_${Date.now()}_${i}`,
        prompt: p.prompt,
        summary: p.summary,
        status: "pending",
        url: null,
      }));
      setItems(next);
      setPhase("reviewing");
    } catch (e) {
      setErrorMsg(e.message || "추천 실패");
      setPhase("idle");
    }
  };

  const updateItem = (id, patch) =>
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const removeItem = (id) => setItems((list) => list.filter((it) => it.id !== id));

  /**
   * 단일 이미지 재생성 — 현재 프롬프트 그대로 다시 호출.
   * 이전에 본문에 삽입됐던 이미지 노드는 그대로 두고(드래그로 정리 가능),
   * 새 이미지 url 만 카드에 갱신. 새 이미지를 본문에 다시 넣고 싶으면
   * 사용자가 "본문에 다시 삽입" 버튼으로 명시적으로 추가.
   */
  const regenerateItem = async (id) => {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    const prompt = target.prompt.trim();
    if (prompt.length < 4) {
      setErrorMsg("프롬프트가 너무 짧습니다.");
      return;
    }
    setErrorMsg("");
    updateItem(id, { status: "generating", error: null });
    try {
      const json = await callApi("/api/media/generate", {
        prompt,
        size: "1792x1024",
        folder: "blog",
        model: imageModel,
      });
      const url = json.data?.url;
      if (!url) throw new Error("이미지 URL 없음");
      updateItem(id, { status: "done", url });
    } catch (e) {
      updateItem(id, { status: "failed", error: e.message });
    }
  };

  const insertItemIntoBody = (id) => {
    const target = items.find((it) => it.id === id);
    if (!target?.url || !editor) return;
    try {
      editor.chain().focus("end").insertContent({
        type: "image",
        attrs: { src: target.url, alt: target.summary || "AI generated image" },
      }).run();
      editor.chain().focus("end").insertContent("<p></p>").run();
    } catch { /* ignore */ }
  };

  const addItem = () =>
    setItems((list) => [
      ...list,
      { id: `cust_${Date.now()}`, prompt: "", summary: "사용자 추가", status: "pending", url: null },
    ]);

  const handleGenerate = async () => {
    setErrorMsg("");
    const valid = items.filter((it) => it.prompt.trim().length >= 4);
    if (valid.length === 0) {
      setErrorMsg("생성할 프롬프트가 없습니다. 최소 1개 이상 작성해주세요.");
      return;
    }
    setPhase("generating");

    // 순차 생성 — DALL-E 호출이 비싸고 동시에 너무 많이 보내면 rate limit 에 걸릴 수 있어
    // 하나씩 순서대로 처리하며 UI 에 진행 상황 즉시 반영
    for (const item of valid) {
      try {
        updateItem(item.id, { status: "generating" });
        const json = await callApi("/api/media/generate", {
          prompt: item.prompt.trim(),
          size: "1792x1024",
          folder: "blog",
          model: imageModel,
        });
        const url = json.data?.url;
        if (!url) throw new Error("이미지 URL 없음");
        updateItem(item.id, { status: "done", url });
      } catch (e) {
        updateItem(item.id, { status: "failed", error: e.message });
      }
    }

    // 성공한 이미지들만 본문 끝에 순서대로 삽입.
    // closure 문제를 피하려고 setItems 의 콜백 내에서 최신 list 로 처리.
    if (editor) {
      setItems((latest) => {
        latest.forEach((it) => {
          if (it.status === "done" && it.url) {
            try {
              editor.chain().focus("end").insertContent({
                type: "image",
                attrs: { src: it.url, alt: it.summary || "AI generated image" },
              }).run();
              editor.chain().focus("end").insertContent("<p></p>").run();
            } catch { /* ignore insertion error per item */ }
          }
        });
        return latest;
      });
    }

    setPhase("done");
  };

  const handleClose = () => {
    if (phase === "generating") {
      const ok = window.confirm("이미지 생성이 진행 중입니다. 정말 닫으시겠습니까? (지금까지 생성된 이미지는 본문에 들어가지 않을 수 있습니다)");
      if (!ok) return;
    }
    onClose();
  };

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div style={dialogStyle}>
        <div style={headerStyle}>
          <Sparkles size={16} color="#1a3a6b" />
          <span style={{ flex: 1 }}>AI 본문 이미지 자동 추가</span>
          <button type="button" onClick={handleClose} style={{ ...smallButtonStyle, height: 26, padding: "0 8px" }}>
            <X size={12} />
          </button>
        </div>

        {phase === "idle" && (
          <div style={sectionStyle}>
            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, margin: 0 }}>
              본문 내용을 분석해 어울리는 이미지 프롬프트 3개를 추천합니다.<br />
              각 프롬프트를 검토·수정·삭제한 뒤 이미지를 생성하면 본문 끝에 순서대로 삽입됩니다.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
              <label style={{ display: "grid", gap: 4, fontSize: 12, color: "#475569" }}>
                <span>프롬프트 추천 모델 (Claude)</span>
                <select
                  value={promptModel}
                  onChange={(e) => handlePromptModelChange(e.target.value)}
                  style={{ height: 36, padding: "0 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff" }}
                >
                  {(aiConfig?.prompt?.allowedModels || ["claude-haiku-4-5"]).map((m) => (
                    <option key={m} value={m}>
                      {PROMPT_MODEL_LABELS[m] || m}
                      {m === aiConfig?.prompt?.defaultModel ? " · 기본" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: 12, color: "#475569" }}>
                <span>이미지 생성 모델 (OpenAI)</span>
                <select
                  value={imageModel}
                  onChange={(e) => handleImageModelChange(e.target.value)}
                  style={{ height: 36, padding: "0 10px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff" }}
                >
                  {(aiConfig?.image?.allowedModels || ["dall-e-3"]).map((m) => (
                    <option key={m} value={m}>
                      {IMAGE_MODEL_LABELS[m] || m}
                      {m === aiConfig?.image?.defaultModel ? " · 기본" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.7, margin: 0 }}>
              본문 내용을 분석해 어울리는 이미지 프롬프트 3개를 추천합니다.<br />
              각 프롬프트를 검토·수정·삭제한 뒤 이미지를 생성하면 본문 끝에 순서대로 삽입됩니다.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleSuggest}
                style={{
                  ...smallButtonStyle, height: 36, padding: "0 16px",
                  background: "#1a3a6b", color: "#fff", borderColor: "#1a3a6b",
                }}
              >
                <Wand2 size={14} /> 프롬프트 추천 받기
              </button>
            </div>
          </div>
        )}

        {phase === "suggesting" && (
          <div style={{ ...sectionStyle, alignItems: "center", justifyItems: "center", padding: 32 }}>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "#1a3a6b" }} />
            <span style={{ fontSize: 12, color: "#475569" }}>본문을 분석해 프롬프트를 만들고 있어요... (5~10초)</span>
          </div>
        )}

        {(phase === "reviewing" || phase === "generating" || phase === "done") && (
          <div style={sectionStyle}>
            <div style={{ fontSize: 12, color: "#475569" }}>
              아래 프롬프트는 자유롭게 수정·삭제·추가할 수 있습니다.
              {phase === "done" && " 생성이 완료된 이미지는 본문 끝에 추가되었습니다."}
            </div>

            {items.length === 0 && (
              <div style={{ fontSize: 12, color: "#94a3b8", padding: 12, textAlign: "center" }}>
                프롬프트가 모두 삭제되었습니다. "프롬프트 추가" 로 직접 작성해 보세요.
              </div>
            )}

            {items.map((it, idx) => (
              <div
                key={it.id}
                style={{
                  display: "grid", gap: 6, padding: 10,
                  border: "1px solid #e2e8f0", borderRadius: 4,
                  background: it.status === "done" ? "#f0fdf4" : it.status === "failed" ? "#fef2f2" : "#f8fafc",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#475569", flexWrap: "wrap" }}>
                  <strong style={{ color: "#0f172a" }}>이미지 {idx + 1}</strong>
                  {it.summary && <span>· {it.summary}</span>}
                  <span style={{ flex: 1 }} />
                  {it.status === "generating" && <Loader2 size={12} style={{ animation: "spin 1s linear infinite", color: "#1a3a6b" }} />}
                  {it.status === "done" && <span style={{ color: "#16a34a" }}>✓ 생성 완료</span>}
                  {it.status === "failed" && <span style={{ color: "#b91c1c" }}>✕ 실패: {it.error}</span>}
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    style={{ ...smallButtonStyle, height: 22, padding: "0 6px", color: "#b91c1c" }}
                    disabled={it.status === "generating"}
                  >
                    <Trash2 size={11} /> 삭제
                  </button>
                </div>
                <textarea
                  value={it.prompt}
                  onChange={(e) => updateItem(it.id, { prompt: e.target.value, status: it.status === "done" ? "pending" : it.status })}
                  placeholder="DALL-E 3 영문 프롬프트 (직접 작성도 가능)"
                  style={inputStyle}
                  disabled={it.status === "generating"}
                />
                {it.url && (
                  <img
                    src={it.url}
                    alt={it.summary || ""}
                    style={{
                      width: "100%", maxHeight: 160, objectFit: "cover",
                      borderRadius: 3, border: "1px solid #e2e8f0",
                    }}
                  />
                )}
                {(it.status === "done" || it.status === "failed") && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => regenerateItem(it.id)}
                      style={{ ...smallButtonStyle, height: 26 }}
                    >
                      <RotateCcw size={11} /> 이 이미지만 재생성
                    </button>
                    {it.status === "done" && it.url && (
                      <button
                        type="button"
                        onClick={() => insertItemIntoBody(it.id)}
                        style={{ ...smallButtonStyle, height: 26 }}
                      >
                        <Plus size={11} /> 본문에 다시 삽입
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={addItem}
                style={smallButtonStyle}
                disabled={phase === "generating"}
              >
                <Plus size={11} /> 프롬프트 추가
              </button>
              <span style={{ flex: 1 }} />
              <button
                type="button"
                onClick={handleClose}
                style={smallButtonStyle}
                disabled={phase === "generating"}
              >
                {phase === "done" ? "닫기" : "취소"}
              </button>
              {phase !== "done" && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  style={{
                    ...smallButtonStyle, height: 32,
                    background: "#1a3a6b", color: "#fff", borderColor: "#1a3a6b",
                    opacity: phase === "generating" ? 0.6 : 1,
                  }}
                  disabled={phase === "generating" || items.length === 0}
                >
                  {phase === "generating" ? (
                    <><Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> 생성 중</>
                  ) : (
                    <><Sparkles size={11} /> 이미지 생성 및 본문 삽입</>
                  )}
                </button>
              )}
            </div>

            <span style={{ fontSize: 10, color: "#64748b" }}>
              · DALL-E 3 (1792x1024) · 1장당 약 10~20초·$0.04 · 순차 생성<br />
              · 본문 맨 끝에 추가됩니다. 위치는 추가 후 직접 드래그·이동하세요.
            </span>
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: "8px 18px", color: "#b91c1c", fontSize: 12, borderTop: "1px solid #fecaca", background: "#fef2f2" }}>
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
