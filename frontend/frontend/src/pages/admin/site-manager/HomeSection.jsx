/**
 * 홈페이지 콘텐츠 편집 탭
 * — 현재 홈페이지 실제 구조(히어로 · 업무분야 헤더 · CTA) 기반
 */
import { FormField } from "../../../components/admin";
import { COLORS, outlineBtnStyle } from "../../../components/admin/styles";
import { SectionCard, ItemCard, AddButton, FieldRow } from "./shared";

export default function HomeSection({ settings, update, updateItem, addItem, removeItem }) {
  const s = settings;

  return (
    <>
      {/* ── 1. 히어로 섹션 ── */}
      <SectionCard title="히어로 섹션">
        <div style={{ marginBottom: 8, fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6 }}>
          메인 화면 전체를 채우는 영상 위에 표시되는 제목·부제·CTA 버튼입니다.
        </div>
        <FieldRow>
          <FormField
            label="주 제목 (heading)"
            value={s["home/hero"].heading}
            onChange={(v) => update("home/hero", "heading", v)}
            placeholder="산재·중대재해, 군사건, 게임사기"
          />
          <FormField
            label="부 제목 (subheading)"
            value={s["home/hero"].subheading}
            onChange={(v) => update("home/hero", "subheading", v)}
            placeholder="법무법인 하이로"
          />
        </FieldRow>
        <FormField
          label="태그라인 (제목 아래 한 줄 문구)"
          value={s["home/hero"].tagline}
          onChange={(v) => update("home/hero", "tagline", v)}
          placeholder="사건 결과로 증명합니다"
        />
        <div style={{ height: 16 }} />
        <FieldRow>
          <FormField
            label="CTA 버튼 1 — 텍스트"
            value={s["home/hero"].ctaPrimary}
            onChange={(v) => update("home/hero", "ctaPrimary", v)}
            placeholder="30초 무료 사건 진단"
          />
          <FormField
            label="CTA 버튼 1 — 링크"
            value={s["home/hero"].ctaPrimaryLink}
            onChange={(v) => update("home/hero", "ctaPrimaryLink", v)}
            placeholder="/consultation"
          />
        </FieldRow>
        <FieldRow>
          <FormField
            label="CTA 버튼 2 — 텍스트"
            value={s["home/hero"].ctaSecondary}
            onChange={(v) => update("home/hero", "ctaSecondary", v)}
            placeholder="전화 상담 02-594-5583"
          />
          <FormField
            label="CTA 버튼 2 — 링크"
            value={s["home/hero"].ctaSecondaryLink}
            onChange={(v) => update("home/hero", "ctaSecondaryLink", v)}
            placeholder="tel:02-594-5583"
          />
        </FieldRow>
        <div style={{ marginTop: 8, padding: "8px 12px", background: COLORS.navyLight || "rgba(11,31,58,0.06)", borderRadius: 6, fontSize: 11.5, color: COLORS.textMuted }}>
          💡 히어로 배경 영상은 <strong>사이트 › 히어로 영상</strong> 탭에서 관리합니다.
        </div>
      </SectionCard>

      {/* ── 2. 업무분야 섹션 헤더 ── */}
      <SectionCard title="업무분야 섹션 헤더">
        <div style={{ marginBottom: 8, fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6 }}>
          홈페이지 중간에 표시되는 업무분야 섹션의 상단 레이블과 제목입니다.
        </div>
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
        <div style={{ marginTop: 8, padding: "8px 12px", background: COLORS.navyLight || "rgba(11,31,58,0.06)", borderRadius: 6, fontSize: 11.5, color: COLORS.textMuted }}>
          💡 업무분야 카드(게임사기·불법파견·노동·군형사 등)는 <strong>코드 상 고정</strong>되어 있습니다.
          내용 수정은 개발자에게 요청해 주세요.
        </div>
      </SectionCard>

      {/* ── 3. 하단 CTA 섹션 ── */}
      <SectionCard title="하단 CTA 섹션">
        <div style={{ marginBottom: 8, fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6 }}>
          홈페이지 하단 다크 배경의 상담 유도 배너입니다.
        </div>
        <FormField
          label="제목"
          value={s["home/cta"].title}
          onChange={(v) => update("home/cta", "title", v)}
          placeholder="지금 바로 전문 변호사와 상담하세요"
        />
        <div style={{ marginTop: 16, marginBottom: 6, fontSize: 11.5, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          체크리스트 항목
        </div>
        {s["home/cta"].items.map((item, i) => (
          <ItemCard
            key={i}
            onRemove={s["home/cta"].items.length > 1 ? () => removeItem("home/cta", i) : undefined}
          >
            <FormField
              label={`항목 ${i + 1}`}
              value={item}
              onChange={(v) => updateItem("home/cta", i, null, v)}
              placeholder="체크리스트 문구를 입력하세요"
            />
          </ItemCard>
        ))}
        <AddButton
          onClick={() => addItem("home/cta", "새 항목을 입력하세요.")}
          label="항목 추가"
        />
        <div style={{ height: 16 }} />
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

      {/* ── 4. 안내 — 나머지 섹션 ── */}
      <div style={{
        padding: "20px 24px",
        background: COLORS.bgForm,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 1.8,
      }}>
        <strong style={{ color: COLORS.text, display: "block", marginBottom: 10 }}>
          기타 홈페이지 섹션 관리
        </strong>
        <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc" }}>
          <li><strong>히어로 배경 영상</strong> — 상단 <strong>히어로 영상</strong> 탭</li>
          <li><strong>변호사 소개 섹션</strong> — 사이드바 <strong>사이트 › 변호사</strong> 메뉴</li>
          <li><strong>뉴스·블로그 섹션</strong> — 사이드바 <strong>콘텐츠 › 블로그</strong> 메뉴</li>
          <li><strong>헤더 네비게이션 / 푸터</strong> — 상단 <strong>공통 (헤더/푸터)</strong> 탭</li>
          <li><strong>공지·배너</strong> — 상단 <strong>공지/배너</strong> 탭</li>
        </ul>
      </div>
    </>
  );
}
