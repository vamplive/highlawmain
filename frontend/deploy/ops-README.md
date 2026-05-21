# 운영 자동화 (Ops)

> 프로덕션/로컬 운영 작업을 위한 스크립트·스케줄러 설정 모음.

---

## 1. DB 백업 자동화 (macOS launchd)

### 개요
- `backend/data/db/yjlaw.db` 를 하루 한 번 `backend/data/backups/` 로 스냅샷 저장
- better-sqlite3 의 원자적 `.backup()` API 사용 (쓰기 중에도 안전)
- 최근 14개 파일만 보관하고 오래된 것은 자동 삭제
- macOS `launchd` 에이전트로 **사용자 로그인 세션**에서 구동 (시스템 데몬 아님 → sudo 불필요)

### 수동 실행 테스트

```bash
cd backend
npm run backup
```

- 출력 예: `[backup] ok: second-brain_2026-04-20_031000.db (1.3 MB) in 18 ms`
- 결과 파일: `backend/data/backups/second-brain_YYYY-MM-DD_HHmmss.db`
- `.gitignore` 에 의해 Git 추적 대상 아님

### launchd 설치 (1회)

#### 1) plist 복사 및 경로 치환

```bash
# 프로젝트 루트에서
PROJECT_ROOT="$(pwd)"
NODE_PATH="$(command -v node)"
TARGET="$HOME/Library/LaunchAgents/com.yjlaw.db-backup.plist"

mkdir -p "$HOME/Library/LaunchAgents"
sed -e "s|__PROJECT_ROOT__|$PROJECT_ROOT|g" \
    -e "s|__NODE_PATH__|$NODE_PATH|g" \
    ops/com.yjlaw.db-backup.plist > "$TARGET"
```

> **확인**: `cat "$TARGET"` 로 플레이스홀더가 절대경로로 치환됐는지 검증.

#### 2) launchd 에 등록

```bash
launchctl unload "$TARGET" 2>/dev/null  # 기존 등록이 있으면 해제
launchctl load "$TARGET"                # 새로 등록
launchctl list | grep com.yjlaw          # 등록 확인
```

등록 성공 시 다음과 비슷한 출력:
```
-	0	com.yjlaw.db-backup
```

#### 3) 즉시 한 번 실행해서 동작 확인

```bash
launchctl start com.yjlaw.db-backup
sleep 2
ls -lt backend/data/backups/ | head
```

- 최신 파일이 방금 생성됐으면 정상
- 오류 시 로그 확인: `cat backend/data/backups/_launchd.err.log`

### 제거

```bash
launchctl unload "$HOME/Library/LaunchAgents/com.yjlaw.db-backup.plist"
rm "$HOME/Library/LaunchAgents/com.yjlaw.db-backup.plist"
```

### 스케줄 변경

plist 의 `StartCalendarInterval` 블록을 수정 후 `launchctl unload → load` 재등록.

시간 여러 개 등록하려면 `array` 로:
```xml
<key>StartCalendarInterval</key>
<array>
  <dict><key>Hour</key><integer>3</integer><key>Minute</key><integer>10</integer></dict>
  <dict><key>Hour</key><integer>15</integer><key>Minute</key><integer>10</integer></dict>
</array>
```

### 복원 절차

1. 백엔드 중단: `kill` 실행 중인 `node index.js` 프로세스
2. 현재 DB 파일 안전 장소로 이동: `mv backend/data/db/yjlaw.db backend/data/db/second-brain.broken.db`
3. 복원할 스냅샷 복사: `cp backend/data/backups/second-brain_YYYY-MM-DD_HHmmss.db backend/data/db/yjlaw.db`
4. 백엔드 재시작: `cd backend && PORT=5001 node index.js`
5. 관리자 페이지에서 레코드 개수·시점 확인

### 한계 및 다음 단계 (권장)

- **로컬 디스크 한정** — 디스크 실패 시 백업도 함께 유실. 다음 중 하나 추가 권장:
  - 복사본을 iCloud Drive / Dropbox / Google Drive 동기화 폴더로 추가 복사
  - `rclone`/`rsync` 로 외부 스토리지 밀어넣기
- **Mac 이 꺼져 있으면 실행 안 됨** — 항상 켜두거나, 클라우드 서버로 이주 시 systemd-timer 등으로 전환 필요
- **업로드 파일(`backend/uploads/`) 미포함** — 별도 백업 필요시 `rsync -a backend/uploads/ <dest>/uploads/` 추가

---

## 2. 기타 운영 스크립트

아직 없음. 필요한 항목 발생 시 이 문서에 추가.
