/**
 * 관리자 법률상담도우미(챗봇 Q&A) 관리 — 대화 시나리오 리스트 + CRUD 편집 폼
 * 챗봇 매칭 엔진: 사용자가 보낸 질문의 키워드를 분석하여 데이터베이스에서 가장 매칭 점수가 높은 답변을 자동 반환합니다.
 */
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../utils/api";
import {
  PageHeader,
  ErrorBanner,
  EmptyState,
  COLORS,
  badgeStyle,
  btnStyle,
  smallBtnStyle,
  fieldStyle,
  labelStyle,
  formContainerStyle,
  thStyle,
  tdStyle,
} from "../../../components/admin";
import { formatDate } from "../../../utils/formatters";

const CATEGORY_TABS = [
  { value: "all", label: "전체 목록" },
  { value: "일반", label: "일반/인사" },
  { value: "비용", label: "상담 비용" },
  { value: "예약", label: "예약 안내" },
  { value: "업무분야", label: "업무분야" },
  { value: "위치", label: "오시는 길" },
];

export default function AdminChatbot() {
  const [activeTab, setActiveTab] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState(null); // 선택된 Q&A (편집/생성용)
  const [isAdding, setIsAdding] = useState(false); // 새 항목 등록 모드

  // 목록 불러오기
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/chatbot/qa");
      setItems(res.data || []);
    } catch (e) {
      setError(e.message || "챗봇 Q&A 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 저장 처리 (생성 및 수정 통합)
  async function handleSave(id, data) {
    setError(null);
    try {
      if (id) {
        // 수정
        await api.patch(`/chatbot/qa/${id}`, data);
      } else {
        // 생성
        await api.post("/chatbot/qa", data);
      }
      setSelected(null);
      setIsAdding(false);
      await load();
    } catch (e) {
      setError(e.message || "저장에 실패했습니다.");
    }
  }

  // 삭제 처리
  async function handleDelete(id) {
    if (!confirm("정말 이 챗봇 Q&A 데이터를 삭제하시겠습니까? 복구할 수 없습니다.")) return;
    setError(null);
    try {
      await api.delete(`/chatbot/qa/${id}`);
      setSelected(null);
      setIsAdding(false);
      await load();
    } catch (e) {
      setError(e.message || "삭제 실패");
    }
  }

  // 등록/수정 화면 진입용 빈 항목 템플릿
  const handleAddNew = () => {
    setSelected(null);
    setIsAdding(true);
  };

  // 검색 및 카테고리 필터링 적용
  const filteredItems = items.filter((item) => {
    const matchesCategory = activeTab === "all" || item.category === activeTab;
    const matchesSearch =
      searchQuery.trim() === "" ||
      (item.question && item.question.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.keywords && item.keywords.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.answer && item.answer.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <ErrorBanner message={error} onDismiss={() => setError(null)} />
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <PageHeader title="법률상담도우미 (AI 챗봇) 관리" />
        {!isAdding && !selected && (
          <button onClick={handleAddNew} style={btnStyle(COLORS.accent)}>
            + 새 챗봇 답변 등록
          </button>
        )}
      </div>

      <p style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 1.6 }}>
        고객이 우측 하단의 <strong>[법률상담도우미]</strong> 플로팅 챗봇 버튼을 통해 질문할 때 작동하는 키워드 시나리오를 설정합니다.<br />
        고객이 보낸 질문 텍스트 속에 <strong>'매칭 키워드'</strong>가 하나라도 포함되면 해당 답변을 즉시 실시간으로 자동 반환합니다.
      </p>

      {/* 새 등록 또는 수정 폼 활성화 */}
      {(isAdding || selected) && (
        <ChatbotEditor
          item={selected}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => {
            setSelected(null);
            setIsAdding(false);
          }}
        />
      )}

      {/* 검색 바 & 카테고리 탭 */}
      {!isAdding && !selected && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              placeholder="질문 제목, 매칭 키워드, 답변 내용 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                ...fieldStyle,
                maxWidth: 400,
                height: 38,
                padding: "8px 14px",
                boxSizing: "border-box",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  background: "none",
                  border: "none",
                  color: COLORS.textMuted,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                검색 초기화
              </button>
            )}
          </div>

          {/* 카테고리 탭 */}
          <div style={{ display: "flex", gap: 8, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 24, overflowX: "auto" }}>
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                style={{
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 500,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: activeTab === tab.value ? COLORS.text : COLORS.textMuted,
                  borderBottom: `2px solid ${activeTab === tab.value ? COLORS.accent : "transparent"}`,
                  marginBottom: -1,
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 목록 출력 */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: COLORS.textMuted }}>데이터를 불러오는 중...</div>
          ) : filteredItems.length === 0 ? (
            <EmptyState message="등록된 챗봇 Q&A 데이터가 없습니다." />
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
                background: "#fff",
                border: `1px solid ${COLORS.borderLight}`,
              }}
            >
              <thead style={{ background: "#f7f8fa", borderBottom: `1px solid ${COLORS.border}` }}>
                <tr>
                  <th style={{ ...thStyle, width: 80 }}>상태</th>
                  <th style={{ ...thStyle, width: 100 }}>카테고리</th>
                  <th style={{ ...thStyle, width: 220 }}>관리용 질문명 (제목)</th>
                  <th style={thStyle}>매칭 작동 키워드 (쉼표 구분)</th>
                  <th style={{ ...thStyle, width: 80, textAlign: "center" }}>정렬순서</th>
                  <th style={{ ...thStyle, width: 90, textAlign: "right" }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} style={{ borderTop: `1px solid ${COLORS.borderLight}` }}>
                    <td style={tdStyle}>
                      <span style={badgeStyle(item.isActive ? COLORS.success : COLORS.muted)}>
                        {item.isActive ? "활성" : "비활성"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 500, color: COLORS.textSecondary }}>{item.category}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: COLORS.text }}>{item.question}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {item.keywords ? (
                          item.keywords.split(",").map((kw, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: 11,
                                padding: "2px 8px",
                                background: "rgba(201,168,76,0.1)",
                                border: "1px solid rgba(201,168,76,0.25)",
                                borderRadius: 4,
                                color: COLORS.accent,
                              }}
                            >
                              {kw.trim()}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: COLORS.danger, fontSize: 11 }}>작동 키워드 없음 (상시 미매칭)</span>
                        )}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center", color: COLORS.textMuted }}>{item.sortOrder || 0}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <button onClick={() => setSelected(item)} style={smallBtnStyle(COLORS.primary)}>
                        편집
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

/** 챗봇 답변 등록 및 수정 폼 컴포넌트 */
function ChatbotEditor({ item, onSave, onDelete, onCancel }) {
  const [category, setCategory] = useState(item?.category || "일반");
  const [question, setQuestion] = useState(item?.question || "");
  const [answer, setAnswer] = useState(item?.answer || "");
  const [keywords, setKeywords] = useState(item?.keywords || "");
  const [sortOrder, setSortOrder] = useState(item?.sortOrder || 0);
  const [isActive, setIsActive] = useState(item?.isActive === undefined ? true : !!item.isActive);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!question.trim()) {
      alert("관리용 질문명을 입력해 주세요.");
      return;
    }
    if (!answer.trim()) {
      alert("고객에게 자동 응답할 답변 내용을 입력해 주세요.");
      return;
    }
    if (!keywords.trim()) {
      alert("동작을 감지할 매칭 키워드를 최소 한 개 이상 쉼표로 적어 주세요.");
      return;
    }

    setSaving(true);
    // 쉼표 사이의 불필요한 공백을 정돈하여 저장
    const cleanedKeywords = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
      .join(",");

    const payload = {
      category,
      question: question.trim(),
      answer: answer.trim(),
      keywords: cleanedKeywords,
      sortOrder: Number(sortOrder) || 0,
      isActive: isActive ? 1 : 0,
    };

    await onSave(item?.id, payload);
    setSaving(false);
  }

  return (
    <div style={{ ...formContainerStyle, marginBottom: 30 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, margin: 0 }}>
          {item ? "챗봇 답변 수정 및 편집" : "새로운 챗봇 자동 답변 등록"}
        </h3>
        {item && (
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>
            현재 상태:{" "}
            <span style={badgeStyle(item.isActive ? COLORS.success : COLORS.muted)}>
              {item.isActive ? "활성" : "비활성"}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>카테고리</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={fieldStyle}>
            <option value="일반">일반/인사</option>
            <option value="비용">상담 비용</option>
            <option value="예약">예약 안내</option>
            <option value="업무분야">업무분야</option>
            <option value="위치">오시는 길</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>정렬 우선순위 (sortOrder — 낮을수록 먼저 탐색)</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={fieldStyle}
            placeholder="0"
          />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>관리용 질문명 (제목)</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예: 변호사 선임 비용 및 상담비 안내"
          style={fieldStyle}
          maxLength={100}
        />
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
          관리자 화면에서 구별하기 위한 질문명입니다. 실제 고객과의 채팅 내용 매칭과는 무관합니다.
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>동작 감지 키워드 (쉼표 <code>,</code>로 구분)</label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="예: 비용, 가격, 수임료, 얼마, 선임료"
          style={fieldStyle}
        />
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
          고객이 입력한 문자열에 위 단어가 <strong>하나라도 포함</strong>되면 아래 답변이 전송됩니다. 쉼표로 단어를 구분해 적어주세요.
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>챗봇 자동 응답 답변 내용</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={8}
          style={{ ...fieldStyle, resize: "vertical", fontFamily: "inherit" }}
          placeholder="고객이 위 키워드를 말했을 때 전송될 답변 내용입니다. 홈페이지 링크 주입이 가능합니다. (예: 자세한 내용은 [상담 신청](/consultation) 메뉴를 이용해주세요.)"
        />
      </div>

      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          style={{ cursor: "pointer", width: 16, height: 16 }}
        />
        <label htmlFor="isActive" style={{ ...labelStyle, margin: 0, cursor: "pointer", fontSize: 13 }}>
          즉시 활성화하여 챗봇 응답에 반영합니다.
        </label>
      </div>

      {/* 액션 버튼 */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 16,
          borderTop: `1px solid ${COLORS.border}`,
        }}
      >
        {item ? (
          <button onClick={() => onDelete(item.id)} disabled={saving} style={smallBtnStyle(COLORS.danger)}>
            삭제
          </button>
        ) : (
          <div />
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            disabled={saving}
            style={{
              ...btnStyle(),
              background: "#fff",
              color: COLORS.textSecondary,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            취소
          </button>
          <button onClick={submit} disabled={saving} style={btnStyle(COLORS.success)}>
            {saving ? "저장 중..." : item ? "수정 내용 저장" : "새 답변 등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
