/** 공통 레이아웃 (헤더/푸터) 편집 탭 */
import { FormField } from "../../../components/admin";
import { SectionCard, ItemCard, AddButton, FieldRow } from "./shared";

export default function LayoutSection({ settings, update, updateItem, addItem, removeItem }) {
  const s = settings;
  return (
    <>
      <SectionCard title="네비게이션">
        {s["layout/nav"].items.map((item, i) => (
          <ItemCard key={i} onRemove={s["layout/nav"].items.length > 1 ? () => removeItem("layout/nav", i) : undefined}>
            <FieldRow>
              <FormField label="표시 텍스트" value={item.label} onChange={(v) => updateItem("layout/nav", i, "label", v)} />
              <FormField label="경로" value={item.to} onChange={(v) => updateItem("layout/nav", i, "to", v)} placeholder="/about" />
            </FieldRow>
          </ItemCard>
        ))}
        <AddButton onClick={() => addItem("layout/nav", { to: "/", label: "" })} label="메뉴 추가" />
      </SectionCard>

      <SectionCard title="푸터">
        <FieldRow>
          <FormField label="회사명" value={s["layout/footer"].companyName} onChange={(v) => update("layout/footer", "companyName", v)} />
          <FormField label="전화번호" value={s["layout/footer"].tel} onChange={(v) => update("layout/footer", "tel", v)} />
        </FieldRow>
        <FormField label="태그라인" type="textarea" minHeight={48} value={s["layout/footer"].tagline} onChange={(v) => update("layout/footer", "tagline", v)} />
        <FieldRow>
          <FormField label="주소" value={s["layout/footer"].address} onChange={(v) => update("layout/footer", "address", v)} />
          <FormField label="팩스" value={s["layout/footer"].fax} onChange={(v) => update("layout/footer", "fax", v)} />
        </FieldRow>
        <FieldRow>
          <FormField label="운영시간" value={s["layout/footer"].hours} onChange={(v) => update("layout/footer", "hours", v)} />
          <FormField label="비고" value={s["layout/footer"].note} onChange={(v) => update("layout/footer", "note", v)} />
        </FieldRow>
        <FormField label="저작권 표시" value={s["layout/footer"].copyright} onChange={(v) => update("layout/footer", "copyright", v)} />
      </SectionCard>

      <SectionCard title="플로팅 퀵 버튼 (전화/카카오/인스타/네이버예약/오시는길) 및 SNS 채널 설정">
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
          모든 페이지 우측 하단 및 푸터에 노출되는 연락처/SNS 정보입니다. 각 채널을 켜고 끌 수 있고, URL을 수정할 수 있습니다.
        </p>
        <FieldRow>
          <ToggleField label="전화 버튼 표시" checked={!!s["layout/contact"].phoneEnabled} onChange={(v) => update("layout/contact", "phoneEnabled", v)} />
          <FormField label="전화번호 (tel: 형식)" value={s["layout/contact"].phone} onChange={(v) => update("layout/contact", "phone", v)} placeholder="준비 중" />
        </FieldRow>
        <FieldRow>
          <ToggleField label="카카오톡 버튼 표시" checked={!!s["layout/contact"].kakaoEnabled} onChange={(v) => update("layout/contact", "kakaoEnabled", v)} />
          <FormField label="카카오톡 채팅 URL" value={s["layout/contact"].kakaoUrl} onChange={(v) => update("layout/contact", "kakaoUrl", v)} placeholder="https://pf.kakao.com/_xxx/chat" />
        </FieldRow>
        <FieldRow>
          <ToggleField label="텔레그램 버튼 표시" checked={!!s["layout/contact"].telegramEnabled} onChange={(v) => update("layout/contact", "telegramEnabled", v)} />
          <FormField label="텔레그램 URL" value={s["layout/contact"].telegramUrl} onChange={(v) => update("layout/contact", "telegramUrl", v)} placeholder="https://t.me/yourusername" />
        </FieldRow>
        <FieldRow>
          <ToggleField label="인스타그램 표시" checked={!!s["layout/contact"].instagramEnabled} onChange={(v) => update("layout/contact", "instagramEnabled", v)} />
          <FormField label="인스타그램 URL" value={s["layout/contact"].instagramUrl} onChange={(v) => update("layout/contact", "instagramUrl", v)} placeholder="https://www.instagram.com/..." />
        </FieldRow>
        <FieldRow>
          <ToggleField label="네이버 블로그 표시" checked={!!s["layout/contact"].naverBlogEnabled} onChange={(v) => update("layout/contact", "naverBlogEnabled", v)} />
          <FormField label="네이버 블로그 URL" value={s["layout/contact"].naverBlogUrl} onChange={(v) => update("layout/contact", "naverBlogUrl", v)} placeholder="https://blog.naver.com/..." />
        </FieldRow>
        <FieldRow>
          <ToggleField label="유튜브 표시" checked={!!s["layout/contact"].youtubeEnabled} onChange={(v) => update("layout/contact", "youtubeEnabled", v)} />
          <FormField label="유튜브 URL" value={s["layout/contact"].youtubeUrl} onChange={(v) => update("layout/contact", "youtubeUrl", v)} placeholder="https://www.youtube.com/..." />
        </FieldRow>
        <FieldRow>
          <ToggleField label="네이버 예약 버튼 표시 (플로팅 메뉴)" checked={!!s["layout/contact"].naverReservationEnabled} onChange={(v) => update("layout/contact", "naverReservationEnabled", v)} />
          <FormField label="네이버 예약 URL" value={s["layout/contact"].naverReservationUrl || ""} onChange={(v) => update("layout/contact", "naverReservationUrl", v)} placeholder="https://booking.naver.com/..." />
        </FieldRow>
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8, lineHeight: 1.6 }}>
          <strong>텔레그램 세팅:</strong> ① 모바일 텔레그램 앱 설치 → ② 설정 → 사용자 이름(@username) 등록
          → ③ <code>https://t.me/사용자이름</code> 형식으로 URL 입력.
        </p>
      </SectionCard>
    </>
  );
}

/** 체크박스 토글 — FormField가 checkbox를 지원하지 않아 인라인 제공 */
function ToggleField({ label, checked, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 22 }}>
      <input
        type="checkbox"
        id={`toggle-${label}`}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 18, height: 18, cursor: "pointer" }}
      />
      <label htmlFor={`toggle-${label}`} style={{ fontSize: 13, cursor: "pointer", userSelect: "none" }}>
        {label}
      </label>
    </div>
  );
}
