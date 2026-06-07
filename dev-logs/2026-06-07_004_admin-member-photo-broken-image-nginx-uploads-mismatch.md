# 관리자페이지에서 구성원(변호사) 사진을 업로드해도 계속 깨져 보이는 문제 — 원인은 운영 서버 nginx 설정과 백엔드 STORAGE_PATH 불일치

날짜: 2026-06-07
요청자: 운영자
배경: 운영자가 관리자페이지(`/admin/lawyers`, `/admin/organization`)에서 구성원 사진을 업로드해도 계속 깨진 이미지로 표시된다고 보고함. 운영자가 직접 깨진 이미지 URL을 확인해 제공: `https://highlaw.co.kr/uploads/media/lawyers/media-5fabab32-c1e6-45cf-ab15-d95d8b66becf.png`

## 원인 분석
- 코드 흐름 자체는 정상이다 — `POST /api/media/upload`(`backend/routes/media.js:208`)가 파일을 `STORAGE_PATH/uploads/media/{folder}/...`에 저장하고 `/uploads/media/{folder}/{filename}` 형태의 URL을 반환하면, `backend/index.js:263`의 `app.use("/uploads", express.static(path.join(STORAGE_PATH, "uploads"), ...))`가 동일한 `STORAGE_PATH` 기준으로 그 파일을 서빙하도록 되어 있어 코드만 보면 경로가 항상 일치한다.
- 그런데 실제로 운영자가 제공한 URL을 직접 요청해보면:
  ```
  GET /uploads/media/lawyers/media-....png  → 404 Not Found, Server: nginx, nginx 기본 에러 페이지(HTML, Content-Length: 162)
  GET /uploads/media/                        → 403 Forbidden, 동일한 nginx 기본 에러 페이지
  GET /api/<존재하지-않는-라우트>             → 404, "Cannot GET ..." (Express 자체의 에러 응답 — nginx를 통해 백엔드까지 프록시되어 돌아온 것)
  ```
  `/api/*`는 nginx가 Node 백엔드(5001 포트)로 프록시해 Express의 응답을 그대로 반환하는 반면, `/uploads/*`는 **nginx가 자체적으로 디스크에서 정적 파일을 찾아 서빙**하고 있고(자체 404/403 에러 페이지 반환), 그 탐색 경로가 백엔드의 `STORAGE_PATH`(운영 환경에서는 `.env.example`/`README.md` 컨벤션상 `/var/data/highlaw` 같은 외부 경로로 설정돼 있을 가능성이 높음)와 다른 디렉터리를 가리키고 있는 것으로 결론지었다.
- 즉, 백엔드는 파일을 정상적으로 저장하고 정상적인 URL을 반환하지만(업로드 자체는 "성공"), nginx가 그 파일을 전혀 다른 위치에서 찾으려 하기 때문에 디스크에 파일이 분명히 존재함에도 불구하고 항상 404로 끝나 "계속 깨져서 나온다"는 증상이 발생한다. 재업로드를 반복해도 동일한 구조적 미스매치가 반복되므로 해결되지 않는다.

## 결론 — 코드 버그가 아니라 운영 서버(Lightsail) nginx 설정 문제
- 이 저장소(`deploy/`)에는 운영 서버의 실제 nginx server 블록이 포함돼 있지 않고(리다이렉트 스니펫만 존재), 해당 서버에 대한 SSH 접근 권한도 없어 직접 수정이 불가능하다.
- 대신 적용 가능한 nginx 설정 스니펫과 적용 절차를 작성해 `deploy/nginx-snippets/highlaw-uploads-proxy-fix.conf`에 추가했다. 핵심 권장안은 **`/uploads`도 `/api`와 동일하게 Node 백엔드(127.0.0.1:5001)로 프록시**하는 것 — 이렇게 하면 백엔드가 파일을 "쓴" 동일한 `STORAGE_PATH`에서 "읽어" 서빙하므로 향후 `STORAGE_PATH`가 바뀌어도(예: 외부 스토리지로 이전) nginx 쪽을 별도로 맞출 필요 없이 항상 일치한다. 대안으로 nginx가 계속 직접 정적 서빙을 하길 원할 경우 `alias` 경로를 백엔드 `.env`의 `STORAGE_PATH`와 동일하게 맞추는 방법도 주석으로 함께 기재했다.

## 변경 파일
- `deploy/nginx-snippets/highlaw-uploads-proxy-fix.conf` (신규) — 운영 서버에 적용할 nginx 설정 스니펫 + 적용/검증 절차 주석

## 검증 절차
1. `curl -sI https://highlaw.co.kr/uploads/media/lawyers/media-....png` → 404, nginx 자체 에러 페이지 확인
2. `curl -sI https://highlaw.co.kr/uploads/media/` → 403, 동일한 nginx 에러 페이지 확인 (nginx가 디렉터리를 직접 열람하려 시도 — 프록시가 아닌 직접 정적 서빙의 증거)
3. `curl -s https://highlaw.co.kr/api/<존재하지-않는-라우트>` → "Cannot GET ..." (Express 응답이 프록시되어 돌아옴) — `/api`와 `/uploads`의 처리 방식이 다름을 대조 확인
4. (제약사항) 운영 서버 nginx 설정 파일 자체는 SSH 접근 권한이 없어 직접 열람·수정하지 못함. 운영자 또는 운영 담당자가 서버에서 `sudo nginx -T | grep -n "location /uploads" -B2 -A6`으로 현재 설정을 확인 후, `deploy/nginx-snippets/highlaw-uploads-proxy-fix.conf`의 안내에 따라 교체하고 `sudo nginx -t && sudo systemctl reload nginx`로 적용·재시작하면 된다.

## 향후 개선
- 적용 후 `/uploads/media/lawyers/...` 같은 기존에 깨졌던 URL이 정상적으로 200을 반환하는지, 그리고 새로 업로드한 사진이 즉시 보이는지 재확인 필요.
- 이번 사례처럼 "코드는 맞는데 인프라 설정이 어긋나는" 문제를 더 빨리 발견할 수 있도록, 배포 체크리스트에 "`STORAGE_PATH` 값과 nginx의 정적 서빙 경로(또는 프록시 설정)가 일치하는지" 항목을 추가하는 것을 권장.
