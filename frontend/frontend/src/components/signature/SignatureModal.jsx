/**
 * SignatureModal — 전자서명 패드 모달 래퍼 (반응형)
 * - 데스크톱: 중앙 다이얼로그 (max-w-2xl, height 260px)
 * - 모바일: 풀스크린 sheet — SignaturePad의 fullscreen 모드로 화면 전체 사용
 * - ESC / 배경 클릭 / 닫기 버튼으로 취소
 */
import { useEffect, useState } from "react";
import SignaturePad from "./SignaturePad";
import { Button } from "../ui/Button";

const MOBILE_BREAKPOINT = 768;

export default function SignatureModal({
  open,
  title = "전자서명",
  description = "아래 영역에 성함을 직접 서명해주세요.",
  onConfirm,
  onClose,
}) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose?.(); };
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", handleResize);

    /* 모달이 열려 있는 동안 페이지 스크롤·바운스·핀치줌을 차단해
       손가락 서명 도중 의도치 않은 화면 이동을 막는다. */
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";
    document.body.style.touchAction = "none";

    /* iOS Safari 핀치줌 차단을 위해 viewport 메타에 user-scalable=no 임시 설정 */
    const viewport = document.querySelector('meta[name="viewport"]');
    const originalViewport = viewport?.getAttribute("content");
    if (viewport) {
      viewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
      );
    }

    return () => {
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
      document.body.style.touchAction = originalTouchAction;
      if (viewport && originalViewport) viewport.setAttribute("content", originalViewport);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleComplete = (payload) => {
    onConfirm?.(payload);
    onClose?.();
  };

  // 모바일: 풀스크린 sheet
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-white" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between border-b border-gray-100 px-4 py-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900">{title}</h3>
            <p className="mt-0.5 truncate text-xs text-gray-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 min-h-[44px] min-w-[44px] rounded p-2 text-gray-400 hover:bg-gray-100"
            aria-label="닫기"
          >✕</button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SignaturePad fullscreen onComplete={handleComplete} />
        </div>
      </div>
    );
  }

  // 데스크톱: 중앙 다이얼로그
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signature-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 id="signature-modal-title" className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="닫기"
          >✕</button>
        </div>
        <div className="p-6">
          <SignaturePad height={280} onComplete={handleComplete} />
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onClose}>취소</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
