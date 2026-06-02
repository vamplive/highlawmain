/**
 * 에디터 스타일 배럴 파일 — 3개 하위 모듈을 결합하여 전체 에디터 CSS 제공
 *
 * - styles-typography.js: ProseMirror 본문, 제목, 각주, 변경 추적, 드롭캡 등
 * - styles-layout.js: 페이지 컨테이너, 페이지네이션, 인쇄, 스플래시, 스크롤바 등
 * - styles-components.js: 리본, 툴팁, 드롭다운, 대화상자, 댓글, 상태 표시줄 등
 */
import { typographyStyles } from "./styles-typography";
import { layoutStyles } from "./styles-layout";
import { componentStyles } from "./styles-components";
import { mobileStyles } from "./mobile/styles-mobile";

export const editorStyles = typographyStyles + layoutStyles + componentStyles + mobileStyles;
