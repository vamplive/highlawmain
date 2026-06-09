/**
 * BlogAutoWriteDialog — AI 블로그 글 자동 작성 다이얼로그
 *
 * 1) 사용자가 작성할 주제(topic) 및 원하는 어조(tone)를 입력
 * 2) 등록된 AI 중 원하는 모델을 선택 (API 키는 사용자 개인 연동 키 사용)
 * 3) "글 작성하기" 누르면 백엔드 호출 (POST /api/media/generate-blog-text)
 * 4) 완료 시 제목과 본문을 미리 보여주고, 덮어쓰기(Overwrite) 또는 뒤에 추가(Append)하여 본문에 삽입
 */
import { useEffect, useState } from "react";
import { Sparkles, Loader2, X, Wand2, Bot, Plus, ArrowRightLeft, FileText } from "lucide-react";
import {
  loadAiConfig,
  getStoredPromptModel,
  getStoredPromptAiConfigId, setStoredPromptAiConfigId,
  PROMPT_MODEL_LABELS,
} from "./aiModelStore";

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 9999, padding: 16,
};

const dialogStyle = {
  width: "min(540px, 100%)", maxHeight: "90vh", overflow: "auto",
  background: "#fff", borderRadius: 8, boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
  display: "flex", flexDirection: "column",
};

const headerStyle = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "14px 18px", borderBottom: "1px solid #e2e8f0",
  fontSize: 14, fontWeight: 600, color: "#0f172a",
};

const sectionStyle = { padding: "14px 18px", display: "grid", gap: 12 };

const inputStyle = {
  fontSize: 13, fontFamily: "inherit",
  padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6,
  width: "100%", minHeight: 36, outline: "none",
  boxSizing: "border-box",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 80,
  resize: "vertical",
};

const smallButtonStyle = {
  display: "inline-flex", alignItems: "center", gap: 4,
  height: 32, padding: "0 12px", fontSize: 12,
  border: "1px solid #cbd5e1", borderRadius: 6,
  background: "#fff", color: "#1e293b", cursor: "pointer",
  fontWeight: 500,
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

export default function BlogAutoWriteDialog({ open, onClose, editor, _doc, setDoc }) {
  const [phase, setPhase] = useState("idle"); // idle | generating | done
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("전문적이고 신뢰감 있는");
  const [generatedResult, setGeneratedResult] = useState(null); // { title, body }
  const [errorMsg, setErrorMsg] = useState("");

  const [_aiConfig, setAiConfig] = useState(null);
  const [_promptModel, setPromptModel] = useState("");
  const [userAiConfigs, setUserAiConfigs] = useState([]);
  const [selectedPromptAiConfigId, setSelectedPromptAiConfigId] = useState("");

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      const cfg = await loadAiConfig();
      if (!alive) return;
      setAiConfig(cfg);
      setPromptModel(getStoredPromptModel() || cfg?.prompt?.defaultModel || "claude-haiku-4-5");
      const userCfgs = cfg?.userAiConfigs || [];
      setUserAiConfigs(userCfgs);

      const storedPromptCfg = getStoredPromptAiConfigId();
      const defaultPromptCfg = userCfgs.find((c) => c.isDefaultPrompt)?.id || "";
      setSelectedPromptAiConfigId(storedPromptCfg && userCfgs.some((c) => c.id === storedPromptCfg) ? storedPromptCfg : defaultPromptCfg);
    })();
    return () => { alive = false; };
  }, [open]);

  const handlePromptAiConfigChange = (id) => { setSelectedPromptAiConfigId(id); setStoredPromptAiConfigId(id); };

  useEffect(() => {
    if (!open) {
      setPhase("idle");
      setTopic("");
      setTone("전문적이고 신뢰감 있는");
      setGeneratedResult(null);
      setErrorMsg("");
    }
  }, [open]);

  if (!open) return null;

  const handleGenerateText = async () => {
    if (topic.trim().length < 2) {
      setErrorMsg("작성할 주제를 2자 이상 입력해주세요.");
      return;
    }
    if (!selectedPromptAiConfigId) {
      setErrorMsg("AI 설정을 선택해 주세요. 개인 API 키 등록이 필요합니다.");
      return;
    }

    setErrorMsg("");
    setPhase("generating");

    try {
      const json = await callApi("/api/media/generate-blog-text", {
        topic: topic.trim(),
        tone,
        userAiConfigId: selectedPromptAiConfigId,
      });

      if (json.data) {
        setGeneratedResult(json.data);
        setPhase("done");
      } else {
        throw new Error("결과를 받지 못했습니다.");
      }
    } catch (e) {
      setErrorMsg(e.message || "글쓰기 요청 실패");
      setPhase("idle");
    }
  };

  // 본문에 반영
  const handleApply = (mode) => {
    if (!generatedResult || !editor) return;

    // 제목 업데이트
    setDoc((d) => ({
      ...d,
      title: generatedResult.title,
    }));

    if (mode === "overwrite") {
      editor.commands.setContent(generatedResult.body);
    } else if (mode === "append") {
      try {
        editor.chain().focus("end").insertContent(generatedResult.body).run();
        editor.chain().focus("end").insertContent("<p></p>").run();
      } catch { /* ignore */ }
    }

    onClose();
  };

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={dialogStyle}>
        <div style={headerStyle}>
          <Bot size={16} color="#6366f1" />
          <span style={{ flex: 1 }}>AI 글쓰기 도우미</span>
          <button type="button" onClick={onClose} style={{ ...smallButtonStyle, height: 26, padding: "0 8px" }}>
            <X size={12} />
          </button>
        </div>

        {phase === "idle" && (
          <div style={sectionStyle}>
            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: 0 }}>
              주제와 원하는 스타일(어조)을 입력하면 AI가 블로그 제목과 본문을 완성도 있게 작성해 드립니다.
            </p>

            {/* 주제 */}
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>글 주제 / 핵심 키워드 *</span>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="예: 상가 임대차 계약 묵시적 갱신 시 임차인의 중도 해지 통보 효력 및 권리금 청구 방안"
                style={textareaStyle}
              />
            </label>

            {/* 어조 */}
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>어조 / 스타일</span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                style={inputStyle}
              >
                <option value="전문적이고 신뢰감 있는">전문적이고 신뢰감 있는 (기본)</option>
                <option value="쉽고 친근한">쉽고 친근한 (이해하기 쉬움)</option>
                <option value="논리적이고 명쾌한">논리적이고 명쾌한 (핵심 중심)</option>
                <option value="정보 전달 및 공익적인">정보 전달 및 공익적인</option>
              </select>
            </label>

            {/* AI 모델 선택 (개인 API 키만 허용) */}
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>글쓰기 AI (개인 API 연동 필수)</span>
              <select
                value={selectedPromptAiConfigId}
                onChange={(e) => handlePromptAiConfigChange(e.target.value)}
                style={inputStyle}
              >
                <option value="" disabled>사용할 AI를 선택하세요</option>
                {userAiConfigs.filter((c) => ["anthropic", "openai", "google"].includes(c.provider) && !c.modelId.includes("dall-e") && !c.modelId.includes("imagen") && !c.modelId.includes("image")).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nickname} ({c.modelId}){c.isDefaultPrompt ? " · 기본" : ""}
                  </option>
                ))}
                {userAiConfigs.filter((c) => !c.modelId.includes("dall-e") && !c.modelId.includes("imagen") && !c.modelId.includes("image")).length === 0 && (
                  <option disabled value="">등록된 AI가 없습니다 (AI 설정에서 추가 필요)</option>
                )}
              </select>
            </label>

            {userAiConfigs.filter((c) => !c.modelId.includes("dall-e") && !c.modelId.includes("imagen") && !c.modelId.includes("image")).length === 0 && (
              <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: 10, borderRadius: 6, fontSize: 11, color: "#b45309" }}>
                글쓰기 AI 기능을 이용하려면 <strong>포털 &gt; AI 연동 설정</strong> 페이지에서 본인의 API 키(OpenAI, Anthropic, Google)를 먼저 등록해 주세요.
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
              <button type="button" onClick={onClose} style={smallButtonStyle}>
                취소
              </button>
              <button
                type="button"
                onClick={handleGenerateText}
                disabled={!selectedPromptAiConfigId || topic.trim().length < 2}
                style={{
                  ...smallButtonStyle,
                  background: "#1a3a6b", color: "#fff", borderColor: "#1a3a6b",
                  opacity: (!selectedPromptAiConfigId || topic.trim().length < 2) ? 0.5 : 1,
                }}
              >
                <Wand2 size={13} /> AI 글쓰기 시작
              </button>
            </div>
          </div>
        )}

        {phase === "generating" && (
          <div style={{ ...sectionStyle, alignItems: "center", justifyItems: "center", padding: "48px 24px" }}>
            <Loader2 size={36} style={{ animation: "spin 1s linear infinite", color: "#1a3a6b", marginBottom: 12 }} />
            <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 600 }}>AI가 본문과 제목을 성심껏 작성 중입니다...</span>
            <span style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>주제 분석 및 전문적 법률 서술로 약 15~30초 소요됩니다.</span>
          </div>
        )}

        {phase === "done" && generatedResult && (
          <div style={sectionStyle}>
            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 6, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>생성된 제목</div>
              <strong style={{ fontSize: 15, color: "#0f172a" }}>{generatedResult.title}</strong>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>본문 미리보기</span>
              <div
                style={{
                  border: "1px solid #cbd5e1", borderRadius: 6, padding: 12,
                  maxHeight: 180, overflowY: "auto", fontSize: 12, lineHeight: 1.6,
                  color: "#334155", background: "#fafafa",
                }}
                dangerouslySetInnerHTML={{ __html: generatedResult.body }}
              />
            </div>

            <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
              * 글이 마음에 들면 에디터 본문에 적용할 방식을 선택하세요.<br />
              * <strong>덮어쓰기</strong> 선택 시 현재 작성 중이던 모든 내용이 지워지므로 주의해 주세요.
            </p>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 4 }}>
              <button type="button" onClick={() => setPhase("idle")} style={smallButtonStyle}>
                다시 쓰기
              </button>
              <span style={{ flex: 1 }} />
              <button
                type="button"
                onClick={() => handleApply("append")}
                style={{ ...smallButtonStyle, background: "#f1f5f9", borderColor: "#cbd5e1" }}
              >
                <Plus size={13} /> 뒤에 추가
              </button>
              <button
                type="button"
                onClick={() => handleApply("overwrite")}
                style={{
                  ...smallButtonStyle,
                  background: "#1a3a6b", color: "#fff", borderColor: "#1a3a6b",
                }}
              >
                <ArrowRightLeft size={13} /> 덮어쓰기
              </button>
            </div>
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
