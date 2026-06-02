/**
 * 세그먼트 빌더 — 조건(분야/출처/태그/연락 이력)으로 대량 수신자 풀 생성
 * - POST /clients/segment 로 결과 조회
 * - 결과 반영 후 SendTab의 recipientList에 주입되어 체크박스 선택 단계로 진입
 */
import { useState } from "react";
import { api } from "../../../utils/api";
import {
  TagInput, COLORS, fieldStyle, labelStyle, btnStyle,
} from "../../../components/admin";
import { CATEGORY_LABELS } from "./messageConstants";

const SOURCE_LABELS = {
  consultation: "상담 신청", referral: "소개", manual: "직접 등록", other: "기타",
};
const CONSULTATION_STATUS_LABELS = {
  pending: "대기", confirmed: "확인", completed: "완료", cancelled: "취소",
};

export default function SegmentBuilder({ channel, onResult, loading, setLoading }) {
  const [categories, setCategories] = useState([]);
  const [sources, setSources] = useState([]);
  const [tags, setTags] = useState([]);
  const [consultationStatuses, setConsultationStatuses] = useState([]);
  const [lastContactedBefore, setLastContactedBefore] = useState("");
  const [lastContactedAfter, setLastContactedAfter] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState(null);

  const toggleValue = (list, value, setter) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const run = async () => {
    setError(null);
    setLoading(true);
    try {
      const criteria = {
        categories: categories.length > 0 ? categories : undefined,
        sources: sources.length > 0 ? sources : undefined,
        tags: tags.length > 0 ? tags : undefined,
        consultationStatuses: consultationStatuses.length > 0 ? consultationStatuses : undefined,
        lastContactedBefore: lastContactedBefore || undefined,
        lastContactedAfter: lastContactedAfter || undefined,
        // 채널에 맞는 연락처가 있는 고객만 매칭
        hasPhone: channel === "sms" || channel === "both" ? true : undefined,
        hasEmail: channel === "email" || channel === "both" ? true : undefined,
        isActive,
      };
      const res = await api.post("/clients/segment", criteria);
      onResult(res.data || [], res.meta?.count || 0);
    } catch (e) {
      setError(e.message || "세그먼트 조회 실패");
      onResult([], 0);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCategories([]);
    setSources([]);
    setTags([]);
    setConsultationStatuses([]);
    setLastContactedBefore("");
    setLastContactedAfter("");
    setIsActive(true);
    onResult([], 0);
  };

  return (
    <div style={{ padding: 14, background: COLORS.bgForm, border: `1px solid ${COLORS.border}`, borderRadius: 6, marginBottom: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <ChipGroup
          label="상담 분야"
          options={Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          selected={categories}
          onToggle={(v) => toggleValue(categories, v, setCategories)}
        />
        <ChipGroup
          label="출처"
          options={Object.entries(SOURCE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          selected={sources}
          onToggle={(v) => toggleValue(sources, v, setSources)}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={labelStyle}>태그 (모두 포함)</label>
        <TagInput value={tags} onChange={setTags} placeholder="예: VIP" />
      </div>

      <div style={{ marginTop: 12 }}>
        <ChipGroup
          label="상담 신청 상태"
          options={Object.entries(CONSULTATION_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          selected={consultationStatuses}
          onToggle={(v) => toggleValue(consultationStatuses, v, setConsultationStatuses)}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <div>
          <label style={labelStyle}>마지막 연락 — 이전</label>
          <input type="date" style={fieldStyle} value={lastContactedBefore} onChange={(e) => setLastContactedBefore(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>마지막 연락 — 이후</label>
          <input type="date" style={fieldStyle} value={lastContactedAfter} onChange={(e) => setLastContactedAfter(e.target.value)} />
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12, color: COLORS.textSecondary }}>
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        활성 고객만 포함
      </label>

      {error && <div style={{ fontSize: 12, color: COLORS.danger, marginTop: 8 }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={run} disabled={loading} style={btnStyle(COLORS.accent)}>
          {loading ? "조회 중..." : "🔍 조건 적용"}
        </button>
        <button onClick={reset} disabled={loading} style={btnStyle(COLORS.muted)}>
          초기화
        </button>
      </div>
    </div>
  );
}

/** 다중 선택 칩 그룹 */
function ChipGroup({ label, options, selected, onToggle }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              style={{
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: active ? 600 : 400,
                color: active ? "#fff" : COLORS.textSecondary,
                background: active ? COLORS.accent : "#fff",
                border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
