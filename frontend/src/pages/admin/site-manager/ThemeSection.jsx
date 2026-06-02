/** 테마 색상 편집 탭 */
import { SectionCard, ColorPickerField } from "./shared";

const COLOR_FIELDS = [
  { key: "accentGold", label: "악센트 골드" },
  { key: "accentGoldHover", label: "악센트 골드 (호버)" },
  { key: "heroDark", label: "히어로 배경 (다크)" },
  { key: "textPrimary", label: "기본 텍스트" },
  { key: "textSecondary", label: "보조 텍스트" },
];

export default function ThemeSection({ settings, update }) {
  const colors = settings["theme/colors"];

  return (
    <SectionCard title="테마 색상">
      {COLOR_FIELDS.map((cf) => (
        <div key={cf.key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <ColorPickerField
            label={cf.label}
            value={colors[cf.key]}
            onChange={(v) => {
              const next = { ...colors, [cf.key]: v };
              update("theme/colors", null, next);
            }}
          />
        </div>
      ))}
    </SectionCard>
  );
}
