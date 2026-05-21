/**
 * useEditorEffects — EditorPage의 부수 효과(side-effect)를 모아둔 훅
 * 이미지 드래그-드롭, viewMode-편집가능 동기화, 자동저장 복원,
 * Ctrl+휠 줌, fullscreen 변경 리스너 등을 처리
 */
import { useEffect } from "react";
import { api } from "../../../utils/api";
import { loadAutoSave } from "../modules/fileUtils";
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from "../modules/editorConstants";
import { plainTextToPasteHtml, sanitizeEditorPasteHtml } from "../modules/pasteCleanup";
import { showEditorAlert } from "../modules/editorToast";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20MB — backend multer 한도와 동일

function imageAlt(file, media) {
  return media?.alt || media?.originalName || file?.name || "image";
}

/**
 * 본문에서 특정 src를 가진 이미지 노드를 찾아 src/alt 를 갱신한다.
 * 업로드 완료 후 placeholder(object URL)를 서버 URL 로 교체할 때 사용.
 */
function replaceImageSrc(editor, oldSrc, newAttrs) {
  if (!editor || editor.isDestroyed) return false;
  const { state } = editor;
  let pos = -1;
  state.doc.descendants((node, p) => {
    if (pos >= 0) return false;
    if (node.type.name === "image" && node.attrs.src === oldSrc) {
      pos = p;
      return false;
    }
    return true;
  });
  if (pos < 0) return false;
  const node = state.doc.nodeAt(pos);
  if (!node) return false;
  const tr = state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...newAttrs });
  editor.view.dispatch(tr);
  return true;
}

/**
 * 단일 이미지 파일을 즉시 placeholder(Object URL)로 본문에 삽입하고,
 * 백그라운드에서 업로드 후 src를 서버 URL 로 교체한다.
 * 업로드 실패 시 placeholder가 그대로 남으므로 사용자는 본문 흐름을 잃지 않는다.
 * 첫 이미지는 블로그 썸네일 자동 지정.
 */
async function insertImageFile(editor, file, setDoc) {
  if (!file || !file.type?.startsWith("image/")) return;
  if (file.size > MAX_IMAGE_BYTES) {
    showEditorAlert(`이미지가 너무 큽니다 (${(file.size / 1024 / 1024).toFixed(1)}MB). 최대 20MB까지 업로드 가능합니다.`);
    return;
  }

  /* 1) Object URL로 즉시 본문에 삽입 — 사용자 입력 흐름을 막지 않음 */
  const objectUrl = URL.createObjectURL(file);
  const fallbackAlt = file.name || "image";
  editor.chain().focus().setImage({ src: objectUrl, alt: fallbackAlt }).run();

  /* 2) 백그라운드 업로드 */
  try {
    const json = await api.upload("/media/upload", file);
    const media = json.data;
    if (!media?.url) throw new Error("no media url");
    /* 3) placeholder src를 서버 URL로 교체 */
    const replaced = replaceImageSrc(editor, objectUrl, {
      src: media.url,
      alt: imageAlt(file, media),
    });
    URL.revokeObjectURL(objectUrl);
    if (replaced) {
      setDoc?.((d) => d.thumbnailUrl
        ? d
        : { ...d, thumbnailUrl: media.url, ogImageUrl: d.ogImageUrl || media.url });
    }
  } catch (err) {
    /* 업로드 실패 — placeholder는 본문에 남겨두고 사용자에게 알림.
       (오프라인/CORS/CSRF 만료 등). 새로고침 시까지는 표시되며,
       저장은 시도되겠지만 base64가 아니라 blob: URL이라 렌더는 안 됨.
       따라서 base64로 한번 더 fallback 시도 */
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      replaceImageSrc(editor, objectUrl, { src: dataUrl, alt: fallbackAlt });
      URL.revokeObjectURL(objectUrl);
    } catch {
      URL.revokeObjectURL(objectUrl);
    }
    showEditorAlert(`이미지 업로드 실패: ${err?.message || "네트워크 오류"} — 임시로 본문에 보존했습니다.`);
  }
}

/**
 * 드래그 중 본문 영역에 표시할 풀스크린 오버레이를 생성/제거한다.
 * (드래그 시작/종료 시 단 하나의 오버레이만 유지)
 */
function ensureDropOverlay(domRoot) {
  let overlay = domRoot.querySelector(":scope > .yj-image-drop-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "yj-image-drop-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = '<div class="yj-image-drop-overlay-inner">📷 사진을 여기에 놓으세요</div>';
    domRoot.appendChild(overlay);
  }
  return overlay;
}

function removeDropOverlay(domRoot) {
  const overlay = domRoot?.querySelector?.(":scope > .yj-image-drop-overlay");
  if (overlay) overlay.remove();
}

/**
 * @param {object} params
 * @param {import("@tiptap/react").Editor | null} params.editor
 * @param {string} params.viewMode
 * @param {string | null} params.docId
 * @param {function} params.setDoc
 * @param {function} params.setSaveStatus
 * @param {function} params.refreshList
 * @param {function} params.setZoom
 * @param {function} params.setIsFullscreen
 * @param {function} params.setRibbonCollapsed
 * @param {function} params.hydrateFootnotes
 * @param {function} params.hydrateDrawings
 * @param {function} params.hydrateHeaderFooter
 */
export default function useEditorEffects({
  editor,
  viewMode,
  docId,
  setDoc,
  setSaveStatus,
  refreshList,
  setZoom,
  setIsFullscreen,
  setRibbonCollapsed,
  hydrateFootnotes,
  hydrateDrawings,
  hydrateHeaderFooter,
}) {
  /* viewMode에 따라 편집 가능 여부 설정 */
  useEffect(() => {
    if (editor) editor.setEditable(viewMode === "edit");
  }, [viewMode, editor]);

  /* 이미지 드래그-앤-드롭 — 외부 파일 드래그 시 풀스크린 오버레이로 시각 피드백,
     drop 시 마우스 위치로 커서 이동 후 순차 업로드/삽입 */
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    let dom = null;
    let dragDepth = 0;

    /* 외부 파일 드래그 여부 — 텍스트/노드 드래그와 구분 */
    const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes("Files");

    const handleDragEnter = (e) => {
      if (!hasFiles(e)) return;
      dragDepth += 1;
      dom?.classList.add("drag-over");
      ensureDropOverlay(dom);
    };
    const handleDragOver = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      dom?.classList.add("drag-over");
    };
    const handleDragLeave = (e) => {
      if (!hasFiles(e)) return;
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) {
        dom?.classList.remove("drag-over");
        removeDropOverlay(dom);
      }
    };
    const handleDrop = (e) => {
      dragDepth = 0;
      if (!hasFiles(e)) return;
      e.preventDefault();
      dom?.classList.remove("drag-over");
      removeDropOverlay(dom);
      const files = Array.from(e.dataTransfer?.files || []);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      if (!imageFiles.length) {
        if (files.length) showEditorAlert("이미지 파일만 본문에 삽입할 수 있습니다.");
        return;
      }
      /* 드롭 위치로 커서 이동 (정확한 포커스를 위해) */
      const coords = editor.view?.posAtCoords?.({ left: e.clientX, top: e.clientY });
      if (coords?.pos != null) editor.chain().focus().setTextSelection(coords.pos).run();
      /* 순차 업로드 — 사용자가 여러 장 드롭해도 본문 순서가 유지되도록 await */
      (async () => {
        for (const file of imageFiles) {
          await insertImageFile(editor, file, setDoc);
        }
      })();
    };

    const t = setTimeout(() => {
      try {
        dom = editor.view?.dom;
      } catch { return; }
      if (!dom) return;
      dom.addEventListener("dragenter", handleDragEnter);
      dom.addEventListener("dragover", handleDragOver);
      dom.addEventListener("dragleave", handleDragLeave);
      dom.addEventListener("drop", handleDrop);
    }, 0);

    return () => {
      clearTimeout(t);
      if (dom) {
        dom.removeEventListener("dragenter", handleDragEnter);
        dom.removeEventListener("dragover", handleDragOver);
        dom.removeEventListener("dragleave", handleDragLeave);
        dom.removeEventListener("drop", handleDrop);
        removeDropOverlay(dom);
      }
    };
  }, [editor, setDoc]);

  /* 붙여넣기 정리 — Word/웹 HTML의 위험하거나 과도한 인라인 서식을 제거 */
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    let dom = null;

    const handlePaste = (e) => {
      const clipboard = e.clipboardData;
      if (!clipboard) return;

      const imageFiles = Array.from(clipboard.files || []).filter((file) => file.type.startsWith("image/"));
      if (imageFiles.length > 0) {
        e.preventDefault();
        imageFiles.forEach((file) => insertImageFile(editor, file, setDoc));
        return;
      }

      const html = clipboard.getData("text/html");
      const text = clipboard.getData("text/plain");
      if (!html && !text) return;

      e.preventDefault();
      const cleanedHtml = html ? sanitizeEditorPasteHtml(html) : "";
      const content = cleanedHtml || plainTextToPasteHtml(text);
      if (!content) return;

      editor.chain().focus().insertContent(content).run();
    };

    const t = setTimeout(() => {
      try {
        dom = editor.view?.dom;
      } catch { return; }
      if (!dom) return;
      dom.addEventListener("paste", handlePaste, true);
    }, 0);

    return () => {
      clearTimeout(t);
      if (dom) dom.removeEventListener("paste", handlePaste, true);
    };
  }, [editor, setDoc]);

  /* 마운트 시 문서 목록 로드 */
  useEffect(() => {
    refreshList();
  }, [refreshList]);

  /* 이미지 삽입 대화상자에서 블로그 썸네일 지정 이벤트 수신 */
  useEffect(() => {
    const handler = (e) => {
      const thumbnailUrl = e.detail?.thumbnailUrl;
      if (!thumbnailUrl) return;
      setDoc((d) => ({
        ...d,
        thumbnailUrl,
        ogImageUrl: d.ogImageUrl || thumbnailUrl,
      }));
      setSaveStatus("수정됨");
    };
    window.addEventListener("editor:thumbnail-url-change", handler);
    return () => window.removeEventListener("editor:thumbnail-url-change", handler);
  }, [setDoc, setSaveStatus]);

  /* 자동 저장 복원: 에디터 준비 후 로컬 백업이 있으면 자동 복원 */
  useEffect(() => {
    if (!editor || docId) return;
    const saved = loadAutoSave();
    if (saved && saved.html) {
      editor.commands.setContent(saved.html);
      if (saved.doc && typeof saved.doc === "object") {
        setDoc(d => ({ ...d, ...saved.doc }));
      } else if (saved.title) {
        setDoc(d => ({ ...d, title: saved.title }));
      }
      if (saved.footnotes) {
        hydrateFootnotes?.(saved.footnotes);
        hydrateDrawings?.(saved.footnotes.drawings || []);
        hydrateHeaderFooter?.(saved.footnotes);
      }
      setSaveStatus("복원됨");
    }
  }, [editor, docId, setDoc, setSaveStatus, hydrateFootnotes, hydrateDrawings, hydrateHeaderFooter]);

  /* Ctrl + 마우스 휠 줌 */
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoom(z => {
          const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
          return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z + delta));
        });
      }
    };
    const scrollEl = document.querySelector(".editor-canvas-scroll");
    if (scrollEl) scrollEl.addEventListener("wheel", handler, { passive: false });
    return () => { if (scrollEl) scrollEl.removeEventListener("wheel", handler); };
  }, [setZoom]);

  /* fullscreen 변경 리스너 */
  useEffect(() => {
    const handler = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (fs) setRibbonCollapsed(true);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [setIsFullscreen, setRibbonCollapsed]);
}
