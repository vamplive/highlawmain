# 상담 폼 서명 오류 + 예약시스템 카테고리 불일치 + 게시판 첨부파일 복구

날짜: 2026-06-16
요청자: 운영자
배경:
1. /consultation?tab=form 에서 동의서 서명이 동작하지 않음
2. 예약시스템 관련 오류 해결 요청
3. /portal/board 게시글 첨부파일이 사라지는 문제

## 근본 원인

### 1. 서명 불가 — 캔버스 조건부 렌더링 버그
PrivacyModal.jsx에서 서명 영역을 `{scrolledToBottom && <canvas>}` 로 조건부 렌더링.
→ 모달 마운트 시점에 `useSignaturePad` 의 `useEffect` 가 실행되지만, 이때 캔버스가
  DOM에 없어서 `canvasRef.current = null` → SignatureEngine 초기화 불가.
→ 사용자가 스크롤 후 캔버스가 렌더링되어도 effect 는 재실행 안 됨 → 그리기 불가.

### 2. 카테고리 불일치 — 폼 제출 400 오류
프론트엔드 상담 분야 값(labor, military-criminal, administrative 등)이
백엔드 VALID_CATEGORIES 에 없어 "상담 분야가 올바르지 않습니다" 400 에러 발생.

### 3. 기본 예약 모드 UX 문제
scheduleMode 기본값이 "slot" 이나, 예약 슬롯이 생성되지 않은 상태여서
사용자가 빈 그리드만 보고 폼을 제출하지 못하는 UX 문제.

### 4. 게시판 첨부파일 디렉토리 미존재
`backend/data/uploads/board/` 가 서버에 없어서 파일 업로드 시도 시
Nginx가 404를 반환. 다른 업로드 디렉토리는 모두 존재하나 board 만 누락.

## 변경 파일

### 서명 수정
- `frontend/src/pages/consultation/useSignaturePad.js`
  - `forceResize()` 함수 추가 (외부에서 명시적 resize 트리거용)

- `frontend/src/pages/consultation/PrivacyModal.jsx`
  - `import useLayoutEffect` 추가
  - `forceResize` 구조분해 추가
  - `useLayoutEffect` 로 scrolledToBottom 전환 시 `forceResize()` 호출
  - 서명 영역을 `{scrolledToBottom && ...}` → `<div style={{ display: scrolledToBottom ? undefined : "none" }}>` 로 변경
    → 캔버스가 항상 DOM에 유지되어 마운트 시 engine 초기화 가능
    → scrolledToBottom 전환 시 ResizeObserver + forceResize 로 픽셀 버퍼 재초기화
  - 스크롤 컨테이너에 `touchAction: "pan-y"` 추가 (iOS 스크롤 보장)

### 카테고리 수정
- `backend/services/consultation-service.js`
  - CATEGORY_LABELS 에 프론트엔드 신규 분야 추가:
    labor(인사노무), serious-accident(중대재해), defense(방산),
    military-criminal(군형사), entertainment(엔터테인먼트),
    administrative(행정), intellectual-property(지적재산권), immigration(이민)

### 예약 모드 기본값
- `frontend/src/pages/consultation/consultationConstants.js`
  - INITIAL_FORM.scheduleMode: "slot" → "request"
  - 슬롯 미생성 상태에서 기본 "협의 요청" 폼 노출

### 게시판 첨부파일 디렉토리 자동 생성
- `backend/index.js`
  - ensureUploadDirs() IIFE 추가
  - 서버 시작 시 uploads/ 하위 11개 디렉토리 자동 생성
  - git pull 후 재기동 시에도 디렉토리 항상 존재 보장

## 검증 절차
- /consultation?tab=form → 동의서 스크롤 후 서명 영역에 마우스/터치 드로잉 가능 확인
- 군형사 분야 선택 후 폼 제출 → 400 에러 없이 접수 완료 확인
- 폼 최초 진입 시 "일정 협의 요청" 탭이 기본 선택 상태 확인
- /portal/board → 파일첨부 버튼으로 PDF/DOCX 업로드 후 게시글 저장 → 첨부파일 링크 정상 다운로드 확인
- 서버 재기동 후 `board` 디렉토리가 자동 생성되는지 확인 ✅

## 향후 개선
- 게시글 삭제 시 연관 물리 파일도 같이 삭제하는 정리 로직 추가 고려
- 예약 슬롯을 관리자가 생성하면 scheduleMode 기본값을 다시 "slot"으로 전환 가능
