/**
 * 발송 탭 API 호출 모듈 — 즉시 발송, 예약 등록, 중복 체크, 이미지 업로드.
 * SendTab 오케스트레이터에서 비즈니스 로직만 분리해 가독성을 높였다.
 */
import { api } from "../../../utils/api";

/** 선택자 목록에서 채널·차단 목록을 반영해 수신자 페이로드 빌드 */
function buildRecipients(list, key, excludeContacts) {
  return list
    .filter((c) => c[key] && !excludeContacts.has(c[key]))
    .map((c) => ({
      name: c.name,
      contact: c[key],
      consultationId: c.consultationId || c.id,
      category: c.category,
    }));
}

/** 이미지 파일을 서버에 업로드하고 fullUrl을 반환 */
export async function uploadMessageImage(imageFile) {
  if (!imageFile) return null;
  const formData = new FormData();
  formData.append("image", imageFile);
  const res = await api.upload("/messages/upload-image", formData);
  return res.data?.fullUrl || null;
}

/** 예약 등록: SMS+이메일 동시 발송이면 두 요청을 병렬로 보낸다 */
export async function scheduleMessages({
  channel, finalList, excludeContacts,
  selectedTemplate, subject, content, scheduledAt,
  manualRecipients, imageUrl,
}) {
  const allFinalList = [...finalList, ...(manualRecipients || [])];

  if (channel === "both") {
    await Promise.all([
      api.post("/messages/schedule", {
        channel: "sms",
        recipients: buildRecipients(allFinalList, "phone", excludeContacts),
        templateId: selectedTemplate || undefined,
        content,
        scheduledAt,
      }),
      api.post("/messages/schedule", {
        channel: "email",
        recipients: buildRecipients(allFinalList, "email", excludeContacts),
        templateId: selectedTemplate || undefined,
        subject,
        content,
        scheduledAt,
      }),
    ]);
    return;
  }

  const contactKey = channel === "email" ? "email" : "phone";
  await api.post("/messages/schedule", {
    channel,
    recipients: buildRecipients(allFinalList, contactKey, excludeContacts),
    templateId: selectedTemplate || undefined,
    subject: channel === "email" ? subject : undefined,
    content,
    scheduledAt,
    ...(imageUrl && (channel === "kakao" || channel === "email") ? { imageUrl } : {}),
  });
}

/** 즉시 발송: 결과를 정규화된 형태로 반환 */
export async function sendMessages({
  channel, finalList, excludeContacts,
  selectedTemplate, subject, content,
  manualRecipients, imageUrl,
}) {
  const allFinalList = [...finalList, ...(manualRecipients || [])];

  if (channel === "both") {
    const smsList = allFinalList.filter((c) => c.phone && !excludeContacts.has(c.phone));
    const emailList = allFinalList.filter((c) => c.email && !excludeContacts.has(c.email));
    const [sms, email] = await Promise.all([
      api.post("/messages/send", {
        channel: "sms",
        recipients: smsList.map((c) => ({ name: c.name, contact: c.phone, consultationId: c.consultationId || c.id, category: c.category })),
        templateId: selectedTemplate || undefined,
        content,
      }),
      api.post("/messages/send", {
        channel: "email",
        recipients: emailList.map((c) => ({ name: c.name, contact: c.email, consultationId: c.consultationId || c.id, category: c.category })),
        templateId: selectedTemplate || undefined,
        subject,
        content,
        ...(imageUrl ? { imageUrl } : {}),
      }),
    ]);
    return {
      total: (sms.data?.total || 0) + (email.data?.total || 0),
      sent: (sms.data?.sent || 0) + (email.data?.sent || 0),
      failed: (sms.data?.failed || 0) + (email.data?.failed || 0),
      results: [...(sms.data?.results || []), ...(email.data?.results || [])],
    };
  }

  const contactKey = channel === "email" ? "email" : "phone";
  const recipients = allFinalList
    .filter((c) => c[contactKey] && !excludeContacts.has(c[contactKey]))
    .map((c) => ({
      name: c.name,
      contact: c[contactKey],
      consultationId: c.consultationId || c.id,
      category: c.category,
    }));

  const res = await api.post("/messages/send", {
    channel,
    recipients,
    templateId: selectedTemplate || undefined,
    subject: channel === "email" ? subject : undefined,
    content,
    ...(imageUrl && (channel === "kakao" || channel === "email") ? { imageUrl } : {}),
  });
  return res.data;
}

/** 24시간 내 동일 연락처로 발송한 이력이 있는지 검사 */
export async function checkDuplicates(contacts) {
  const dup = await api.post("/messages/check-duplicates", { contacts, withinHours: 24 });
  return dup.data?.duplicates || [];
}
