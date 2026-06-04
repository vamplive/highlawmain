# 헤더 드롭다운 동시 노출 및 호버 갭 수정

날짜: 2026-06-04
요청자: 운영자
배경: 헤더 드롭다운 중 하나의 헤더를 선택해도 모든 드롭다운 컬럼이 동시 노출되도록 하고, 호버 시 갭 영역에서 깜빡이거나 닫히는 현상을 해결하기 위함.

## 변경 파일
- `frontend/src/components/layout/Header.jsx`
  - `openDropdown` 개별 경로 상태를 `isDropdownOpen` 불리언 상태로 수정
  - `<nav>` 영역에 `onMouseLeave` 핸들러 배치 및 개별 아이템 진입 시 `isDropdownOpen` 제어
  - 호버 시 마우스가 지나가는 12px 빈 간격(Gap)을 메우기 위해 100% 위치에 외부 래퍼를 두고 `paddingTop: 12`를 활용하는 구조로 스타일 개편

## 검증 절차
- 로컬 `npm run build` 성공 확인 ✓
- Git push 및 서버 자동 배포를 통한 확인 예정

## 향후 개선
- 추가 없음
