/**
 * MobilePublishSheet — SEO 점검 + 즉시·예약 발행을 한 화면에서 처리
 *
 * 모바일에서 글 발행 직전 핵심을 빠르게 확인하고 보낼 수 있도록 통합:
 *  - 자동 SEO 검사: 제목 길이, 요약 길이, H1 개수, 키워드 빈도, 썸네일 alt, 본문 길이
 *  - 즉시 발행: handlePublishBlog 호출
 *  - 예약 발행: 날짜·시간 picker → publishedAt 설정 → 발행
 */
import { memo, useMemo, useState } from "react";
import { X, Send, Clock, AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";
import { evaluateSeo } from "./seoCheck";

function pad(n) { return String(n).padStart(2, "0"); }

function defaultScheduleValue() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const MobilePublishSheet = memo(function MobilePublishSheet({
  open, onClose, doc, setDoc,
  editorHtml,
  onPublish,
  isPublishing,
}) {
  const [scheduleAt, setScheduleAt] = useState(defaultScheduleValue);
  const [mode, setMode] = useState("now"); // "now" | "schedule"

  const checks = useMemo(() => evaluateSeo({
    title: doc?.title,
    excerpt: doc?.excerpt,
    html: editorHtml,
    thumbnailUrl: doc?.thumbnailUrl,
  }), [doc?.title, doc?.excerpt, doc?.thumbnailUrl, editorHtml]);

  const errors = checks.filter((c) => c.level === "error").length;
  const warns = checks.filter((c) => c.level === "warn").length;
  const oks = checks.filter((c) => c.level === "ok").length;

  if (!open) return null;

  const handleSubmit = () => {
    if (errors > 0) {
      if (!window.confirm("오류가 있는 상태로 발행할까요?")) return;
    }
    if (mode === "schedule") {
      const ts = new Date(scheduleAt);
      if (Number.isNaN(ts.getTime())) {
        // 유효하지 않은 입력
        return;
      }
      setDoc((d) => ({ ...d, scheduledAt: ts.toISOString(), publishedAt: ts.toISOString(), status: "scheduled" }));
    }
    onPublish?.();
  };

  return (
    <>
      <div className="editor-msheet-backdrop" onClick={onClose} />
      <div className="editor-mpublish editor-mobile-only" role="dialog" aria-label="발행 시트">
        <div className="editor-msheet-handle" />
        <div className="editor-msheet-header">
          <div className="editor-msheet-title">발행 검사</div>
          <button type="button" onClick={onClose} aria-label="닫기"
            style={{ width: 36, height: 36, border: "none", background: "transparent", borderRadius: 8, cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>
        <div className="editor-msheet-body">
          {/* 점수 요약 */}
          <div className="mpublish-summary">
            <div className="mpublish-score" data-status={errors > 0 ? "error" : warns > 0 ? "warn" : "ok"}>
              {errors > 0 ? "주의" : warns > 0 ? "확인" : "준비"}
            </div>
            <div className="mpublish-counts">
              <span className="ok"><CheckCircle2 size={14} /> {oks}</span>
              <span className="warn"><MinusCircle size={14} /> {warns}</span>
              <span className="error"><AlertTriangle size={14} /> {errors}</span>
            </div>
          </div>

          {/* 검사 결과 목록 */}
          <ul className="mpublish-checks">
            {checks.map((c) => (
              <li key={c.id} className={`mpublish-check ${c.level}`}>
                {c.level === "ok" && <CheckCircle2 size={16} />}
                {c.level === "warn" && <MinusCircle size={16} />}
                {c.level === "error" && <AlertTriangle size={16} />}
                <span>{c.text}</span>
              </li>
            ))}
          </ul>

          {/* 모드 선택 */}
          <div className="mpublish-mode">
            <button type="button" className={mode === "now" ? "active" : ""} onClick={() => setMode("now")}>
              <Send size={14} /> 지금 발행
            </button>
            <button type="button" className={mode === "schedule" ? "active" : ""} onClick={() => setMode("schedule")}>
              <Clock size={14} /> 예약
            </button>
          </div>

          {mode === "schedule" && (
            <div className="mpublish-schedule">
              <label htmlFor="mpublish-schedule-at">예약 시각</label>
              <input
                id="mpublish-schedule-at"
                type="datetime-local"
                className="mmeta-input"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                min={defaultScheduleValue()}
              />
              <p className="mpublish-tip">선택한 시각에 자동으로 게시되도록 예약합니다. 시간대는 기기 로컬 기준입니다.</p>
            </div>
          )}

          <div className="mpublish-actions">
            <button type="button" className="mmeta-secondary" onClick={onClose}>닫기</button>
            <button
              type="button"
              className="mmeta-primary"
              onClick={handleSubmit}
              disabled={isPublishing}
            >
              {isPublishing ? "처리 중..." : (mode === "schedule" ? "예약 발행" : "지금 발행")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
});

export default MobilePublishSheet;
