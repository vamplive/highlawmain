/**
 * PortalAiSettings — 구성원 AI 연동 설정 페이지
 *
 * 구성원이 직접 OpenAI, Anthropic, Google AI 등의 API 키를 등록하고
 * 블로그 에디터에서 원하는 AI를 선택해 글쓰기 보조 및 이미지 생성에 활용할 수 있도록 한다.
 */
import { useState, useEffect } from "react";
import {
  Bot, Plus, Trash2, Star, Pencil, Check, X, Eye, EyeOff,
  ChevronDown, Sparkles, Image as ImageIcon, Shield, Info
} from "lucide-react";


const API_BASE = import.meta.env.VITE_API_URL || "";

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("portal_token");
  const r = await fetch(API_BASE + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error || "오류가 발생했습니다.");
  return json.data;
}

// 공급사 색상 및 아이콘 매핑
const PROVIDER_META = {
  openai: { label: "OpenAI", color: "#10a37f", bg: "#f0fdf4", border: "#86efac", badge: "GPT" },
  anthropic: { label: "Anthropic", color: "#d97706", bg: "#fffbeb", border: "#fcd34d", badge: "Claude" },
  google: { label: "Google AI", color: "#4285f4", bg: "#eff6ff", border: "#93c5fd", badge: "Gemini" },
};

function Badge({ text, color, bg, border }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
      color, background: bg, border: `1px solid ${border}`,
    }}>
      {text}
    </span>
  );
}

function ModelTypeBadge({ type }) {
  if (type === "prompt") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6366f1", fontWeight: 600 }}>
      <Sparkles size={11} /> 글쓰기
    </span>
  );
  if (type === "image") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#0891b2", fontWeight: 600 }}>
      <ImageIcon size={11} /> 이미지
    </span>
  );
  return null;
}

// 입력 공통 스타일
const inputStyle = {
  width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb",
  borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none",
  background: "#fff", color: "#111827", transition: "border-color 0.2s",
  boxSizing: "border-box",
};

export default function PortalAiSettings() {
  const [configs, setConfigs] = useState([]);
  const [providers, setProviders] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ provider: "openai", modelId: "", nickname: "", apiKey: "" });
  const [showKey, setShowKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [providerExpanded, setProviderExpanded] = useState("openai");
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/ai-configs"),
      apiFetch("/api/ai-configs/providers"),
    ]).then(([cfgs, provs]) => {
      setConfigs(cfgs);
      setProviders(provs);
      setLoading(false);
    }).catch((e) => {
      setError(e.message);
      setLoading(false);
    });
  }, []);

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function refresh() {
    const cfgs = await apiFetch("/api/ai-configs");
    setConfigs(cfgs);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await apiFetch(`/api/ai-configs/${editId}`, {
          method: "PUT",
          body: JSON.stringify({
            nickname: formData.nickname,
            modelId: formData.modelId,
            ...(formData.apiKey ? { apiKey: formData.apiKey } : {}),
          }),
        });
        showSuccess("AI 설정이 수정되었습니다.");
      } else {
        await apiFetch("/api/ai-configs", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        showSuccess("AI가 성공적으로 등록되었습니다!");
      }
      await refresh();
      setShowForm(false);
      setEditId(null);
      setFormData({ provider: "openai", modelId: "", nickname: "", apiKey: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("이 AI 설정을 삭제하시겠습니까?")) return;
    try {
      await apiFetch(`/api/ai-configs/${id}`, { method: "DELETE" });
      await refresh();
      showSuccess("삭제되었습니다.");
    } catch (err) { setError(err.message); }
  }

  async function handleSetDefault(id, type) {
    try {
      await apiFetch(`/api/ai-configs/${id}/default-${type}`, { method: "PATCH" });
      await refresh();
      showSuccess(`기본 ${type === "prompt" ? "글쓰기" : "이미지"} AI로 설정되었습니다.`);
    } catch (err) { setError(err.message); }
  }

  function startEdit(cfg) {
    setEditId(cfg.id);
    setFormData({ provider: cfg.provider, modelId: cfg.modelId, nickname: cfg.nickname, apiKey: "" });
    setShowForm(true);
    setShowKey(false);
  }

  const selectedProviderModels = providers[formData.provider]?.models || { prompt: [], image: [] };
  const allModels = [...(selectedProviderModels.prompt || []), ...(selectedProviderModels.image || [])];

  return (
    <div style={{
      minHeight: "100vh", background: "#f8f9fb", fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
    }}>
      {/* 상단 헤더 */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "32px 36px 28px",
        color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Bot size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>AI 연동 설정</h1>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>블로그 글쓰기와 이미지 생성에 사용할 AI 서비스를 직접 등록하고 관리하세요</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px" }}>
        {/* 안내 카드 */}
        <div style={{
          background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 14,
          padding: "14px 18px", marginBottom: 24,
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <Shield size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ margin: 0, fontSize: 13, color: "#1e40af", fontWeight: 600, marginBottom: 3 }}>
              API 키 보안 안내
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#3b82f6", lineHeight: 1.6 }}>
              등록한 API 키는 AES-256-GCM 암호화되어 안전하게 저장됩니다. 키 일부만 표시되며 원문은 복원되지 않습니다.
              각 AI 공급사 대시보드에서 사용량을 별도로 확인하세요.
            </p>
          </div>
        </div>

        {/* 성공/오류 메시지 */}
        {successMsg && (
          <div style={{
            background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10,
            padding: "10px 16px", marginBottom: 16, color: "#166534", fontSize: 13,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <Check size={15} /> {successMsg}
          </div>
        )}
        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10,
            padding: "10px 16px", marginBottom: 16, color: "#991b1b", fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b" }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* 등록된 AI 목록 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
            등록된 AI ({configs.length})
          </h2>
          <button
            onClick={() => { setShowForm(true); setEditId(null); setFormData({ provider: "openai", modelId: "", nickname: "", apiKey: "" }); }}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 10,
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "#fff", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700, fontFamily: "inherit",
            }}
          >
            <Plus size={15} /> AI 추가
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>
            <Bot size={36} color="#d1d5db" style={{ marginBottom: 8 }} />
            <p>불러오는 중...</p>
          </div>
        ) : configs.length === 0 ? (
          <div style={{
            background: "#fff", border: "1.5px dashed #d1d5db", borderRadius: 16,
            padding: "48px 24px", textAlign: "center",
          }}>
            <Bot size={48} color="#d1d5db" style={{ marginBottom: 12 }} />
            <p style={{ margin: 0, color: "#9ca3af", fontSize: 15, fontWeight: 600 }}>
              등록된 AI가 없습니다
            </p>
            <p style={{ margin: "6px 0 0", color: "#d1d5db", fontSize: 13 }}>
              AI 추가 버튼을 눌러 첫 번째 AI를 등록하세요
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {configs.map((cfg) => {
              const meta = PROVIDER_META[cfg.provider] || PROVIDER_META.openai;
              const provData = providers[cfg.provider];
              const allMods = [...(provData?.models.prompt || []), ...(provData?.models.image || [])];
              const modelInfo = allMods.find((m) => m.id === cfg.modelId);
              return (
                <div key={cfg.id} style={{
                  background: "#fff", borderRadius: 14,
                  border: `1.5px solid ${meta.border}`,
                  padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: 16,
                }}>
                  {/* 공급사 뱃지 */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, border: `1.5px solid ${meta.border}`,
                  }}>
                    <Bot size={22} color={meta.color} />
                  </div>

                  {/* 정보 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{cfg.nickname}</span>
                      <Badge text={meta.badge} color={meta.color} bg={meta.bg} border={meta.border} />
                      {cfg.isDefaultPrompt && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "#7c3aed", fontWeight: 700 }}>
                          <Star size={10} fill="#7c3aed" /> 글쓰기 기본
                        </span>
                      )}
                      {cfg.isDefaultImage && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "#0891b2", fontWeight: 700 }}>
                          <Star size={10} fill="#0891b2" /> 이미지 기본
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      <span style={{ marginRight: 10 }}>{modelInfo?.label || cfg.modelId}</span>
                      {modelInfo && <ModelTypeBadge type={modelInfo.type} />}
                    </div>
                    <div style={{ fontSize: 11, color: "#d1d5db", marginTop: 2 }}>
                      키: {cfg.maskedApiKey}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {modelInfo?.type === "prompt" && !cfg.isDefaultPrompt && (
                      <button
                        onClick={() => handleSetDefault(cfg.id, "prompt")}
                        title="기본 글쓰기 AI로 설정"
                        style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e9d5ff", background: "#faf5ff", color: "#7c3aed", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}
                      >
                        <Sparkles size={12} /> 글쓰기 기본
                      </button>
                    )}
                    {modelInfo?.type === "image" && !cfg.isDefaultImage && (
                      <button
                        onClick={() => handleSetDefault(cfg.id, "image")}
                        title="기본 이미지 AI로 설정"
                        style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #bae6fd", background: "#f0f9ff", color: "#0891b2", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}
                      >
                        <ImageIcon size={12} /> 이미지 기본
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(cfg)}
                      style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#374151", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(cfg.id)}
                      style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #fee2e2", background: "#fef2f2", color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* AI 등록/수정 폼 */}
        {showForm && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }} onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditId(null); }}}>
            <div style={{
              background: "#fff", borderRadius: 20, padding: "32px 28px",
              width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>
                  {editId ? "AI 설정 수정" : "새 AI 등록"}
                </h2>
                <button onClick={() => { setShowForm(false); setEditId(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* 공급사 선택 */}
                {!editId && (
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                      AI 공급사 *
                    </label>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {Object.entries(providers).map(([key, prov]) => {
                        const meta = PROVIDER_META[key];
                        const isSelected = formData.provider === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setFormData((f) => ({ ...f, provider: key, modelId: "" }))}
                            style={{
                              flex: 1, minWidth: 140, padding: "12px 14px", borderRadius: 12,
                              border: isSelected ? `2px solid ${meta.color}` : "1.5px solid #e5e7eb",
                              background: isSelected ? meta.bg : "#fff",
                              cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: 14, color: isSelected ? meta.color : "#374151" }}>
                              {prov.name}
                            </div>
                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{prov.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 모델 선택 */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                    AI 모델 *
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {allModels.length === 0 ? (
                      <p style={{ color: "#9ca3af", fontSize: 13 }}>공급사를 선택하면 모델이 표시됩니다.</p>
                    ) : (
                      allModels.map((m) => (
                        <label
                          key={m.id}
                          style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 14px", borderRadius: 10,
                            border: formData.modelId === m.id ? "2px solid #6366f1" : "1.5px solid #e5e7eb",
                            background: formData.modelId === m.id ? "#f0f4ff" : "#fff",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="radio" name="modelId" value={m.id}
                            checked={formData.modelId === m.id}
                            onChange={() => setFormData((f) => ({ ...f, modelId: m.id }))}
                            style={{ accentColor: "#6366f1" }}
                          />
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{m.label}</span>
                          </div>
                          <ModelTypeBadge type={m.type} />
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* 닉네임 */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                    닉네임 (표시 이름) *
                  </label>
                  <input
                    style={inputStyle}
                    placeholder="예: 내 GPT-4o, 팀 Claude"
                    value={formData.nickname}
                    onChange={(e) => setFormData((f) => ({ ...f, nickname: e.target.value }))}
                    required
                  />
                </div>

                {/* API 키 */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                    API 키 {editId ? "(변경할 경우만 입력)" : "*"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showKey ? "text" : "password"}
                      style={{ ...inputStyle, paddingRight: 44 }}
                      placeholder={providers[formData.provider]?.keyPlaceholder || "API 키를 입력하세요"}
                      value={formData.apiKey}
                      onChange={(e) => setFormData((f) => ({ ...f, apiKey: e.target.value }))}
                      {...(!editId ? { required: true } : {})}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      style={{
                        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer", color: "#9ca3af",
                      }}
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9ca3af" }}>
                    <Shield size={10} style={{ verticalAlign: "middle", marginRight: 3 }} />
                    저장 시 암호화되며, 이후에는 앞·뒤 일부만 표시됩니다.
                  </p>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditId(null); }}
                    style={{
                      flex: 1, padding: "11px 0", borderRadius: 10,
                      border: "1.5px solid #e5e7eb", background: "#f9fafb",
                      color: "#374151", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                    }}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 2, padding: "11px 0", borderRadius: 10, border: "none",
                      background: submitting ? "#c4b5fd" : "linear-gradient(135deg, #667eea, #764ba2)",
                      color: "#fff", cursor: submitting ? "not-allowed" : "pointer",
                      fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                    }}
                  >
                    {submitting ? "저장 중..." : editId ? "수정 저장" : "AI 등록"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 사용 방법 안내 */}
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 14 }}>
            <Info size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
            AI 사용 방법
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { icon: <Sparkles size={20} color="#7c3aed" />, title: "글쓰기 보조", desc: "블로그 에디터에서 ✨ AI 도우미 아이콘을 클릭하면 등록한 AI 중 선택할 수 있습니다." },
              { icon: <ImageIcon size={20} color="#0891b2" />, title: "이미지 생성", desc: "커버 이미지 선택 또는 본문 이미지 삽입 시 AI 생성 탭에서 이미지 AI를 선택하세요." },
            ].map((item) => (
              <div key={item.title} style={{
                background: "#fff", borderRadius: 12, padding: "16px 18px",
                border: "1px solid #f3f4f6",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  {item.icon}
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{item.title}</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
