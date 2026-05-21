/**
 * 예약 발행 + 예약 메시지 스케줄러
 * - 60초 간격으로 두 작업을 수행
 *   1) scheduled_changes 도달 항목 → site_settings 반영 + 이력 기록
 *   2) scheduled_messages 도달 항목 → SMS/이메일 발송 + message_logs 기록
 */
const { sqlite } = require("../db");
const crypto = require("crypto");
const scheduleService = require("../services/schedule-service");
const triggerService = require("../services/trigger-service");
const { runRetentionPolicy } = require("./data-retention");

/** 재참여 트리거는 하루에 한 번만 돌리도록 마지막 실행 시각 추적 */
let lastReengagementRunAt = 0;
const REENGAGEMENT_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24시간
/** 데이터 보존 정책도 하루 1회 */
let lastRetentionRunAt = 0;

/** 스케줄러 시작 — 60초 간격으로 예약 발행 + 예약 메시지 처리 */
function startScheduler() {
  console.log("[Scheduler] 예약 발행 + 예약 메시지 스케줄러 시작 (60초 간격)");

  const tick = () => {
    applyScheduledChanges();
    processScheduledMessages();
    maybeRunReengagement();
    maybeRunRetention();
  };

  // 시작 직후 한 번 즉시 실행 (서버 재시작 후 밀린 예약 처리)
  tick();
  setInterval(tick, 60 * 1000);
}

/** 예약된 사이트 설정 변경 적용 */
function applyScheduledChanges() {
  try {
      const pending = sqlite.prepare(
        "SELECT * FROM scheduled_changes WHERE status = 'pending' AND scheduled_at <= datetime('now')"
      ).all();

      if (pending.length === 0) return;

      const upsertSetting = sqlite.prepare(
        "INSERT INTO site_settings (id, page, section, content, updated_at) VALUES (?, ?, ?, ?, datetime('now')) ON CONFLICT(page, section) DO UPDATE SET content = excluded.content, updated_at = datetime('now')"
      );
      const insertHistory = sqlite.prepare(
        "INSERT INTO site_settings_history (id, page, section, content, previous_content, changed_by, changed_at) VALUES (?, ?, ?, ?, ?, '스케줄러', datetime('now'))"
      );
      const markApplied = sqlite.prepare(
        "UPDATE scheduled_changes SET status = 'applied' WHERE id = ?"
      );
      const getCurrent = sqlite.prepare(
        "SELECT content FROM site_settings WHERE page = ? AND section = ?"
      );

      const applyAll = sqlite.transaction(() => {
        for (const change of pending) {
          const current = getCurrent.get(change.page, change.section);
          insertHistory.run(crypto.randomUUID(), change.page, change.section, change.content, current?.content || null);
          upsertSetting.run(crypto.randomUUID(), change.page, change.section, change.content);
          markApplied.run(change.id);
        }
      });

      applyAll();
      console.log(`[Scheduler] ${pending.length}건 예약 발행 적용 완료`);
    } catch (err) {
      console.error("[Scheduler Error]", err.message);
    }
}

/** 도달한 예약 메시지 발송 — schedule-service에 위임 */
function processScheduledMessages() {
  scheduleService.processPendingMessages()
    .then((res) => {
      if (res.processed > 0) {
        console.log(`[Scheduler] 예약 메시지 ${res.processed}건 처리 (성공 ${res.sent}, 실패 ${res.failed})`);
      }
    })
    .catch((err) => console.error("[Scheduler Msg Error]", err.message));
}

/** 재참여 트리거 — 24시간마다 1회 실행 (메모리 타임스탬프 기반) */
function maybeRunReengagement() {
  const now = Date.now();
  if (now - lastReengagementRunAt < REENGAGEMENT_INTERVAL_MS) return;
  lastReengagementRunAt = now;

  triggerService.processReengagement()
    .then((res) => {
      if (res.enqueued > 0) {
        console.log(`[Scheduler] 재참여 트리거 ${res.enqueued}건 예약 생성`);
      }
    })
    .catch((err) => console.error("[Scheduler Reengagement Error]", err.message));
}

/** 데이터 보존 정책 — 24시간마다 1회 실행 */
function maybeRunRetention() {
  const now = Date.now();
  if (now - lastRetentionRunAt < REENGAGEMENT_INTERVAL_MS) return;
  lastRetentionRunAt = now;
  try {
    runRetentionPolicy(sqlite);
  } catch (err) {
    console.error("[Scheduler Retention Error]", err.message);
  }
}

module.exports = { startScheduler };
