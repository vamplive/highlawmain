# 포털 게시판 한글 파일명 깨짐 수정

날짜: 2026-06-16
요청자: 운영자
배경: /portal/board에서 한글 파일명으로 첨부 파일을 올리면 파일명이 깨져서 표시됨

## 근본 원인

Multer 내부에서 사용하는 busboy 1.x가 HTTP 멀티파트 Content-Disposition 헤더의
파일명을 latin1(ISO-8859-1)로 파싱한다. UTF-8 한글은 멀티바이트 문자라서
latin1로 읽으면 각 바이트가 개별 문자로 처리되어 깨진다.

예: "보고서.pdf" → latin1로 읽으면 "ë³´ê³ ì.pdf" 로 저장됨

## 변경 파일

- `backend/lib/decode-filename.js` (신규)
  - `decodeMultipartFilename(raw)` 유틸 함수 공용 모듈로 분리
  - `Buffer.from(raw, 'latin1').toString('utf8')` 로 파일명 재해석

- `backend/routes/portal.js`
  - `upload-attachments` 응답의 `name` 필드에 `decodeMultipartFilename` 적용
  - `f.originalname` → `decodeMultipartFilename(f.originalname)`

- `backend/routes/chat.js`
  - 동일 문제에 대해 로컬로 정의했던 `decodeMultipartFilename` 함수를 제거
  - 공용 모듈(`lib/decode-filename.js`)에서 import하도록 교체

## 검증 절차
- 로컬: `Buffer.from('보고서.pdf', 'utf8').toString('latin1')` 로 깨진 이름 생성 후
  `decodeMultipartFilename()`이 "보고서.pdf" 를 반환하는지 확인 ✅
- 서버: git pull + npm run build + pm2 restart 완료 ✅

## 향후 개선
- case-records.js, media.js, documents.js 등 다른 업로드 엔드포인트에서도
  originalname을 응답에 포함시키는 경우 동일 유틸 적용 검토
