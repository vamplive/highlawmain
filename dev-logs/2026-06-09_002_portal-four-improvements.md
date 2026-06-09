# 포털 개선 4가지: 조직도 부서 표시 / 프로필 팝업 / 게시판 삭제 / 계약서 파일 연동

날짜: 2026-06-09
요청자: 운영자
배경: 포털 조직도·게시판·계약서 양식 UI 개선 요청

## 변경 파일
- `frontend/src/pages/portal/PortalLayout.jsx` — 조직도 부서별 그룹화, 프로필 팝업, 게시판 카테고리 삭제 버튼
- `backend/db/schema.js` — contract_templates 테이블에 file_url_hwp/file_url_pdf 컬럼 추가
- `backend/db/init-schema.js` — ALTER TABLE 마이그레이션 + 제목 패턴으로 기존 파일 자동 연동
- `backend/routes/contract-templates.js` — multer 파일 업로드 엔드포인트, GET에 파일 URL 포함
  - POST `/:id/upload-file` — HWP/PDF 파일 업로드 (확장자로 자동 분류)
  - DELETE `/:id/file/:type` — 파일 삭제
  - PATCH `/:id` — fileUrlHwp/fileUrlPdf 필드 추가
- `frontend/src/pages/admin/contracts/ContractTemplates.jsx` — TemplateFileBadges 컴포넌트 추가

## 동작 방식
1. 조직도: lawyers.team 기준으로 부서별 그룹핑 (빈 경우 "기타")
2. 프로필 팝업: OrgCard 클릭 → 상세 프로필 모달 (사진, 이름, 직급, 소속, 연락처)
3. 게시판 삭제: 사이드바 카테고리 목록에 삭제 버튼 추가 (어드민 전용)
4. 계약서 파일:
   - 법률자문계약서.hwp/pdf, 수임계약서(민사).hwp/pdf, 수임계약서(형사).hwp/pdf → backend/data/uploads/contract-templates/
   - init-schema 자동 연동: 제목에 '법률자문'/'민사'/'형사' 포함 시 파일 URL 자동 설정
   - 관리자 UI: 각 템플릿 행에 HWP↓/PDF↓ 다운로드 버튼, 파일 없으면 업로드 버튼

## 검증 절차
- [ ] 조직도 열면 직급이 아닌 부서별로 그룹핑됨
- [ ] OrgCard 클릭 시 상세 팝업 표시
- [ ] 게시판 사이드바에서 카테고리 삭제 가능
- [ ] 계약서 양식 목록에서 HWP/PDF 파일 다운로드 버튼 표시 (서버 재시작 후 자동 연동)
- [ ] 새 계약서 양식 추가 후 HWP/PDF 업로드 버튼으로 파일 첨부 가능

## 향후 개선
- 계약서 양식 에디터에서 직접 변수 삽입 기능
- 포털 의뢰인 화면에서도 계약서 원본 파일 다운로드 링크 제공
