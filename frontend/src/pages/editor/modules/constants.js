/**
 * Word 스타일 에디터에서 사용하는 모든 상수 정의
 * - 문서 유형, 글꼴, 크기, 여백, 용지, 스타일 프리셋
 * - 테두리, 표, 테마, 번호매기기, 워터마크, 수식 기호 등
 * - 도형, WordArt, 단축키, 리본 탭, 상태 표시줄, 변경 추적 등
 */

/* ── 문서 유형 ── */
export const DOC_TYPES = [
  { value: "blog", label: "블로그" },
  { value: "guide", label: "가이드" },
  { value: "law", label: "법률" },
  { value: "statute", label: "법령" },
  { value: "case_law", label: "판례" },
  { value: "article", label: "아티클" },
  { value: "memo", label: "메모" },
  { value: "reference", label: "참고자료" },
  { value: "textbook", label: "교과서" },
  { value: "book", label: "서적" },
  { value: "paper", label: "논문" },
  { value: "news", label: "뉴스" },
];

/* ── 문서 출처/상태 표시 ── */
export const DOC_SOURCE_META = {
  blog: { label: "Blog", color: "#2563eb", background: "#dbeafe", border: "#bfdbfe" },
  document: { label: "Doc", color: "#475569", background: "#f1f5f9", border: "#cbd5e1" },
};

export const DOC_STATUS_META = {
  draft: { label: "초안", color: "#92400e", background: "#fef3c7", border: "#fde68a" },
  published: { label: "발행", color: "#166534", background: "#dcfce7", border: "#bbf7d0" },
  scheduled: { label: "예약", color: "#075985", background: "#e0f2fe", border: "#bae6fd" },
  archived: { label: "보관", color: "#64748b", background: "#f1f5f9", border: "#cbd5e1" },
  unread: { label: "미확인", color: "#475569", background: "#f8fafc", border: "#cbd5e1" },
  reading: { label: "읽는중", color: "#1d4ed8", background: "#dbeafe", border: "#bfdbfe" },
  completed: { label: "완료", color: "#166534", background: "#dcfce7", border: "#bbf7d0" },
};

/* ── 블로그 카테고리 ── */
export const BLOG_CATEGORIES = [
  { value: "construction_realestate", label: "하이로 뉴스" },
  { value: "case_analysis", label: "판례 분석" },
  { value: "law_guide", label: "법률 가이드" },
];

export const PRACTICE_AREAS = [
  { value: "", label: "업무분야 없음 (일반 게시글)" },
  { value: "illegal-dispatch", label: "불법파견" },
  { value: "game-fraud", label: "게임사기" },
  { value: "military", label: "군사건" },
  { value: "civil", label: "민사" },
  { value: "criminal", label: "형사" },
  { value: "labor", label: "노동" },
  { value: "serious-accident", label: "중대재해" },
  { value: "corporate", label: "기업/법인" },
  { value: "defense", label: "국방/방산" },
  { value: "military-criminal", label: "군형사" },
  { value: "entertainment", label: "엔터테인먼트" },
  { value: "administrative", label: "행정" },
  { value: "family", label: "가사" },
  { value: "intellectual-property", label: "지식재산권" },
  { value: "immigration", label: "출입국/외국인" },
];

/* ── 빈 문서 기본값 ── */
export const EMPTY_DOC = {
  title: "",
  documentType: "article",
  blogCategory: "construction_realestate",
  subtitle: "",
  author: "",
  source: "",
  publishedDate: "",
  contentMarkdown: "",
  summary: "",
  thumbnailUrl: "",
  tags: "",
  slug: "",
  scheduledPublishAt: "",
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
  ogImageUrl: "",
  geoSummary: "",
  geoFaq: "",
  geoKeywords: "",
  status: "draft",
  importance: 3,
};

/* ── 글꼴 목록 (한글 → 영문 순, 총 25종 이상) ── */
export const FONT_LIST = [
  /* 한글 글꼴 */
  { value: "malgun", label: "맑은 고딕", family: "'맑은 고딕', 'Malgun Gothic', sans-serif" },
  { value: "batang", label: "바탕", family: "'바탕', Batang, serif" },
  { value: "dotum", label: "돋움", family: "'돋움', Dotum, sans-serif" },
  { value: "gulim", label: "굴림", family: "'굴림', Gulim, sans-serif" },
  { value: "gungsuh", label: "궁서", family: "'궁서', Gungsuh, serif" },
  { value: "hancom-batang", label: "한컴바탕", family: "'한컴바탕', '한컴 바탕', serif" },
  { value: "hancom-dotum", label: "한컴돋움", family: "'한컴돋움', '한컴 돋움', sans-serif" },
  { value: "nanum-gothic", label: "나눔고딕", family: "'나눔고딕', 'NanumGothic', sans-serif" },
  { value: "nanum-myeongjo", label: "나눔명조", family: "'나눔명조', 'NanumMyeongjo', serif" },
  { value: "nanum-barun", label: "나눔바른고딕", family: "'나눔바른고딕', 'NanumBarunGothic', sans-serif" },
  { value: "noto-sans", label: "Noto Sans KR", family: "'Noto Sans KR', sans-serif" },
  { value: "noto-serif", label: "Noto Serif KR", family: "'Noto Serif KR', serif" },
  /* 영문 글꼴 */
  { value: "arial", label: "Arial", family: "Arial, Helvetica, sans-serif" },
  { value: "calibri", label: "Calibri", family: "Calibri, 'Segoe UI', sans-serif" },
  { value: "cambria", label: "Cambria", family: "Cambria, Georgia, serif" },
  { value: "comic-sans", label: "Comic Sans MS", family: "'Comic Sans MS', cursive, sans-serif" },
  { value: "consolas", label: "Consolas", family: "Consolas, 'Courier New', monospace" },
  { value: "courier", label: "Courier New", family: "'Courier New', Courier, monospace" },
  { value: "georgia", label: "Georgia", family: "Georgia, serif" },
  { value: "impact", label: "Impact", family: "Impact, 'Arial Black', sans-serif" },
  { value: "lucida-console", label: "Lucida Console", family: "'Lucida Console', Monaco, monospace" },
  { value: "tahoma", label: "Tahoma", family: "Tahoma, Geneva, sans-serif" },
  { value: "times", label: "Times New Roman", family: "'Times New Roman', Times, serif" },
  { value: "trebuchet", label: "Trebuchet MS", family: "'Trebuchet MS', Helvetica, sans-serif" },
  { value: "verdana", label: "Verdana", family: "Verdana, Geneva, sans-serif" },
];

/* ── 글꼴 크기 (pt) ── */
export const FONT_SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 28, 36, 48, 72];

/* ── 줄 간격 ── */
export const LINE_SPACINGS = [
  { value: "1", label: "1.0" },
  { value: "1.15", label: "1.15" },
  { value: "1.5", label: "1.5" },
  { value: "2", label: "2.0" },
  { value: "2.5", label: "2.5" },
  { value: "3", label: "3.0" },
];

/* ── 여백 프리셋 (px 단위) ── */
export const MARGIN_PRESETS = [
  { value: "narrow", label: "좁게", desc: "상하좌우 1.27cm", top: 48, bottom: 48, left: 48, right: 48 },
  { value: "normal", label: "보통", desc: "상하 2.54cm, 좌우 3.17cm", top: 96, bottom: 96, left: 120, right: 120 },
  { value: "wide", label: "넓게", desc: "상하 2.54cm, 좌우 5.08cm", top: 96, bottom: 96, left: 192, right: 192 },
  { value: "mirrored", label: "대칭", desc: "안쪽 3.17cm, 바깥쪽 2.54cm", top: 96, bottom: 96, left: 120, right: 96 },
];

/* ── 용지 크기 (px 단위, 96dpi 기준) ── */
export const PAGE_SIZES = [
  { value: "a4", label: "A4", width: 794, height: 1123, desc: "210 × 297 mm" },
  { value: "letter", label: "Letter", width: 816, height: 1056, desc: "215.9 × 279.4 mm" },
  { value: "legal", label: "Legal", width: 816, height: 1344, desc: "215.9 × 355.6 mm" },
  { value: "b5", label: "B5", width: 665, height: 945, desc: "176 × 250 mm" },
];

/* ── 스타일 프리셋 (제목, 본문, 인용 등) ── */
export const STYLE_PRESETS = [
  { id: "normal", label: "표준", tag: "p", fontSize: "11pt", fontWeight: 400, color: "#333", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "no-spacing", label: "간격없음", tag: "p", fontSize: "11pt", fontWeight: 400, color: "#333", lineHeight: "1.0", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "heading1", label: "제목 1", tag: "h1", fontSize: "16pt", fontWeight: 600, color: "#1e3a5f", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "heading2", label: "제목 2", tag: "h2", fontSize: "13pt", fontWeight: 600, color: "#1e3a5f", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "heading3", label: "제목 3", tag: "h3", fontSize: "12pt", fontWeight: 600, color: "#1f4e79", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "heading4", label: "제목 4", tag: "h4", fontSize: "11pt", fontWeight: 600, color: "#1f4e79", fontStyle: "italic", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "title", label: "제목", tag: "h1", fontSize: "26pt", fontWeight: 300, color: "#333", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "subtitle", label: "부제", tag: "h2", fontSize: "14pt", fontWeight: 400, color: "#777", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "quote", label: "인용", tag: "blockquote", fontSize: "11pt", fontWeight: 400, color: "#555", fontStyle: "italic", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "intense-quote", label: "강한 인용", tag: "blockquote", fontSize: "11pt", fontWeight: 600, color: "#3b82f6", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "list-paragraph", label: "목록 단락", tag: "p", fontSize: "11pt", fontWeight: 400, color: "#333", fontFamily: "'맑은 고딕', sans-serif", marginLeft: "36pt" },
  { id: "emphasis", label: "강조", tag: "p", fontSize: "11pt", fontWeight: 400, color: "#333", fontStyle: "italic", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "strong", label: "진하게", tag: "p", fontSize: "11pt", fontWeight: 700, color: "#333", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "book-title", label: "책 제목", tag: "p", fontSize: "11pt", fontWeight: 700, color: "#333", fontStyle: "italic", fontVariant: "small-caps", letterSpacing: "0.5pt", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "subtle-emphasis", label: "은은한 강조", tag: "p", fontSize: "11pt", fontWeight: 400, color: "#999", fontStyle: "italic", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "intense-emphasis", label: "뚜렷한 강조", tag: "p", fontSize: "11pt", fontWeight: 700, color: "#4472C4", fontStyle: "italic", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "subtle-reference", label: "은은한 참조", tag: "p", fontSize: "11pt", fontWeight: 400, color: "#333", fontVariant: "small-caps", borderBottom: "1px solid #c0c0c0", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "toc-heading", label: "목차 제목", tag: "h1", fontSize: "16pt", fontWeight: 600, color: "#4472C4", fontFamily: "'맑은 고딕', sans-serif" },
];

/* ── 밑줄 스타일 ── */
export const UNDERLINE_STYLES = [
  { value: "solid", label: "───────", css: "underline" },
  { value: "double", label: "═══════", css: "underline double" },
  { value: "dotted", label: "· · · · · · ·", css: "underline dotted" },
  { value: "dashed", label: "- - - - - - -", css: "underline dashed" },
  { value: "wavy", label: "∿∿∿∿∿∿∿", css: "underline wavy" },
];

/* ── 특수 문자 ── */
export const SPECIAL_CHARS = [
  { category: "기호", chars: ["©", "®", "™", "§", "¶", "†", "‡", "•", "‣", "⁂", "※", "℗", "℠", "℃", "℉", "Å", "Ω", "µ", "∞", "≈", "≠", "≤", "≥", "±", "×", "÷", "√", "∑", "∏", "∫", "∂", "∇", "∆"] },
  { category: "화살표", chars: ["←", "→", "↑", "↓", "↔", "↕", "⇐", "⇒", "⇑", "⇓", "⇔", "↗", "↘", "↙", "↖", "➜", "➤", "➔", "➡"] },
  { category: "도형", chars: ["■", "□", "▪", "▫", "●", "○", "◆", "◇", "▲", "△", "▼", "▽", "◀", "▶", "★", "☆", "♠", "♣", "♥", "♦", "♤", "♧", "♡", "♢"] },
  { category: "괄호", chars: ["「", "」", "『", "』", "【", "】", "〔", "〕", "〈", "〉", "《", "》", "〖", "〗", "⌜", "⌝", "⌞", "⌟"] },
  { category: "수학", chars: ["∀", "∃", "∈", "∉", "∋", "∪", "∩", "⊂", "⊃", "⊆", "⊇", "⊕", "⊗", "⊥", "∠", "∟", "∥", "⌀", "∝", "∴", "∵", "∎"] },
  { category: "통화", chars: ["₩", "¥", "€", "£", "$", "¢", "₤", "₱", "₹", "₽", "₺", "฿", "₿", "₫", "₡", "₣", "₦", "₮", "₯", "₰"] },
  { category: "한글 자모", chars: ["ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄸ", "ㄹ", "ㅀ", "ㅁ", "ㅂ", "ㅃ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] },
  { category: "원문자/괄호숫자", chars: ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱", "⑲", "⑳", "㉠", "㉡", "㉢", "㉣", "㉤", "㉥", "㉦", "㉧", "㉨", "㉩", "㉮", "㉯", "㉰", "㉱", "㉲"] },
  { category: "음악/기타", chars: ["♩", "♪", "♫", "♬", "♭", "♮", "♯", "☀", "☁", "☂", "☃", "☎", "☏", "✂", "✈", "✉", "✎", "✏", "✓", "✕", "✗", "✘", "✚", "❤", "❖", "❝", "❞"] },
  { category: "로마숫자", chars: ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ", "Ⅺ", "Ⅻ", "ⅰ", "ⅱ", "ⅲ", "ⅳ", "ⅴ", "ⅵ", "ⅶ", "ⅷ", "ⅸ", "ⅹ"] },
];

/* ── 형광펜 색상 ── */
export const HIGHLIGHT_COLORS = [
  "#fef3b5", "#fde047", "#fdba74", "#fca5a5", "#f9a8d4",
  "#d8b4fe", "#93c5fd", "#86efac", "#6ee7b7", "#99f6e4",
  "#fecaca", "#fed7aa", "#fef08a", "#bbf7d0", "#bfdbfe",
];

/* ── 텍스트 색상 팔레트 ── */
export const TEXT_COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff",
  "#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
  "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc",
  "#dd7e6b", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#9fc5e8", "#b4a7d6", "#d5a6bd",
  "#cc4125", "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6d9eeb", "#6fa8dc", "#8e7cc3", "#c27ba0",
  "#a61c00", "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3c78d8", "#3d85c6", "#674ea7", "#a64d79",
  "#85200c", "#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#1155cc", "#0b5394", "#351c75", "#741b47",
  "#5b0f00", "#660000", "#783f04", "#7f6000", "#274e13", "#0c343d", "#1c4587", "#073763", "#20124d", "#4c1130",
];

/* ── 문서 유형별 트리 분류 번호 ── */
export const TYPE_NUMBERS = {
  "blog": "000",
  "news": "200", "statute": "300", "case_law": "400",
  "paper": "500", "textbook": "600", "book": "700",
};

/* ================================================================
 *  아래부터 새로 추가된 상수
 * ================================================================ */

/* ── 1. 테두리 스타일 (Word 365 호환) ── */
export const BORDER_STYLES = [
  { value: "none", label: "없음", css: "none" },
  { value: "solid", label: "실선 ───", css: "solid" },
  { value: "dashed", label: "파선 - - -", css: "dashed" },
  { value: "dotted", label: "점선 · · ·", css: "dotted" },
  { value: "double", label: "이중선 ═══", css: "double" },
  { value: "groove", label: "홈 파기", css: "groove" },
  { value: "ridge", label: "돌출", css: "ridge" },
  { value: "inset", label: "안으로", css: "inset" },
  { value: "outset", label: "밖으로", css: "outset" },
  { value: "dash-dot", label: "일점쇄선 -·-·", css: "dashed" },
  { value: "dash-dot-dot", label: "이점쇄선 -··-··", css: "dotted" },
  { value: "thin-thick", label: "가는선-굵은선", css: "double" },
  { value: "thick-thin", label: "굵은선-가는선", css: "double" },
  { value: "wave", label: "물결선 ∿∿∿", css: "solid" },
];

/* ── 2. 테두리 두께 (px) ── */
export const BORDER_WIDTHS = [0.5, 1, 1.5, 2, 3, 4, 6];

/* ── 3. 표 스타일 프리셋 ── */
export const TABLE_STYLES = [
  { id: "plain", label: "표 눈금", headerBg: "#f1f5f9", borderColor: "#ccc" },
  { id: "elegant", label: "우아한 표", headerBg: "#1e3a5f", headerColor: "#fff", borderColor: "#1e3a5f", stripedBg: "#f8fafc" },
  { id: "simple1", label: "간단한 표 1", headerBg: "transparent", borderColor: "#000", headerBorderBottom: "2px solid #000" },
  { id: "simple2", label: "간단한 표 2", headerBg: "transparent", borderColor: "#999", headerBorderBottom: "1px solid #999" },
  { id: "grid-blue", label: "눈금(파랑)", headerBg: "#2563eb", headerColor: "#fff", borderColor: "#93c5fd", stripedBg: "#eff6ff" },
  { id: "grid-green", label: "눈금(초록)", headerBg: "#16a34a", headerColor: "#fff", borderColor: "#86efac", stripedBg: "#f0fdf4" },
  { id: "grid-red", label: "눈금(빨강)", headerBg: "#dc2626", headerColor: "#fff", borderColor: "#fca5a5", stripedBg: "#fef2f2" },
  { id: "grid-purple", label: "눈금(보라)", headerBg: "#7c3aed", headerColor: "#fff", borderColor: "#c4b5fd", stripedBg: "#f5f3ff" },
  { id: "list-blue", label: "목록(파랑)", headerBg: "transparent", headerColor: "#2563eb", borderColor: "#2563eb", headerBorderBottom: "2px solid #2563eb" },
  { id: "list-green", label: "목록(초록)", headerBg: "transparent", headerColor: "#16a34a", borderColor: "#16a34a", headerBorderBottom: "2px solid #16a34a" },
  { id: "grid-table", label: "표 격자", headerBg: "#f8f9fa", headerColor: "#333", borderColor: "#dee2e6", stripedBg: "#f8f9fa" },
  { id: "table-list-light", label: "표 목록 - 밝게", headerBg: "transparent", headerColor: "#495057", borderColor: "#e9ecef", headerBorderBottom: "2px solid #495057" },
  { id: "table-list-dark", label: "표 목록 - 어둡게", headerBg: "#343a40", headerColor: "#fff", borderColor: "#495057", stripedBg: "#f8f9fa" },
  { id: "plain-table-1", label: "일반 표 1", headerBg: "transparent", headerColor: "#333", borderColor: "#d0d0d0" },
  { id: "plain-table-2", label: "일반 표 2", headerBg: "transparent", headerColor: "#333", borderColor: "#adb5bd", headerBorderBottom: "1px solid #adb5bd", stripedBg: "#f8f9fa" },
  { id: "plain-table-3", label: "일반 표 3", headerBg: "transparent", headerColor: "#333", borderColor: "transparent", headerBorderTop: "2px solid #333", headerBorderBottom: "2px solid #333" },
  { id: "grid-accent1", label: "눈금 표 - 강조 1", headerBg: "#4472C4", headerColor: "#fff", borderColor: "#8FAADC", stripedBg: "#D6E4F0" },
  { id: "grid-accent2", label: "눈금 표 - 강조 2", headerBg: "#ED7D31", headerColor: "#fff", borderColor: "#F4B183", stripedBg: "#FBE5D6" },
  { id: "grid-accent3", label: "눈금 표 - 강조 3", headerBg: "#A5A5A5", headerColor: "#fff", borderColor: "#C9C9C9", stripedBg: "#EDEDED" },
  { id: "grid-accent4", label: "눈금 표 - 강조 4", headerBg: "#FFC000", headerColor: "#fff", borderColor: "#FFD966", stripedBg: "#FFF2CC" },
];

/* ── 4. 단락 음영 배경색 (파스텔 계열) ── */
export const PARAGRAPH_SHADING_COLORS = [
  "#fff8e1", "#fff3e0", "#fce4ec", "#f3e5f5", "#ede7f6",
  "#e8eaf6", "#e3f2fd", "#e1f5fe", "#e0f7fa", "#e0f2f1",
  "#e8f5e9", "#f1f8e9", "#f9fbe7", "#fffde7", "#fafafa",
  "#eceff1", "#fbe9e7", "#efebe9", "#f5f5f5", "#ffffff",
];

/* ── 5. 텍스트 효과 프리셋 ── */
export const TEXT_EFFECTS = [
  { id: "none", label: "없음", style: {} },
  { id: "shadow", label: "그림자", style: { textShadow: "1px 1px 2px rgba(0,0,0,0.3)" } },
  { id: "outline", label: "윤곽선", style: { WebkitTextStroke: "0.5px #333" } },
  { id: "emboss", label: "양각", style: { textShadow: "-1px -1px 0 rgba(255,255,255,0.5), 1px 1px 0 rgba(0,0,0,0.3)" } },
  { id: "engrave", label: "음각", style: { textShadow: "1px 1px 0 rgba(255,255,255,0.5), -1px -1px 0 rgba(0,0,0,0.3)" } },
  { id: "glow-blue", label: "파란빛", style: { textShadow: "0 0 4px #3b82f6, 0 0 8px rgba(59,130,246,0.3)" } },
  { id: "glow-gold", label: "금빛", style: { textShadow: "0 0 4px #f59e0b, 0 0 8px rgba(245,158,11,0.3)" } },
];

/* ── 6. 문서 테마 ── */
export const DOCUMENT_THEMES = [
  { id: "office", label: "Office", primary: "#4472C4", secondary: "#ED7D31", accent1: "#A5A5A5", accent2: "#FFC000", accent3: "#5B9BD5", headingFont: "'맑은 고딕'", bodyFont: "'맑은 고딕'" },
  { id: "elegant", label: "우아한", primary: "#1e3a5f", secondary: "#6366f1", accent1: "#8b7355", accent2: "#c4a882", headingFont: "'Noto Serif KR'", bodyFont: "'맑은 고딕'" },
  { id: "modern", label: "모던", primary: "#2563eb", secondary: "#0891b2", accent1: "#7c3aed", accent2: "#059669", headingFont: "'Noto Sans KR'", bodyFont: "'Noto Sans KR'" },
  { id: "classic", label: "클래식", primary: "#333333", secondary: "#666666", accent1: "#999999", accent2: "#cccccc", headingFont: "'바탕'", bodyFont: "'바탕'" },
  { id: "nature", label: "자연", primary: "#15803d", secondary: "#854d0e", accent1: "#166534", accent2: "#a16207", headingFont: "'Noto Sans KR'", bodyFont: "'맑은 고딕'" },
];

/* ── 7. 다단계 번호매기기 스타일 ── */
export const NUMBERING_STYLES = [
  { id: "decimal", label: "1, 2, 3", levels: ["1.", "  1)", "    (1)", "      ①"] },
  { id: "alpha-upper", label: "A, B, C", levels: ["A.", "  a)", "    (a)", "      ⓐ"] },
  { id: "roman", label: "I, II, III", levels: ["I.", "  i)", "    (i)", "      (a)"] },
  { id: "korean", label: "가, 나, 다", levels: ["가.", "  1)", "    가)", "      (1)"] },
  { id: "outline", label: "제1장", levels: ["제1장", "  제1절", "    1.", "      가."] },
  { id: "legal", label: "1. 1.1 1.1.1", levels: ["1.", "  1.1.", "    1.1.1.", "      1.1.1.1."] },
];

/* ── 8. 페이지 테두리 스타일 ── */
export const PAGE_BORDER_STYLES = [
  { id: "box", label: "상자", style: "solid" },
  { id: "shadow", label: "그림자", style: "solid", shadow: true },
  { id: "3d", label: "3차원", style: "outset" },
  { id: "custom", label: "사용자 지정", style: "solid" },
];

/* ── 9. 워터마크 프리셋 텍스트 ── */
export const WATERMARK_PRESETS = [
  "긴급", "대외비", "초안", "샘플", "사본",
  "보안", "비밀", "원본", "검토용", "최종",
];

/* ── 10. 머리글/바닥글 프리셋 레이아웃 (Word 365 호환) ── */
export const HEADER_FOOTER_PRESETS = [
  { id: "blank", label: "비어있음", layout: { left: "", center: "", right: "" } },
  { id: "title-only", label: "제목만", layout: { left: "{title}", center: "", right: "" } },
  { id: "title-date", label: "제목 + 날짜", layout: { left: "{title}", center: "", right: "{date}" } },
  { id: "title-page", label: "제목 + 페이지", layout: { left: "{title}", center: "", right: "{page}" } },
  { id: "page-center", label: "페이지 번호 (가운데)", layout: { left: "", center: "{page}", right: "" } },
  { id: "page-right", label: "페이지 번호 (오른쪽)", layout: { left: "", center: "", right: "{page}" } },
  { id: "author-date", label: "작성자 + 날짜", layout: { left: "{author}", center: "", right: "{date}" } },
  { id: "confidential", label: "기밀 문서", layout: { left: "기밀", center: "{title}", right: "{date}" } },
  { id: "page-of-total", label: "페이지 X/Y", layout: { left: "", center: "", right: "{page}/{totalPages}" } },
  { id: "line-separator", label: "구분선 포함", layout: { left: "{title}", center: "", right: "{page}" }, borderBottom: true },
  { id: "logo-title", label: "로고 + 제목", layout: { left: "{logo}", center: "{title}", right: "" } },
  { id: "date-page-center", label: "날짜 + 페이지 (가운데)", layout: { left: "", center: "{date} | {page}/{totalPages}", right: "" } },
];

/* ── 11. 수식 기호 (카테고리별 그룹) ── */
export const EQUATION_SYMBOLS = [
  { category: "그리스 문자", chars: ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ", "λ", "μ", "ν", "ξ", "π", "ρ", "σ", "τ", "υ", "φ", "χ", "ψ", "ω", "Γ", "Δ", "Θ", "Λ", "Ξ", "Π", "Σ", "Φ", "Ψ", "Ω"] },
  { category: "연산자", chars: ["±", "×", "÷", "∓", "⊕", "⊗", "⊙", "∘", "·", "⋅", "∗", "⋆", "†", "‡"] },
  { category: "관계", chars: ["=", "≠", "<", ">", "≤", "≥", "≪", "≫", "≈", "≅", "≡", "∝", "∼", "≃"] },
  { category: "집합", chars: ["∈", "∉", "⊂", "⊃", "⊆", "⊇", "∪", "∩", "∅", "∖", "⊄", "⊈", "⊊"] },
  { category: "논리", chars: ["∧", "∨", "¬", "⇒", "⇔", "∀", "∃", "∄", "⊢", "⊨", "⊤", "⊥"] },
  { category: "미적분", chars: ["∫", "∬", "∮", "∑", "∏", "∂", "∇", "∞", "lim", "dx", "dy"] },
  { category: "행렬/괄호", chars: ["⌈", "⌉", "⌊", "⌋", "⟨", "⟩", "‖", "⟦", "⟧", "⎡", "⎤", "⎣", "⎦"] },
];

/* ── 12. 찾기/바꾸기 고급 옵션 기본값 ── */
export const FIND_REPLACE_OPTIONS = {
  matchCase: false,
  wholeWord: false,
  useRegex: false,
  matchFormat: false,
};

/* ================================================================
 *  Word 365 추가 상수
 * ================================================================ */

/* ── 13. 번호매기기 형식 (Word 365 호환) ── */
export const NUMBERING_FORMATS = [
  { id: "decimal", label: "1, 2, 3", prefix: "", suffix: ".", generate: (n) => String(n) },
  { id: "lower-alpha", label: "a, b, c", prefix: "", suffix: ".", generate: (n) => String.fromCharCode(96 + n) },
  { id: "upper-alpha", label: "A, B, C", prefix: "", suffix: ".", generate: (n) => String.fromCharCode(64 + n) },
  { id: "lower-roman", label: "i, ii, iii", prefix: "", suffix: ".", generate: (n) => toRomanLower(n) },
  { id: "upper-roman", label: "I, II, III", prefix: "", suffix: ".", generate: (n) => toRomanUpper(n) },
  { id: "korean-ga", label: "가, 나, 다", prefix: "", suffix: ".", generate: (n) => "가나다라마바사아자차카타파하"[n - 1] || String(n) },
  { id: "korean-consonant", label: "ㄱ, ㄴ, ㄷ", prefix: "", suffix: ".", generate: (n) => "ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ"[n - 1] || String(n) },
  { id: "circled", label: "①, ②, ③", prefix: "", suffix: "", generate: (n) => String.fromCharCode(9311 + n) },
  { id: "parenthesized", label: "(1), (2), (3)", prefix: "(", suffix: ")", generate: (n) => String(n) },
  { id: "bracket-alpha", label: "(a), (b), (c)", prefix: "(", suffix: ")", generate: (n) => String.fromCharCode(96 + n) },
];

/**
 * 로마숫자 변환 헬퍼 (소문자)
 * @param {number} num - 변환할 양의 정수
 * @returns {string} 로마숫자 소문자 문자열
 */
function toRomanLower(num) {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ["m", "cm", "d", "cd", "c", "xc", "l", "xl", "x", "ix", "v", "iv", "i"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) {
      result += syms[i];
      num -= vals[i];
    }
  }
  return result;
}

/**
 * 로마숫자 변환 헬퍼 (대문자)
 * @param {number} num - 변환할 양의 정수
 * @returns {string} 로마숫자 대문자 문자열
 */
function toRomanUpper(num) {
  return toRomanLower(num).toUpperCase();
}

/* ── 14. 빠른 문서 요소 (Quick Parts) ── */
export const QUICK_PARTS = [
  { id: "cover-page", label: "표지", category: "문서 구성", description: "문서 표지 삽입", content: "<h1 style='text-align:center;margin-top:40%;font-size:28pt;'>{title}</h1><p style='text-align:center;font-size:14pt;color:#666;'>{subtitle}</p><p style='text-align:center;margin-top:20%;'>{author}<br/>{date}</p>" },
  { id: "toc-placeholder", label: "목차", category: "문서 구성", description: "자동 목차 자리표시자", content: "<h1 style='color:#4472C4;'>목차</h1><p style='color:#999;'>[자동 목차가 여기에 생성됩니다]</p>" },
  { id: "date-field", label: "날짜 필드", category: "필드", description: "현재 날짜 삽입", content: "{date}" },
  { id: "author-field", label: "작성자 필드", category: "필드", description: "문서 작성자 삽입", content: "{author}" },
  { id: "page-break", label: "페이지 나누기", category: "구조", description: "페이지 나누기 삽입", content: "<div style='page-break-after:always;'></div>" },
  { id: "section-break", label: "구역 나누기", category: "구조", description: "구역 나누기 삽입", content: "<hr style='border:none;border-top:1px solid #ccc;margin:24pt 0;'/>" },
  { id: "signature-block", label: "서명란", category: "법률", description: "서명란 삽입", content: "<div style='margin-top:48pt;'><p style='border-top:1px solid #333;width:200px;padding-top:4pt;'>서명: __________________</p><p>날짜: ____년 ____월 ____일</p></div>" },
  { id: "legal-disclaimer", label: "면책조항", category: "법률", description: "법적 면책조항 삽입", content: "<p style='font-size:9pt;color:#666;border-top:1px solid #ccc;padding-top:8pt;'>본 문서는 정보 제공 목적으로 작성되었으며, 법적 자문을 구성하지 않습니다. 구체적인 법적 사안에 대해서는 전문 법률가와 상담하시기 바랍니다.</p>" },
  { id: "reference-list", label: "참고문헌", category: "학술", description: "참고문헌 섹션 삽입", content: "<h2>참고문헌</h2><ol style='font-size:10pt;line-height:2;'><li>[저자] (연도). 제목. 출판사.</li></ol>" },
  { id: "abstract-block", label: "초록", category: "학술", description: "논문 초록 섹션 삽입", content: "<div style='margin:16pt 40pt;'><h3 style='text-align:center;'>초록</h3><p style='font-size:10pt;line-height:1.8;text-align:justify;'>[초록 내용을 입력하세요]</p></div>" },
];

/* ── 15. 페이지 번호 형식/위치 프리셋 ── */
export const PAGE_NUMBER_FORMATS = [
  { id: "bottom-center", label: "아래쪽 - 가운데", position: "footer", align: "center", format: "{page}" },
  { id: "bottom-right", label: "아래쪽 - 오른쪽", position: "footer", align: "right", format: "{page}" },
  { id: "bottom-left", label: "아래쪽 - 왼쪽", position: "footer", align: "left", format: "{page}" },
  { id: "top-center", label: "위쪽 - 가운데", position: "header", align: "center", format: "{page}" },
  { id: "top-right", label: "위쪽 - 오른쪽", position: "header", align: "right", format: "{page}" },
  { id: "top-left", label: "위쪽 - 왼쪽", position: "header", align: "left", format: "{page}" },
  { id: "x-of-y-bottom", label: "X/Y (아래쪽 가운데)", position: "footer", align: "center", format: "{page}/{totalPages}" },
  { id: "x-of-y-top", label: "X/Y (위쪽 오른쪽)", position: "header", align: "right", format: "{page}/{totalPages}" },
  { id: "page-dash-bottom", label: "- X - (아래쪽 가운데)", position: "footer", align: "center", format: "- {page} -" },
  { id: "page-korean", label: "X 페이지 (아래쪽 가운데)", position: "footer", align: "center", format: "{page} 페이지" },
];

/* ── 16. 테마 글꼴 쌍 (제목 + 본문) ── */
export const THEME_FONTS = [
  { id: "office", label: "Office", heading: "'맑은 고딕', sans-serif", body: "'맑은 고딕', sans-serif" },
  { id: "calibri-cambria", label: "Calibri / Cambria", heading: "Calibri, sans-serif", body: "Cambria, serif" },
  { id: "arial-times", label: "Arial / Times New Roman", heading: "Arial, sans-serif", body: "'Times New Roman', serif" },
  { id: "nanum-pair", label: "나눔고딕 / 나눔명조", heading: "'나눔고딕', sans-serif", body: "'나눔명조', serif" },
  { id: "noto-pair", label: "Noto Sans / Noto Serif", heading: "'Noto Sans KR', sans-serif", body: "'Noto Serif KR', serif" },
  { id: "malgun-batang", label: "맑은 고딕 / 바탕", heading: "'맑은 고딕', sans-serif", body: "'바탕', serif" },
  { id: "georgia-verdana", label: "Georgia / Verdana", heading: "Georgia, serif", body: "Verdana, sans-serif" },
  { id: "trebuchet-georgia", label: "Trebuchet / Georgia", heading: "'Trebuchet MS', sans-serif", body: "Georgia, serif" },
  { id: "hancom-pair", label: "한컴돋움 / 한컴바탕", heading: "'한컴돋움', sans-serif", body: "'한컴바탕', serif" },
  { id: "consolas-cambria", label: "Consolas / Cambria (코드)", heading: "Consolas, monospace", body: "Cambria, serif" },
];
