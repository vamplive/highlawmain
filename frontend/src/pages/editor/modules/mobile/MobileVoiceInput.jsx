/**
 * MobileVoiceInput — Web Speech API 기반 음성 받아쓰기
 *
 * 모바일 사파리·크롬에서 webkitSpeechRecognition을 사용해 한국어 음성을 인식.
 * 인식 중간 결과는 "interim"으로 표시하고, 최종 결과는 에디터에 삽입.
 * 마이크 권한 거부·미지원 시 toast 알림.
 */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { showEditorAlert } from "../editorToast";
import { useHapticFeedback } from "./mobileHooks";

function getRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export const MobileVoiceInput = memo(function MobileVoiceInput({ editor, open, onClose }) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");
  const recogRef = useRef(null);
  const haptic = useHapticFeedback();

  const stop = useCallback(() => {
    try { recogRef.current?.stop?.(); } catch { /* ignore */ }
    setListening(false);
  }, []);

  // 시작
  useEffect(() => {
    if (!open) return undefined;
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      showEditorAlert("이 기기는 음성 입력을 지원하지 않습니다.");
      onClose?.();
      return undefined;
    }
    const recog = new Ctor();
    recog.lang = "ko-KR";
    recog.continuous = true;
    recog.interimResults = true;
    recog.onstart = () => { setListening(true); haptic(15); };
    recog.onerror = (e) => {
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        showEditorAlert("마이크 권한이 필요합니다.");
      }
      setListening(false);
    };
    recog.onend = () => setListening(false);
    recog.onresult = (e) => {
      let interimChunk = "";
      let finalChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalChunk += r[0].transcript;
        else interimChunk += r[0].transcript;
      }
      if (finalChunk) {
        setFinalText((prev) => prev + finalChunk);
        try { editor?.chain().focus().insertContent(finalChunk + " ").run(); } catch { /* ignore */ }
      }
      setInterim(interimChunk);
    };
    recogRef.current = recog;
    try { recog.start(); } catch { /* may already be running */ }
    return () => {
      try { recog.stop(); } catch { /* ignore */ }
      recogRef.current = null;
    };
  }, [open, editor, onClose, haptic]);

  if (!open) return null;

  return (
    <>
      <div className="editor-mvoice-backdrop" onClick={() => { stop(); onClose?.(); }} />
      <div className="editor-mvoice editor-mobile-only" role="dialog" aria-label="음성 받아쓰기">
        <div className="mvoice-header">
          <div className="mvoice-title">음성 받아쓰기</div>
          <button type="button" onClick={() => { stop(); onClose?.(); }} aria-label="닫기">
            <X size={20} />
          </button>
        </div>
        <div className={`mvoice-orb${listening ? " listening" : ""}`} aria-hidden="true">
          <span /><span /><span />
        </div>
        <div className="mvoice-status">
          {listening ? "듣고 있어요..." : "마이크를 활성화 중..."}
        </div>
        <div className="mvoice-transcript">
          <span className="final">{finalText}</span>
          <span className="interim"> {interim}</span>
        </div>
        <div className="mvoice-actions">
          <button
            type="button"
            className={`mvoice-toggle${listening ? " on" : ""}`}
            onClick={() => {
              if (listening) stop();
              else { try { recogRef.current?.start(); } catch { /* ignore */ } }
            }}
          >
            {listening ? <><MicOff size={18} /> 일시정지</> : <><Mic size={18} /> 다시 시작</>}
          </button>
          <button
            type="button"
            className="mvoice-done"
            onClick={() => { stop(); onClose?.(); }}
          >
            완료
          </button>
        </div>
        <div className="mvoice-tip">한국어 인식. 길게 말해도 끊기면 자동 저장됩니다.</div>
      </div>
    </>
  );
});

export default MobileVoiceInput;
