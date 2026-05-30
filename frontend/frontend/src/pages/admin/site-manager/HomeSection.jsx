/**
 * 홈페이지 콘텐츠 편집 탭
 * 현재 홈페이지의 실제 5개 섹션에 1:1 대응
 * 1) 히어로     — HomeHero (CTA 버튼 텍스트·링크)
 * 2) 구성원     — HomePeopleSection (섹션 헤더)
 * 3) 업무분야   — HomePracticeSection (섹션 헤더)
 * 4) 소식       — HomeNewsSection (섹션 헤더)
 * 5) 하단 CTA  — HomeCtaSection (제목·체크리스트·버튼)
 */
import { FormField } from "../../../components/admin";
import { COLORS } from "../../../components/admin/styles";
import { SectionCard, ItemCard, AddButton, FieldRow } from "./shared";

/** 섹션 설명 배지 */
function InfoNote({ children }) {
  return (
    <div style={{
      padding: "8px 12px", marginBottom: 14,
      background: "rgba(11,31,58,0.05)",
      border: "1px solid rgba(11,31,58,0.08)",
      borderRadius: 6, fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6,
    }}>
      {children}
    </div>
  );
}

/** 섹션 구분선 */
function SectionDivider({ label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      margin: "4px 0 18px", color: COLORS.textMuted, fontSize: 11,
    }}>
      <div style={{ flex: 1, height: 1, background: COLORS.border }} />
      <span style={{ fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: COLORS.border }} />
    </div>
  );
}

export default function HomeSection({ settings, update, updateItem, addItem, removeItem }) {
  const s = settings;

  return (
    <>
      {/* ────────────────────────────────────────────────── */}
      {/* 섹션 1: 히어로                                     */}
      {/* ────────────────────────────────────────────────── */}
      <SectionCard title="① 히어로 섹션">
        <InfoNote>
          전체 화면을 채우는 배경 영상 위에 표시되는 CTA 버튼입니다.
          배경 영상은 <strong>히어로 영상</strong> 탭에서 관리합니다.
        </InfoNote>

        <SectionDivider label="CTA 버튼" />
        <FieldRow>
          <FormField
            label="버튼 1 — 텍스트"
            value={s["home/hero"].ctaPrimary}
            onChange={(v) => update("home/hero", "ctaPrimary", v)}
            placeholder="사건 진단"
          />
          <FormField
            label="버튼 1 — 링크"
            value={s["home/hero"].ctaPrimaryLink}
            onChange={(v) => update("home/hero", "ctaPrimaryLink", v)}
            placeholder="/consultation"
          />
        </FieldRow>
        <FieldRow>
          <FormField
            label="버튼 2 — 텍스트"
            value={s["home/hero"].ctaSecondary}
            onChange={(v) => update("home/hero", "ctaSecondary", v)}
            placeholder="전화 상담 02-6925-6757"
          />
          <FormField
            label="버튼 2 — 링크"
            value={s["home/hero"].ctaSecondaryLink}
            onChange={(v) => update("home/hero", "ctaSecondaryLink", v)}
            placeholder="tel:02-6925-6757"
          />
        </FieldRow>
      </SectionCard>

      {/* ────────────────────────────────────────────────── */}
      {/* 섹션 2: 구성원 소개                                 */}
      {/* ────────────────────────────────────────────────── */}
      <SectionCard title="② 구성원 소개 섹션">
        <InfoNote>
          변호사 카드 그리드 상단에 표시되는 레이블과 제목입니다.
          카드 데이터는 <strong>사이트 › 변호사</strong> 메뉴에서 관리합니다.
        </InfoNote>
        <FieldRow>
          <FormField
            label="Kicker (작은 영문 레이블)"
            value={s["home/peopleHeader"].kicker}
            onChange={(v) => update("home/peopleHeader", "kicker", v)}
            placeholder="Partners"
          />
          <FormField
            label="섹션 제목"
            value={s["home/peopleHeader"].title}
            onChange={(v) => update("home/peopleHeader", "title", v)}
            placeholder="구성원 소개"
          />
        </FieldRow>
      </SectionCard>

      {/* ────────────────────────────────────────────────── */}
      {/* 섹션 3: 업무분야                                    */}
      {/* ────────────────────────────────────────────────── */}
      <SectionCard title="③ 업무분야 섹션">
        <InfoNote>
          업무분야 카드 그리드 상단 레이블과 제목입니다.
          카드 데이터(게임사기·불법파견·노동·군형사 등)는 코드에 고정되어 있습니다.
        </InfoNote>
        <FieldRow>
          <FormField
            label="Kicker (작은 영문 레이블)"
            value={s["home/practiceHeader"].kicker}
            onChange={(v) => update("home/practiceHeader", "kicker", v)}
            placeholder="Practice Areas"
          />
          <FormField
            label="섹션 제목"
            value={s["home/practiceHeader"].title}
            onChange={(v) => update("home/practiceHeader", "title", v)}
            placeholder="업무분야"
          />
        </FieldRow>
      </SectionCard>

      {/* ────────────────────────────────────────────────── */}
      {/* 섹션 4: 소식 & 블로그                               */}
      {/* ────────────────────────────────────────────────── */}
      <SectionCard title="④ 소식 & 블로그 섹션">
        <InfoNote>
          최신 블로그 3건을 자동으로 표시하는 섹션의 헤더입니다.
          블로그 글은 <strong>콘텐츠 › 블로그</strong> 메뉴에서 관리합니다.
        </InfoNote>
        <FieldRow>
          <FormField
            label="Kicker (작은 영문 레이블)"
            value={s["home/newsHeader"].kicker}
            onChange={(v) => update("home/newsHeader", "kicker", v)}
            placeholder="BLOG & NEWS"
          />
          <FormField
            label="섹션 제목"
            value={s["home/newsHeader"].title}
            onChange={(v) => update("home/newsHeader", "title", v)}
            placeholder="하이로 소식 & 법률 칼럼"
          />
        </FieldRow>
        <FormField
          label="섹션 설명"
          type="textarea"
          minHeight={56}
          value={s["home/newsHeader"].description}
          onChange={(v) => update("home/newsHeader", "description", v)}
          placeholder="전문 변호사들이 직접 분석한..."
        />
      </SectionCard>

      {/* ────────────────────────────────────────────────── */}
      {/* 섹션 5: 하단 CTA                                   */}
      {/* ────────────────────────────────────────────────── */}
      <SectionCard title="⑤ 하단 CTA 섹션">
        <InfoNote>
          홈페이지 맨 아래 다크 배경의 상담 유도 배너입니다.
        </InfoNote>

        <SectionDivider label="제목" />
        <FormField
          label="제목"
          value={s["home/cta"].title}
          onChange={(v) => update("home/cta", "title", v)}
          placeholder="지금 바로 전문 변호사와 상담하세요"
        />

        <SectionDivider label="체크리스트" />
        {s["home/cta"].items.map((item, i) => (
          <ItemCard
            key={i}
            onRemove={s["home/cta"].items.length > 1 ? () => removeItem("home/cta", i) : undefined}
          >
            <FormField
              label={`항목 ${i + 1}`}
              value={item}
              onChange={(v) => updateItem("home/cta", i, null, v)}
              placeholder="체크리스트 문구"
            />
          </ItemCard>
        ))}
        <AddButton
          onClick={() => addItem("home/cta", "새 항목을 입력하세요.")}
          label="항목 추가"
        />

        <SectionDivider label="버튼" />
        <FieldRow>
          <FormField
            label="버튼 텍스트"
            value={s["home/cta"].buttonText}
            onChange={(v) => update("home/cta", "buttonText", v)}
            placeholder="상담 신청하기"
          />
          <FormField
            label="버튼 링크"
            value={s["home/cta"].buttonLink}
            onChange={(v) => update("home/cta", "buttonLink", v)}
            placeholder="/consultation"
          />
        </FieldRow>
      </SectionCard>
    </>
  );
}
