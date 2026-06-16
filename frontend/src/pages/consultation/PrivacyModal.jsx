/** 개인정보 수집·이용 동의서 모달 — 스크롤 완료 + 서명 후 동의 가능
 *
 * 모바일(<768px)에서는 풀스크린 레이아웃으로 전환되어 서명 영역을 최대한
 * 확보한다. 손가락 서명 도중 페이지 스크롤·핀치줌·iOS pull-to-refresh 가
 * 발생하지 않도록 body 의 overflow/touch-action 을 잠근다.
 */
import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import useSignaturePad from "./useSignaturePad";
import useFocusTrap from "../../hooks/useFocusTrap";
import PrivacyContent from "./PrivacyContent";

/**
 * onAgreed(signaturePayload) - 부모에게 서명 페이로드를 전달한다.
 *   signaturePayload = { imageData, strokes, pointerType, widthPx, heightPx }
 */

/** 스크롤 끝 감지를 위한 여유 픽셀 */
const SCROLL_BOTTOM_THRESHOLD = 10;
/** 모바일 분기점 */
const MOBILE_BREAKPOINT = 768;

/**
 * @param {{ onClose: () => void, onAgreed: () => void }} props
 */
export default function PrivacyModal({ onClose, onAgreed }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT,
  );
  const [signError, setSignError] = useState("");
  const privacyRef = useRef(null);
  const {
    signatureData,
    canvasProps,
    clear,
    confirm,
    getSignaturePayload,
    undo,
    hasInk,
    isDrawing,
    canUndo,
    forceResize,
  } = useSignaturePad();

  /* scrolledToBottom 전환 시 캔버스가 display:none → 가시 상태로 바뀌므로
     레이아웃 확정 후 명시적으로 resize 호출해 픽셀 버퍼를 초기화한다.
     (ResizeObserver 만으로도 동작하지만, rAF 호출로 확실하게 보장) */
  useLayoutEffect(() => {
    if (!scrolledToBottom) return;
    const raf = requestAnimationFrame(() => forceResize());
    return () => cancelAnimationFrame(raf);
  }, [scrolledToBottom, forceResize]);
  const dialogRef = useFocusTrap(true, { onEscape: onClose });

  /* 모달 활성 동안 배경 스크롤·바운스·핀치줌 잠금
     (손가락 서명 시 의도치 않은 페이지 이동·확대 차단) */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";
    document.body.style.touchAction = "none";

    const viewport = document.querySelector('meta[name="viewport"]');
    const originalViewport = viewport?.getAttribute("content");
    if (viewport) {
      viewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
      );
    }

    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener("resize", onResize);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevOverscroll;
      document.body.style.touchAction = prevTouch;
      if (viewport && originalViewport) viewport.setAttribute("content", originalViewport);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  /* 모달이 처음 열릴 때 콘텐츠가 이미 화면에 다 보이면 스크롤 불필요 → 바로 통과 */
  useEffect(() => {
    const el = privacyRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + SCROLL_BOTTOM_THRESHOLD) {
      setScrolledToBottom(true);
    }
  }, []);

  /** 스크롤 감지 — 끝까지 읽어야 동의 버튼 활성화 */
  const handleScroll = useCallback(() => {
    const el = privacyRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_BOTTOM_THRESHOLD) {
      setScrolledToBottom(true);
    }
  }, []);

  const canAgree = scrolledToBottom && hasInk;

  /* 모바일: 풀스크린 sheet (배경 클릭 닫기 비활성)
     데스크톱: 기존 600px 다이얼로그 */
  const overlayStyle = isMobile
    ? { background: "#fff", padding: 0 }
    : { background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: 16 };
  const dialogStyle = isMobile
    ? {
        background: "#fff",
        width: "100%",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        borderRadius: 0,
        overscrollBehavior: "contain",
      }
    : {
        background: "#fff",
        maxWidth: 600,
        width: "100%",
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        borderRadius: 4,
      };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={overlayStyle}
      onClick={isMobile ? undefined : onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
        aria-describedby="privacy-modal-desc"
        style={dialogStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid var(--border-color)" }}>
          <h3 id="privacy-modal-title" style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>개인정보 수집·이용 동의서</h3>
          <p id="privacy-modal-desc" style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>끝까지 읽으신 후 동의해주세요</p>
        </div>

        {/* 본문 스크롤 영역 */}
        <div
          ref={privacyRef}
          onScroll={handleScroll}
          style={{ flex: 1, overflowY: "auto", padding: "24px 28px", fontSize: 13, color: "#444", lineHeight: 1.9, touchAction: "pan-y" }}
        >
          <PrivacyContent />
        </div>

        {/* 서명 + 버튼 */}
        <div style={{ padding: "16px 28px 24px", borderTop: "1px solid var(--border-color)" }}>
          {/* 캔버스는 항상 DOM에 유지 — display:none 방식으로 숨겨야 useSignaturePad useEffect가
               마운트 시점에 canvas ref를 올바르게 얻어 SignatureEngine을 초기화한다.
               scrolledToBottom 전환 시 forceResize()로 픽셀 버퍼를 재초기화한다. */}
          <div style={{ marginBottom: 16, display: scrolledToBottom ? undefined : "none" }}>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, fontWeight: 500 }}>
                본인 이름을 서명해주세요
              </p>
              <div
                style={{
                  border: isDrawing ? "2px solid var(--accent-gold)" : "1px solid rgba(0,0,0,0.16)",
                  background: "#fff",
                  position: "relative",
                  borderRadius: 8,
                  overflow: "hidden",
                  boxShadow: isDrawing ? "0 0 0 4px rgba(59,110,165,0.12)" : "inset 0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <canvas {...canvasProps} />
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 28,
                    right: 28,
                    bottom: 42,
                    borderBottom: "1px dashed rgba(17,24,39,0.18)",
                    pointerEvents: "none",
                  }}
                />
                {!hasInk && (
                  <p style={{
                    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                    width: "100%", textAlign: "center",
                    fontSize: 12, color: "#9ca3af", pointerEvents: "none",
                  }}>
                    마우스, 트랙패드, 손가락으로 천천히 서명하세요
                  </p>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                <p aria-live="polite" style={{ margin: 0, fontSize: 12, color: signatureData ? "var(--accent-gold)" : "var(--text-muted)", lineHeight: 1.7 }}>
                  {signatureData ? "서명이 확인되었습니다. 아래 확인 버튼을 눌러 제출하세요." : "서명이 마음에 들지 않으면 한 획만 되돌리거나 전체를 지울 수 있습니다."}
                </p>
                <div className="flex gap-2" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button type="button" onClick={undo} disabled={!canUndo}
                    style={{ fontSize: 12, color: canUndo ? "var(--text-secondary)" : "#aaa", background: "#fff", border: "1px solid var(--gray-100)", padding: "10px 14px", minHeight: 40, cursor: canUndo ? "pointer" : "not-allowed", borderRadius: 4 }}>
                    한 획 되돌리기
                  </button>
                  <button type="button" onClick={clear} disabled={!hasInk}
                    style={{ fontSize: 12, color: hasInk ? "var(--text-secondary)" : "#aaa", background: "#fff", border: "1px solid var(--gray-100)", padding: "10px 14px", minHeight: 40, cursor: hasInk ? "pointer" : "not-allowed", borderRadius: 4 }}>
                    전체 지우기
                  </button>
                  <button type="button" onClick={confirm} disabled={!hasInk}
                    style={{ fontSize: 12, color: hasInk ? "var(--accent-gold)" : "#aaa", background: "#fff", border: "1px solid var(--accent-gold)", padding: "10px 14px", minHeight: 40, cursor: hasInk ? "pointer" : "not-allowed", borderRadius: 4, fontWeight: 600 }}>
                    서명 확인
                  </button>
                </div>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
                트랙패드는 손가락을 너무 빠르게 움직이지 말고, 클릭한 상태로 이름을 이어서 써주세요.
              </p>
            </div>

          {signError && (
            <p role="alert" style={{ margin: "0 0 10px", fontSize: 13, color: "#dc2626", textAlign: "right" }}>
              {signError}
            </p>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "12px 24px", minHeight: 44, fontSize: 13, background: "#f5f5f5",
                border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer", color: "var(--gray-500)", borderRadius: 4,
              }}
            >
              닫기
            </button>
            <button
              type="button"
              disabled={!scrolledToBottom}
              onClick={() => {
                if (!hasInk) {
                  setSignError("서명란에 이름을 서명해주세요.");
                  return;
                }
                const payload = getSignaturePayload();
                if (!payload?.imageData) {
                  setSignError("서명 저장에 실패했습니다. 다시 서명해주세요.");
                  return;
                }
                setSignError("");
                onAgreed?.(payload);
              }}
              style={{
                padding: "12px 24px", minHeight: 44, fontSize: 13, fontWeight: 600,
                background: scrolledToBottom ? "var(--accent-gold)" : "#ddd",
                color: scrolledToBottom ? "#fff" : "var(--text-muted)",
                border: "none", cursor: scrolledToBottom ? "pointer" : "not-allowed", borderRadius: 4,
              }}
            >
              {!scrolledToBottom ? "끝까지 읽어주세요 ↓" : !hasInk ? "서명을 입력해주세요" : "네, 확인했습니다"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
