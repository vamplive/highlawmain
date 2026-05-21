/** 홈페이지 콘텐츠 편집 탭 */
import { FormField } from "../../../components/admin";
import { SectionCard, ItemCard, AddButton, FieldRow } from "./shared";

export default function HomeSection({ settings, update, updateItem, addItem, removeItem }) {
  const s = settings;
  return (
    <>
      <SectionCard title="히어로">
        <FieldRow>
          <FormField label="제목" value={s["home/hero"].heading} onChange={(v) => update("home/hero", "heading", v)} />
          <FormField label="부제목" value={s["home/hero"].subheading} onChange={(v) => update("home/hero", "subheading", v)} />
        </FieldRow>
        <FormField label="태그라인" type="textarea" minHeight={48} value={s["home/hero"].tagline} onChange={(v) => update("home/hero", "tagline", v)} />
        <FieldRow>
          <FormField label="CTA 버튼1 텍스트" value={s["home/hero"].ctaPrimary} onChange={(v) => update("home/hero", "ctaPrimary", v)} />
          <FormField label="CTA 버튼1 링크" value={s["home/hero"].ctaPrimaryLink} onChange={(v) => update("home/hero", "ctaPrimaryLink", v)} />
        </FieldRow>
        <FieldRow>
          <FormField label="CTA 버튼2 텍스트" value={s["home/hero"].ctaSecondary} onChange={(v) => update("home/hero", "ctaSecondary", v)} />
          <FormField label="CTA 버튼2 링크" value={s["home/hero"].ctaSecondaryLink} onChange={(v) => update("home/hero", "ctaSecondaryLink", v)} />
        </FieldRow>
      </SectionCard>

      <SectionCard title="주요 지표">
        {s["home/stats"].items.map((item, i) => (
          <ItemCard key={i} onRemove={s["home/stats"].items.length > 1 ? () => removeItem("home/stats", i) : undefined}>
            <FieldRow>
              <FormField label="수치" value={item.value} onChange={(v) => updateItem("home/stats", i, "value", v)} />
              <FormField label="설명" value={item.label} onChange={(v) => updateItem("home/stats", i, "label", v)} />
            </FieldRow>
          </ItemCard>
        ))}
        <AddButton onClick={() => addItem("home/stats", { value: "", label: "" })} label="지표 추가" />
      </SectionCard>

      <SectionCard title="접근 방식">
        <FormField label="제목" value={s["home/approach"].heading} onChange={(v) => update("home/approach", "heading", v)} />
        <div style={{ marginTop: 12 }}>
          <FormField label="설명" type="textarea" minHeight={72} value={s["home/approach"].description} onChange={(v) => update("home/approach", "description", v)} />
        </div>
      </SectionCard>

      <SectionCard title="하이라이트">
        {s["home/highlights"].items.map((item, i) => (
          <ItemCard key={i} onRemove={s["home/highlights"].items.length > 1 ? () => removeItem("home/highlights", i) : undefined}>
            <FormField label="제목" value={item.title} onChange={(v) => updateItem("home/highlights", i, "title", v)} />
            <div style={{ marginTop: 8 }}>
              <FormField label="설명" type="textarea" minHeight={48} value={item.desc} onChange={(v) => updateItem("home/highlights", i, "desc", v)} />
            </div>
          </ItemCard>
        ))}
        <AddButton onClick={() => addItem("home/highlights", { title: "", desc: "" })} label="하이라이트 추가" />
      </SectionCard>

      <SectionCard title="하단 CTA">
        <FormField label="메시지" value={s["home/cta"].message} onChange={(v) => update("home/cta", "message", v)} />
        <FieldRow>
          <FormField label="버튼 텍스트" value={s["home/cta"].buttonText} onChange={(v) => update("home/cta", "buttonText", v)} />
          <FormField label="버튼 링크" value={s["home/cta"].buttonLink} onChange={(v) => update("home/cta", "buttonLink", v)} />
        </FieldRow>
      </SectionCard>
    </>
  );
}
