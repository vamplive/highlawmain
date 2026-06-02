/**
 * ResizableImage — 블로그/문서 본문에 자유롭게 편집 가능한 이미지 노드
 *
 * 기존 @tiptap/extension-image의 단순 <img> 대신 다음 기능을 추가한다:
 *  - 리사이즈 핸들(코너 드래그)로 너비 조절 (가로세로 비율 유지)
 *  - 정렬: left / center / right / full / inline
 *  - 캡션(figcaption): 클릭으로 인라인 편집
 *  - 회전 각도(rotation): 0/90/180/270
 *  - 보더 / 라운드 코너 토글
 *
 * 저장 형태(블로그 본문 sanitizer가 통과시킬 수 있는 평문 HTML):
 *   <figure class="yj-image yj-image-{align}" data-align="..."
 *           style="width:Xpx;text-align:...">
 *     <img src=".." alt=".." width="X" style="..." />
 *     <figcaption>캡션</figcaption>  (optional)
 *   </figure>
 *
 * 캡션이 없고 정렬/너비도 기본값이면 단순 <img>로 출력하여 기존 콘텐츠와 호환.
 */
import { Node, mergeAttributes } from "@tiptap/core";

export const DEFAULT_ALIGN = "none";
export const VALID_ALIGNS = ["none", "left", "center", "right", "full"];
export const MIN_WIDTH_PX = 60;
export const MAX_WIDTH_PX = 1200;

export function clampWidth(value) {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.max(MIN_WIDTH_PX, Math.min(MAX_WIDTH_PX, Math.round(n)));
}

export function normalizeAlign(value) {
  return VALID_ALIGNS.includes(value) ? value : DEFAULT_ALIGN;
}

function styleObjectToString(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== "" && v != null)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

/**
 * 노드 속성 → figure/img DOM 속성 묶음으로 변환
 */
export function buildAttributes(attrs) {
  const align = normalizeAlign(attrs.align);
  const width = clampWidth(attrs.width);
  const rotation = Number(attrs.rotation) || 0;
  const rounded = Boolean(attrs.rounded);
  const bordered = Boolean(attrs.bordered);

  const figureClasses = ["yj-image", `yj-image-${align}`];
  if (rounded) figureClasses.push("yj-image-rounded");
  if (bordered) figureClasses.push("yj-image-bordered");

  const figureStyle = {};
  if (width) figureStyle.width = `${width}px`;
  if (align === "center") figureStyle["text-align"] = "center";

  const imgStyle = {};
  if (width) imgStyle.width = "100%";
  if (rotation) imgStyle.transform = `rotate(${rotation}deg)`;

  return {
    align,
    width,
    rotation,
    rounded,
    bordered,
    figureClass: figureClasses.join(" "),
    figureStyle: styleObjectToString(figureStyle),
    imgStyle: styleObjectToString(imgStyle),
  };
}

export const ResizableImage = Node.create({
  name: "image",
  group: "block",
  /* atom:true — figcaption/리사이즈 핸들은 NodeView가 직접 그리며,
     ProseMirror 입장에서는 leaf 노드로 취급한다.
     이로써 캡션 contentEditable 영역이 ProseMirror 트랜잭션과 충돌하지 않는다. */
  atom: true,
  draggable: true,
  selectable: true,
  isolating: true,

  addOptions() {
    return {
      allowBase64: true,
      uploadEndpoint: "/api/media/upload",
    };
  },

  addAttributes() {
    /* figure 또는 img 자체에서 속성을 추출하기 위한 헬퍼 */
    const innerImg = (el) => (el?.tagName === "IMG" ? el : el?.querySelector?.("img"));

    return {
      src: {
        default: null,
        parseHTML: (el) => innerImg(el)?.getAttribute("src") || null,
      },
      alt: {
        default: null,
        parseHTML: (el) => innerImg(el)?.getAttribute("alt") || null,
      },
      title: {
        default: null,
        parseHTML: (el) => innerImg(el)?.getAttribute("title") || null,
      },
      width: {
        default: null,
        parseHTML: (el) => {
          const target = innerImg(el) || el;
          const raw = target.getAttribute("width") || target.style?.width || el.style?.width;
          if (!raw) return null;
          const num = parseInt(String(raw).replace(/[^0-9]/g, ""), 10);
          return Number.isFinite(num) ? num : null;
        },
        renderHTML: (attrs) => {
          const w = clampWidth(attrs.width);
          return w ? { width: w } : {};
        },
      },
      align: {
        default: DEFAULT_ALIGN,
        parseHTML: (el) => {
          const v = el.getAttribute?.("data-align");
          if (v) return v;
          /* 클래스에서 추출 (yj-image-left 등) */
          const cls = el.className || "";
          for (const a of VALID_ALIGNS) {
            if (cls.split(/\s+/).includes(`yj-image-${a}`)) return a;
          }
          return DEFAULT_ALIGN;
        },
        renderHTML: (attrs) => ({ "data-align": normalizeAlign(attrs.align) }),
      },
      caption: {
        default: "",
        parseHTML: (el) => {
          const cap = el.querySelector?.("figcaption");
          return cap ? (cap.textContent || "").trim() : "";
        },
      },
      rotation: { default: 0, rendered: false },
      rounded: {
        default: false,
        parseHTML: (el) => (el.className || "").split(/\s+/).includes("yj-image-rounded"),
        rendered: false,
      },
      bordered: {
        default: false,
        parseHTML: (el) => (el.className || "").split(/\s+/).includes("yj-image-bordered"),
        rendered: false,
      },
    };
  },

  parseHTML() {
    return [
      { tag: "figure[data-yj-image]" },
      { tag: "figure.yj-image" },
      {
        tag: "img[src]",
        getAttrs: (el) => {
          if (!this.options.allowBase64 && el.getAttribute("src")?.startsWith("data:")) {
            return false;
          }
          return {
            src: el.getAttribute("src"),
            alt: el.getAttribute("alt"),
            title: el.getAttribute("title"),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs;
    const built = buildAttributes(attrs);
    const hasCaption = (attrs.caption || "").trim().length > 0;
    const needsFigure =
      hasCaption ||
      built.align !== DEFAULT_ALIGN ||
      built.width != null ||
      built.rotation !== 0 ||
      built.rounded ||
      built.bordered;

    const imgAttrs = mergeAttributes(
      {
        src: HTMLAttributes.src,
        alt: HTMLAttributes.alt,
        title: HTMLAttributes.title,
        loading: "lazy",
      },
      built.width ? { width: built.width } : {},
      built.imgStyle ? { style: built.imgStyle } : {},
    );

    if (!needsFigure) {
      return ["img", imgAttrs];
    }

    const figureAttrs = {
      class: built.figureClass,
      "data-yj-image": "1",
      "data-align": built.align,
    };
    if (built.figureStyle) figureAttrs.style = built.figureStyle;

    const children = [["img", imgAttrs]];
    if (hasCaption) children.push(["figcaption", {}, attrs.caption]);

    return ["figure", figureAttrs, ...children];
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: options,
          }),
      updateImage:
        (attrs) =>
        ({ commands }) => commands.updateAttributes(this.name, attrs),
      setImageAlign:
        (align) =>
        ({ commands }) => commands.updateAttributes(this.name, { align: normalizeAlign(align) }),
      setImageWidth:
        (width) =>
        ({ commands }) => commands.updateAttributes(this.name, { width: clampWidth(width) }),
      setImageCaption:
        (caption) =>
        ({ commands }) => commands.updateAttributes(this.name, { caption: String(caption || "") }),
      rotateImage:
        (deltaDeg = 90) =>
        ({ commands, state }) => {
          const node = findSelectedImageNode(state);
          const current = Number(node?.attrs?.rotation) || 0;
          const next = ((current + deltaDeg) % 360 + 360) % 360;
          return commands.updateAttributes(this.name, { rotation: next });
        },
      toggleImageRounded:
        () =>
        ({ commands, state }) => {
          const node = findSelectedImageNode(state);
          return commands.updateAttributes(this.name, { rounded: !node?.attrs?.rounded });
        },
      toggleImageBordered:
        () =>
        ({ commands, state }) => {
          const node = findSelectedImageNode(state);
          return commands.updateAttributes(this.name, { bordered: !node?.attrs?.bordered });
        },
    };
  },

  addNodeView() {
    return ({ node, editor, getPos }) => createImageNodeView({ node, editor, getPos });
  },
});

/**
 * 현재 선택된 이미지 노드를 찾는다 (NodeSelection이거나 커서가 이미지 위에 있을 때)
 */
function findSelectedImageNode(state) {
  const { selection } = state;
  if (selection?.node?.type?.name === "image") return selection.node;
  return null;
}

/**
 * 이미지 NodeView — 리사이즈 핸들 + 인라인 캡션 편집
 */
function createImageNodeView({ node, editor, getPos }) {
  const figure = document.createElement("figure");
  const img = document.createElement("img");
  const caption = document.createElement("figcaption");
  const handles = createResizeHandles();

  let currentNode = node;

  function applyAttrs(n) {
    const built = buildAttributes(n.attrs);
    figure.className = `${built.figureClass} yj-image-nodeview`;
    figure.setAttribute("data-yj-image", "1");
    figure.setAttribute("data-align", built.align);
    figure.style.cssText = built.figureStyle;

    /* src 비교 후에만 갱신 — 동일한 src를 다시 set하면 깜빡임 발생 */
    if (img.getAttribute("src") !== (n.attrs.src || "")) {
      img.src = n.attrs.src || "";
    }
    img.alt = n.attrs.alt || "";
    if (n.attrs.title) img.title = n.attrs.title;
    else img.removeAttribute("title");
    img.style.cssText = built.imgStyle;
    img.draggable = false; // 네이티브 이미지 드래그 비활성화 (NodeView 클릭/드래그 안정화)
    if (built.width) img.setAttribute("width", String(built.width));
    else img.removeAttribute("width");

    /* 캡션이 현재 포커스되어 있으면 사용자 입력을 보존 — 외부 트랜잭션이
       캡션 외 속성을 변경할 때 캡션 텍스트가 되돌아가지 않도록 한다 */
    const captionFocused = document.activeElement === caption;
    const cap = (n.attrs.caption || "").trim();
    if (!captionFocused) {
      if (cap || editor.isEditable) {
        caption.style.display = cap || figure.classList.contains("is-selected") ? "block" : "none";
        caption.textContent = cap;
        caption.dataset.placeholder = "캡션을 입력하세요…";
      } else {
        caption.style.display = "none";
      }
    }
  }

  figure.appendChild(img);
  figure.appendChild(caption);
  for (const handle of handles.elements) figure.appendChild(handle);
  figure.contentEditable = "false";

  caption.contentEditable = editor.isEditable ? "true" : "false";
  caption.spellcheck = false;
  caption.addEventListener("focus", () => figure.classList.add("is-caption-editing"));
  caption.addEventListener("blur", () => {
    figure.classList.remove("is-caption-editing");
    const next = (caption.textContent || "").trim();
    if (next !== (currentNode.attrs.caption || "").trim()) {
      const pos = typeof getPos === "function" ? getPos() : null;
      if (pos != null) {
        const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
          ...currentNode.attrs,
          caption: next,
        });
        editor.view.dispatch(tr);
      }
    }
  });

  /* 이미지 클릭 시 노드 선택 — 플로팅 툴바가 이미지 모드로 전환됨.
     img 뿐 아니라 figure 영역(여백/테두리 포함)에서도 선택 가능하도록 한다.
     단 캡션/리사이즈 핸들은 자체 핸들러가 처리하므로 제외 */
  const selectThisNode = (e) => {
    if (e.target === caption || caption.contains(e.target)) return;
    if (e.target?.classList?.contains?.("yj-image-handle")) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = typeof getPos === "function" ? getPos() : null;
    if (pos == null) return;
    editor.view.focus();
    editor.commands.setNodeSelection(pos);
  };
  figure.addEventListener("mousedown", selectThisNode);

  /* 코너 드래그 리사이즈 — 가로세로 비율 유지 */
  bindResizeHandles(handles, {
    figure,
    img,
    onCommit: (newWidth) => {
      const pos = typeof getPos === "function" ? getPos() : null;
      if (pos == null) return;
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.setNodeMarkup(pos, undefined, { ...currentNode.attrs, width: clampWidth(newWidth) });
          return true;
        })
        .run();
    },
  });

  applyAttrs(node);

  return {
    dom: figure,
    update(updatedNode) {
      if (updatedNode.type.name !== node.type.name) return false;
      currentNode = updatedNode;
      applyAttrs(updatedNode);
      return true;
    },
    selectNode() {
      figure.classList.add("is-selected");
      applyAttrs(currentNode);
    },
    deselectNode() {
      figure.classList.remove("is-selected");
      applyAttrs(currentNode);
    },
    ignoreMutation(mutation) {
      if (figure.contains(mutation.target) && mutation.target !== caption) return true;
      if (mutation.type === "attributes" && mutation.target === caption) return true;
      return false;
    },
    stopEvent(event) {
      /* 캡션 편집/리사이즈 중에는 ProseMirror 이벤트 전파 차단 */
      if (event.target === caption || caption.contains(event.target)) return true;
      if (event.target?.classList?.contains("yj-image-handle")) return true;
      return false;
    },
    destroy() {
      handles.destroy();
    },
  };
}

function createResizeHandles() {
  const positions = ["nw", "ne", "sw", "se"];
  const elements = positions.map((pos) => {
    const el = document.createElement("span");
    el.className = `yj-image-handle yj-image-handle-${pos}`;
    el.dataset.position = pos;
    return el;
  });
  return {
    elements,
    destroy() {
      for (const el of elements) el.remove();
    },
  };
}

function bindResizeHandles(handles, { figure, img, onCommit }) {
  for (const handle of handles.elements) {
    handle.addEventListener("mousedown", startResize);
  }

  function startResize(e) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = img.getBoundingClientRect().width || img.naturalWidth || 400;
    const naturalRatio = img.naturalHeight / Math.max(img.naturalWidth || 1, 1);
    const direction = e.currentTarget.dataset.position.includes("e") ? 1 : -1;

    figure.classList.add("is-resizing");

    let nextWidth = startWidth;

    function onMove(ev) {
      const dx = (ev.clientX - startX) * direction;
      nextWidth = clampWidth(startWidth + dx) || MIN_WIDTH_PX;
      figure.style.width = `${nextWidth}px`;
      img.style.width = "100%";
      img.style.height = naturalRatio ? `${nextWidth * naturalRatio}px` : "auto";
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      figure.classList.remove("is-resizing");
      img.style.height = "";
      onCommit(nextWidth);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }
}

export default ResizableImage;
