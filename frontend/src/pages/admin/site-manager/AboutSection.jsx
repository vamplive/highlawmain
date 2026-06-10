/** 사무소 소개 콘텐츠 편집 탭 */
import { FormField } from "../../../components/admin";
import { SectionCard, ItemCard, AddButton, FieldRow } from "./shared";

export default function AboutSection({ settings, update, updateItem, addItem, removeItem }) {
  const s = settings;
  return (
    <>
      <SectionCard title="히어로">
        <FieldRow>
          <FormField label="제목" value={s["about/hero"].heading} onChange={(v) => update("about/hero", "heading", v)} />
          <FormField label="부제목" value={s["about/hero"].subheading} onChange={(v) => update("about/hero", "subheading", v)} />
        </FieldRow>
        <div style={{ marginTop: 12 }}>
          <FormField label="설명" type="textarea" minHeight={48} value={s["about/hero"].description} onChange={(v) => update("about/hero", "description", v)} />
        </div>
      </SectionCard>

      <SectionCard title="철학">
        <FormField label="제목" type="textarea" minHeight={48} value={s["about/philosophy"].heading} onChange={(v) => update("about/philosophy", "heading", v)} />
        <div style={{ marginTop: 12 }}>
          <FormField label="설명" type="textarea" minHeight={72} value={s["about/philosophy"].description} onChange={(v) => update("about/philosophy", "description", v)} />
        </div>
      </SectionCard>

      <SectionCard title="핵심가치">
        {s["about/values"].items.map((item, i) => (
          <ItemCard key={i} onRemove={s["about/values"].items.length > 1 ? () => removeItem("about/values", i) : undefined}>
            <FieldRow cols={3}>
              <FormField label="제목" value={item.title} onChange={(v) => updateItem("about/values", i, "title", v)} />
              <FormField label="부제목 (영문)" value={item.subtitle} onChange={(v) => updateItem("about/values", i, "subtitle", v)} />
              <FormField label="설명" value={item.desc} onChange={(v) => updateItem("about/values", i, "desc", v)} />
            </FieldRow>
          </ItemCard>
        ))}
        <AddButton onClick={() => addItem("about/values", { title: "", subtitle: "", desc: "" })} label="가치 추가" />
      </SectionCard>

      <SectionCard title="연혁">
        {s["about/history"].items.map((item, i) => (
          <ItemCard key={i} onRemove={s["about/history"].items.length > 1 ? () => removeItem("about/history", i) : undefined}>
            <FieldRow>
              <FormField label="연도" value={item.year} onChange={(v) => updateItem("about/history", i, "year", v)} placeholder="2025" />
              <FormField label="내용" value={item.text} onChange={(v) => updateItem("about/history", i, "text", v)} />
            </FieldRow>
          </ItemCard>
        ))}
        <AddButton onClick={() => addItem("about/history", { year: "", text: "" })} label="연혁 추가" />
      </SectionCard>
    </>
  );
}
