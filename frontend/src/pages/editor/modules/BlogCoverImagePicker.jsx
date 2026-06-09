/**
 * BlogCoverImagePicker — 블로그 대표 이미지 입력 컨트롤
 *
 * 세 가지 방식 지원:
 *   1) 드래그&드롭 또는 파일 선택으로 업로드 (POST /api/media/upload)
 *   2) URL 직접 붙여넣기
 *   3) AI 프롬프트로 생성 (POST /api/media/generate, DALL-E 3)
 *
 * 부모는 thumbnailUrl 만 신경쓰면 된다 — onChange(url) 로 통보.
 * ogImageUrl 자동 동기화는 부모(BlogComposerPanel)가 처리.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Sparkles, Upload, Loader2, X, Link2, Wand2, RotateCcw } from "lucide-react";
import {
  loadAiConfig,
  getStoredPromptModel,
  getStoredImageModel,
  getStoredPromptAiConfigId, setStoredPromptAiConfigId,
  getStoredImageAiConfigId, setStoredImageAiConfigId,
  PROMPT_MODEL_LABELS, IMAGE_MODEL_LABELS,
} from "./aiModelStore";

const ACCEPT_MIME = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES = 20 * 1024 * 1024;

const inputStyle = {
  height: 38,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: "0 12px",
  fontSize: 14,
  background: "#fff",
  color: "#111827",
  fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
  width: "100%",
};

const smallButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  height: 36,
  padding: "0 14px",
  fontSize: 13,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "#fff",
  color: "#1e293b",
  cursor: "pointer",
  fontWeight: 500,
};

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function uploadCoverFile(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", "blog");
  const headers = {};
  const csrf = getCookie("csrf-token");
  if (csrf) headers["x-csrf-token"] = csrf;
  const res = await fetch("/api/media/upload", {
    method: "POST",
    credentials: "include",
    body: form,
    headers,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "업로드에 실패했습니다");
  return json.data?.url;
}

async function generateCoverImage(prompt, model, userAiConfigId) {
  const headers = { "Content-Type": "application/json" };
  const csrf = getCookie("csrf-token");
  if (csrf) headers["x-csrf-token"] = csrf;
  const res = await fetch("/api/media/generate", {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({
      prompt,
      size: "1792x1024",
      folder: "blog",
      model,
      ...(userAiConfigId ? { userAiConfigId } : {}),
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "AI 이미지 생성에 실패했습니다");
  return json.data?.url;
}

async function suggestCoverPrompt({ title, body, model, userAiConfigId }) {
  const headers = { "Content-Type": "application/json" };
  const csrf = getCookie("csrf-token");
  if (csrf) headers["x-csrf-token"] = csrf;
  const res = await fetch("/api/media/suggest-prompts", {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({
      title,
      body,
      count: 1,
      scope: "cover",
      model,
      ...(userAiConfigId ? { userAiConfigId } : {}),
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "프롬프트 추천 실패");
  return json.data?.[0]?.prompt || "";
}

function htmlToPlain(html) {
  if (!html) return "";
  if (typeof DOMParser === "undefined") return html.replace(/<[^>]+>/g, " ");
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 8000);
}

/**
 * @param {object} props
 * @param {string} props.value - 현재 thumbnailUrl
 * @param {(url: string) => void} props.onChange
 * @param {{ title?: string }} [props.docContext] - 프롬프트 추천에 사용할 제목
 * @param {() => string} [props.getEditorHtml] - 본문 HTML 가져오는 함수 (추천에 사용)
 */
export default function BlogCoverImagePicker({ value, onChange, docContext, getEditorHtml }) {
  const [mode, setMode] = useState("idle"); // idle | dragging | uploading | generating | suggesting
  const [showAi, setShowAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);

  // 백엔드 ai-config 로드 후 사용자가 마지막에 고른 모델 또는 .env 기본값으로 초기화
  const [_aiConfig, setAiConfig] = useState(null);
  const [imageModel, setImageModel] = useState("");
  const [promptModel, setPromptModel] = useState("");
  // 사용자 등록 AI 설정
  const [userAiConfigs, setUserAiConfigs] = useState([]);
  const [selectedPromptAiConfigId, setSelectedPromptAiConfigId] = useState("");
  const [selectedImageAiConfigId, setSelectedImageAiConfigId] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const cfg = await loadAiConfig();
      if (!alive) return;
      setAiConfig(cfg);
      setImageModel(getStoredImageModel() || cfg?.image?.defaultModel || "dall-e-3");
      setPromptModel(getStoredPromptModel() || cfg?.prompt?.defaultModel || "claude-haiku-4-5");
      // 사용자 등록 AI 목록
      const userCfgs = cfg?.userAiConfigs || [];
      setUserAiConfigs(userCfgs);
      // 이전 선택값 복원 (또는 기본 AI)
      const storedPromptCfg = getStoredPromptAiConfigId();
      const defaultPromptCfg = userCfgs.find((c) => c.isDefaultPrompt)?.id || "";
      setSelectedPromptAiConfigId(storedPromptCfg && userCfgs.some((c) => c.id === storedPromptCfg) ? storedPromptCfg : defaultPromptCfg);
      const storedImageCfg = getStoredImageAiConfigId();
      const defaultImageCfg = userCfgs.find((c) => c.isDefaultImage)?.id || "";
      setSelectedImageAiConfigId(storedImageCfg && userCfgs.some((c) => c.id === storedImageCfg) ? storedImageCfg : defaultImageCfg);
    })();
    return () => { alive = false; };
  }, []);

  const handlePromptAiConfigChange = (id) => { setSelectedPromptAiConfigId(id); setStoredPromptAiConfigId(id); };
  const handleImageAiConfigChange = (id) => { setSelectedImageAiConfigId(id); setStoredImageAiConfigId(id); };

  const handleFiles = useCallback(async (files) => {
    setErrorMsg("");
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrorMsg("파일 크기는 20MB 이하만 가능합니다.");
      return;
    }
    setMode("uploading");
    try {
      const url = await uploadCoverFile(file);
      if (url) onChange(url);
    } catch (e) {
      setErrorMsg(e.message || "업로드 실패");
    } finally {
      setMode("idle");
    }
  }, [onChange]);

  const handleDragEnter = (e) => { e.preventDefault(); setMode("dragging"); };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDragLeave = (e) => { e.preventDefault(); setMode("idle"); };
  const handleDrop = async (e) => {
    e.preventDefault();
    setMode("idle");
    await handleFiles(e.dataTransfer?.files);
  };

  const handlePickClick = () => inputRef.current?.click();

  const handleInputChange = async (e) => {
    await handleFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAiSubmit = async () => {
    const prompt = aiPrompt.trim();
    if (prompt.length < 4) {
      setErrorMsg("프롬프트를 4자 이상 입력해주세요.");
      return;
    }
    setErrorMsg("");
    setMode("generating");
    try {
      const url = await generateCoverImage(prompt, imageModel, selectedImageAiConfigId);
      if (url) {
        onChange(url);
        // 프롬프트는 비우지 않고 유지 — 사용자가 마음에 안 들면 같은 프롬프트 수정해 재생성 가능
      }
    } catch (e) {
      setErrorMsg(e.message || "생성 실패");
    } finally {
      setMode("idle");
    }
  };

  const handleSuggestPrompt = async () => {
    setErrorMsg("");
    setMode("suggesting");
    try {
      const html = getEditorHtml ? getEditorHtml() : "";
      const plain = htmlToPlain(html);
      const suggested = await suggestCoverPrompt({
        title: docContext?.title || "",
        body: plain,
        model: promptModel,
        userAiConfigId: selectedPromptAiConfigId,
      });
      if (suggested) {
        setAiPrompt(suggested);
        setShowAi(true);
      } else {
        setErrorMsg("추천된 프롬프트가 비어있습니다. 직접 작성해주세요.");
      }
    } catch (e) {
      setErrorMsg(e.message || "추천 실패");
    } finally {
      setMode("idle");
    }
  };

  const isBusy = mode === "uploading" || mode === "generating" || mode === "suggesting";
  const dropAreaActive = mode === "dragging" || mode === "uploading" || mode === "generating";

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MIME}
        style={{ display: "none" }}
        onChange={handleInputChange}
      />

      {value ? (
        <div style={{ position: "relative", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <img
            src={value}
            alt="대표 이미지 미리보기"
            style={{
              width: 96,
              height: 64,
              objectFit: "cover",
              borderRadius: 4,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
            }}
            onError={(e) => { e.currentTarget.style.opacity = 0.3; }}
          />
          <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 4 }}>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{ ...inputStyle }}
              placeholder="https://..."
            />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button type="button" onClick={handlePickClick} style={smallButtonStyle} disabled={isBusy}>
                <Upload size={11} /> 파일 교체
              </button>
              <button
                type="button"
                onClick={() => {
                  if (aiPrompt.trim()) {
                    handleAiSubmit();
                  } else {
                    setShowAi(true);
                  }
                }}
                style={smallButtonStyle}
                disabled={isBusy}
                title={aiPrompt.trim() ? "현재 프롬프트로 재생성" : "AI 프롬프트 입력"}
              >
                {mode === "generating" ? (
                  <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <RotateCcw size={11} />
                )}
                {mode === "generating" ? " 생성 중" : " AI로 재생성"}
              </button>
              <button type="button" onClick={() => setShowAi((v) => !v)} style={smallButtonStyle} disabled={isBusy}>
                <Sparkles size={11} /> {showAi ? "프롬프트 닫기" : "프롬프트 보기/수정"}
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                style={{ ...smallButtonStyle, color: "#b91c1c" }}
                disabled={isBusy}
              >
                <X size={11} /> 제거
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handlePickClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handlePickClick();
            }
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "14px 8px",
            border: `1px dashed ${dropAreaActive ? "#1a3a6b" : "#cbd5e1"}`,
            background: dropAreaActive ? "rgba(26, 58, 107, 0.05)" : "#fafafa",
            borderRadius: 4,
            cursor: isBusy ? "wait" : "pointer",
            color: "#475569",
            fontSize: 11,
            transition: "border-color 120ms, background 120ms",
          }}
        >
          {mode === "uploading" || mode === "generating" ? (
            <>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              <span>{mode === "uploading" ? "업로드 중..." : "AI 이미지 생성 중... (10~20초)"}</span>
            </>
          ) : (
            <>
              <ImageIcon size={18} />
              <span>드래그&드롭 또는 클릭하여 파일 선택</span>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>JPG · PNG · WEBP · GIF · 최대 20MB</span>
            </>
          )}
        </div>
      )}

      {!value && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
            <Link2 size={12} style={{ position: "absolute", left: 8, top: 9, color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="또는 URL 직접 입력"
              style={{ ...inputStyle, paddingLeft: 26 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const url = e.currentTarget.value.trim();
                  if (url) onChange(url);
                }
              }}
              onBlur={(e) => {
                const url = e.currentTarget.value.trim();
                if (url) onChange(url);
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAi((v) => !v)}
            style={smallButtonStyle}
            disabled={isBusy}
          >
            <Sparkles size={11} /> AI로 생성
          </button>
          <button
            type="button"
            onClick={handleSuggestPrompt}
            style={smallButtonStyle}
            disabled={isBusy}
            title="블로그 제목·본문을 분석해 프롬프트를 자동 추천"
          >
            {mode === "suggesting" ? (
              <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Wand2 size={11} />
            )}
            {mode === "suggesting" ? " 분석 중" : " 프롬프트 추천"}
          </button>
        </div>
      )}

      {showAi && (
        <div style={{
          display: "grid", gap: 8, padding: 12,
          border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc",
        }}>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="예: 한국 법률사무소 분위기, 책장과 따뜻한 조명, 전문적이고 신뢰감 있는 일러스트 스타일"
            rows={3}
            style={{
              fontSize: 14, fontFamily: "inherit",
              padding: 10, border: "1px solid #cbd5e1", borderRadius: 6,
              resize: "vertical", minHeight: 64,
            }}
            disabled={isBusy}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
            <label style={{ display: "grid", gap: 4, fontSize: 12, color: "#475569" }}>
              <span>이미지 생성 AI</span>
              <select
                value={selectedImageAiConfigId}
                onChange={(e) => handleImageAiConfigChange(e.target.value)}
                disabled={isBusy}
                style={{
                  height: 36, padding: "0 10px", fontSize: 13,
                  border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff",
                }}
              >
                <option value="" disabled>사용할 이미지 AI를 선택하세요</option>
                {userAiConfigs.filter((c) => c.provider === "openai" && (c.modelId.includes("dall-e") || c.modelId.includes("image"))).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nickname} ({c.modelId}){c.isDefaultImage ? " · 기본" : ""}
                  </option>
                ))}
                {userAiConfigs.filter((c) => c.provider === "openai" && (c.modelId.includes("dall-e") || c.modelId.includes("image"))).length === 0 && (
                  <option disabled value="">등록된 이미지 AI 없음</option>
                )}
              </select>
            </label>
            <label style={{ display: "grid", gap: 4, fontSize: 12, color: "#475569" }}>
              <span>프롬프트 추천 AI (Claude)</span>
              <select
                value={selectedPromptAiConfigId}
                onChange={(e) => handlePromptAiConfigChange(e.target.value)}
                disabled={isBusy}
                style={{
                  height: 36, padding: "0 10px", fontSize: 13,
                  border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff",
                }}
              >
                <option value="" disabled>사용할 AI를 선택하세요</option>
                {userAiConfigs.filter((c) => ["anthropic", "openai", "google"].includes(c.provider) && !c.modelId.includes("dall-e") && !c.modelId.includes("imagen") && !c.modelId.includes("image")).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nickname} ({c.modelId}){c.isDefaultPrompt ? " · 기본" : ""}
                  </option>
                ))}
                {userAiConfigs.filter((c) => !c.modelId.includes("dall-e") && !c.modelId.includes("imagen") && !c.modelId.includes("image")).length === 0 && (
                  <option disabled value="">등록된 AI 없음</option>
                )}
              </select>
            </label>
          </div>

          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => { setShowAi(false); setAiPrompt(""); setErrorMsg(""); }}
              style={smallButtonStyle}
              disabled={isBusy}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleAiSubmit}
              style={{
                ...smallButtonStyle,
                background: "#1a3a6b",
                color: "#fff",
                borderColor: "#1a3a6b",
                opacity: isBusy ? 0.6 : 1,
              }}
              disabled={isBusy}
            >
              {mode === "generating" ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={14} />}
              {mode === "generating" ? "생성 중" : "이미지 생성"}
            </button>
          </div>
          <span style={{ fontSize: 11, color: "#64748b" }}>
            모델 변경은 같은 단말에서 다음 세션까지 기억됩니다. 1792×1024 · 평균 10~20초.
          </span>
        </div>
      )}

      {errorMsg && (
        <span style={{ fontSize: 11, color: "#b91c1c" }}>{errorMsg}</span>
      )}
    </div>
  );
}
