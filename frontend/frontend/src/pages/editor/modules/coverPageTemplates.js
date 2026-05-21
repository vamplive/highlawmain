/**
 * 표지 템플릿 설정 배열
 * 각 템플릿은 id, label, build 함수로 구성된다.
 */

/** 기본 표지 HTML 생성 */
function buildBasicCoverPage() {
  return `
    <div style="page-break-after:always; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:800px; text-align:center; padding:80px 40px;">
      <div style="border-top:3px solid #1e3a5f; border-bottom:3px solid #1e3a5f; padding:40px 0; width:100%;">
        <h1 style="font-size:32pt; color:#1e3a5f; margin:0 0 16px 0; font-weight:700;">문서 제목</h1>
        <p style="font-size:14pt; color:#666; margin:0 0 8px 0;">부제목을 입력하세요</p>
      </div>
      <div style="margin-top:60px; color:#888; font-size:11pt;">
        <p style="margin:4px 0;">작성자: 홍길동</p>
        <p style="margin:4px 0;">날짜: ${new Date().toLocaleDateString("ko-KR")}</p>
      </div>
    </div>
  `;
}

/** 모던 표지 HTML 생성 */
function buildModernCoverPage() {
  return `
    <div style="page-break-after:always; min-height:800px; background:linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color:#fff; display:flex; flex-direction:column; justify-content:center; padding:80px 60px;">
      <div style="border-left:4px solid #fbbf24; padding-left:24px;">
        <h1 style="font-size:36pt; margin:0 0 12px 0; font-weight:300; color:#fff;">문서 제목</h1>
        <p style="font-size:16pt; margin:0; opacity:0.8; color:#e0e7ff;">부제목을 입력하세요</p>
      </div>
      <div style="margin-top:80px; opacity:0.7; font-size:11pt;">
        <p style="margin:4px 0; color:#e0e7ff;">작성자: 홍길동</p>
        <p style="margin:4px 0; color:#e0e7ff;">날짜: ${new Date().toLocaleDateString("ko-KR")}</p>
      </div>
    </div>
  `;
}

/** 비즈니스 표지 HTML 생성 */
function buildBusinessCoverPage() {
  return `
    <div style="page-break-after:always; min-height:800px; display:flex; flex-direction:column; justify-content:space-between; padding:60px 50px;">
      <div style="text-align:right; color:#999; font-size:10pt;">
        <p style="margin:0;">법무법인 하이로</p>
      </div>
      <div style="text-align:center;">
        <div style="width:80px; height:4px; background:#1e3a5f; margin:0 auto 24px;"></div>
        <h1 style="font-size:28pt; color:#1e3a5f; margin:0 0 16px 0; font-weight:600;">문서 제목</h1>
        <p style="font-size:13pt; color:#666; margin:0;">부제목을 입력하세요</p>
        <div style="width:80px; height:4px; background:#1e3a5f; margin:24px auto 0;"></div>
      </div>
      <div style="text-align:center; color:#888; font-size:10pt;">
        <p style="margin:4px 0;">작성자: 홍길동 | 부서: 기획팀</p>
        <p style="margin:4px 0;">날짜: ${new Date().toLocaleDateString("ko-KR")}</p>
        <p style="margin:4px 0;">기밀등급: 일반</p>
      </div>
    </div>
  `;
}

/** 표지 프리셋 목록 */
export const COVER_PAGE_PRESETS = [
  { id: "basic", label: "기본 표지", build: buildBasicCoverPage },
  { id: "modern", label: "모던 표지", build: buildModernCoverPage },
  { id: "business", label: "비즈니스 표지", build: buildBusinessCoverPage },
];
