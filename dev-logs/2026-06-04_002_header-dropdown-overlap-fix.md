# 헤더 드롭다운 겹침 현상 수정 (너비 및 메뉴 간격 최적화)

날짜: 2026-06-04
요청자: 운영자
배경: 헤더 드롭다운의 전체 열림 기능 도입 이후, 메뉴 6개가 모두 노출될 때 드롭다운 영역이 서로 겹쳐서 UI가 부자연스러워지는 현상을 해결하기 위함.

## 변경 파일
- `frontend/src/components/layout/Header.jsx`
  - 드롭다운의 최소 너비 축소: `minWidth: 140` → `minWidth: 115`
  - 드롭다운 링크의 폰트 크기 및 패딩 축소: `fontSize: 12`, `padding: "10px 18px"` → `fontSize: 11`, `padding: "10px 12px"`
  - 메뉴 간격(Gap)을 화면 크기에 맞게 반응형으로 최적화: `gap-8` (32px) → `gap-6 xl:gap-12` (24px / 48px)

## 검증 절차
- 로컬 `npm run build` 성공 확인 ✓
- Git push 및 서버 자동 배포를 통한 확인 예정

## 향후 개선
- 추가 없음
