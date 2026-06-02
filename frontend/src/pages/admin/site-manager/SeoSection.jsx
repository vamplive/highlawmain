/** SEO 설정 편집 탭 — 페이지별 메타태그/OG/검색 미리보기 + 전역 기본 OG 이미지 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api";
import { TOAST_DURATION_MS } from "../../../utils/timing";
import { FormField } from "../../../components/admin";
import { COLORS, btnStyle } from "../../../components/admin/styles";
import MediaPicker from "../../../components/MediaPicker";
import { SectionCard } from "./shared";
import { SEO_PAGES } from "./constants";
import { showToast } from "../../../utils/showToast";
import { SITE_URL } from "../../../lib/seo";

export default function SeoSection({ setToast }) {
  const [seoPage, setSeoPage] = useState("home");
  const [seoData, setSeoData] = useState({});
  const [seoSaving, setSeoSaving] = useState(false);
  const [globalOg, setGlobalOg] = useState("");
  const [globalSaving, setGlobalSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null);

  // 전역 기본 OG 이미지 로드
  useEffect(() => {
    api.get("/site-settings?page=seo").then((json) => {
      const rows = json.data ?? [];
      const row = rows.find((r) => r.section === "global");
      if (row) {
        const v = typeof row.content === "string" ? safeParse(row.content) : row.content;
        setGlobalOg(v?.defaultOgImage || "");
      }
    }).catch(() => {});
  }, []);

  const saveGlobalOg = async () => {
    setGlobalSaving(true);
    try {
      await api.post("/site-settings/bulk", {
        settings: [{ page: "seo", section: "global", content: { defaultOgImage: globalOg } }],
      });
      setToast("전역 OG 이미지가 저장되었습니다");
      setTimeout(() => setToast(""), TOAST_DURATION_MS);
    } catch (err) {
      showToast("저장 실패: " + err.message);
    } finally {
      setGlobalSaving(false);
    }
  };

  const openPicker = (target) => {
    setPickerTarget(target);
    setPickerOpen(true);
  };
  const handlePick = (file) => {
    const url = file.url || file.path || "";
    if (pickerTarget === "global") setGlobalOg(url);
    else if (pickerTarget === "page") updateSeo("ogImage", url);
  };

  const loadSeoPage = useCallback((pageKey) => {
    api.get("/site-settings?page=seo").then((json) => {
      const rows = json.data ?? [];
      const row = rows.find((r) => r.section === pageKey);
      if (row) {
        try {
          const parsed = typeof row.content === "string" ? JSON.parse(row.content) : row.content;
          setSeoData((prev) => ({ ...prev, [pageKey]: parsed }));
        } catch {
          setSeoData((prev) => ({ ...prev, [pageKey]: {} }));
        }
      } else {
        setSeoData((prev) => ({ ...prev, [pageKey]: prev[pageKey] || {} }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadSeoPage(seoPage);
  }, [seoPage, loadSeoPage]);

  const saveSeoPage = async (pageKey) => {
    setSeoSaving(true);
    try {
      await api.post("/site-settings/bulk", {
        settings: [{ page: "seo", section: pageKey, content: seoData[pageKey] || {} }],
      });
      setToast("SEO 설정이 저장되었습니다");
      setTimeout(() => setToast(""), TOAST_DURATION_MS);
    } catch (err) {
      showToast("SEO 저장 실패: " + err.message);
    } finally {
      setSeoSaving(false);
    }
  };

  const updateSeo = (field, value) => {
    setSeoData((prev) => ({
      ...prev,
      [seoPage]: { ...(prev[seoPage] || {}), [field]: value },
    }));
  };

  const data = seoData[seoPage] || {};
  const pageInfo = SEO_PAGES.find((p) => p.key === seoPage);
  const descLen = (data.metaDescription || "").length;

  return (
    <>
      {/* 전역 기본 OG 이미지 — 페이지별 OG가 없을 때 사용되는 폴백 */}
      <SectionCard title="전역 기본 OG 이미지 (카카오톡·페이스북 공유)">
        <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
          링크를 카카오톡·페이스북·트위터에 공유할 때 노출되는 기본 이미지입니다.
          페이지별로 별도 이미지를 지정하지 않으면 이 이미지가 사용됩니다.
          권장 크기: <strong>1200 × 630</strong> (1.91:1), 최대 5MB, JPG/PNG.
        </p>
        <FormField
          label="이미지 URL"
          value={globalOg}
          onChange={setGlobalOg}
          placeholder="https://highlaw.co.kr/og-image.png 또는 /og-image.png"
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => openPicker("global")} style={btnStyle(COLORS.textSecondary)}>
            미디어 라이브러리에서 선택
          </button>
          {globalOg && (
            <img
              src={globalOg.startsWith("http") ? globalOg : `${SITE_URL}${globalOg}`}
              alt="OG 미리보기"
              style={{ height: 80, borderRadius: 4, border: `1px solid ${COLORS.border}` }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          )}
          <button
            onClick={saveGlobalOg}
            disabled={globalSaving}
            style={{ ...btnStyle(COLORS.accent), marginLeft: "auto" }}
          >
            {globalSaving ? "저장 중..." : "전역 OG 저장"}
          </button>
        </div>
        <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 12, lineHeight: 1.6 }}>
          <strong>카카오톡 캐시 갱신:</strong> 카카오는 이미지를 7일간 캐시합니다.
          저장 후에도 옛 이미지가 보이면 <a href="https://developers.kakao.com/tool/debugger/sharing" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.accent }}>카카오 공유 디버거</a>에서
          URL을 입력하고 "캐시 무효화" 버튼을 눌러주세요.
          페이스북은 <a href="https://developers.facebook.com/tools/debug/" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.accent }}>공유 디버거</a> 사용.
        </p>
      </SectionCard>

      {/* 페이지 서브탭 */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
        {SEO_PAGES.map((p) => (
          <button
            key={p.key}
            onClick={() => setSeoPage(p.key)}
            style={{
              padding: "6px 14px", fontSize: 12, fontWeight: seoPage === p.key ? 600 : 400,
              color: seoPage === p.key ? "#fff" : COLORS.textSecondary,
              background: seoPage === p.key ? COLORS.accent : "rgba(26,58,107,0.08)",
              border: "none", borderRadius: 4, cursor: "pointer",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <SectionCard title={`SEO 설정 — ${pageInfo?.label || seoPage}`}>
        <FormField
          label="메타 타이틀"
          value={data.metaTitle || ""}
          onChange={(v) => updateSeo("metaTitle", v)}
          placeholder="페이지 제목 (60자 이내 권장)"
        />
        <div style={{ marginTop: 12 }}>
          <FormField
            label="메타 설명"
            type="textarea"
            minHeight={72}
            value={data.metaDescription || ""}
            onChange={(v) => updateSeo("metaDescription", v)}
            placeholder="페이지 설명 (160자 이내 권장)"
          />
          <div style={{
            fontSize: 11, marginTop: 4, textAlign: "right",
            color: descLen > 160 ? COLORS.danger : COLORS.textMuted,
          }}>
            {descLen}/160
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <FormField
            label="키워드"
            value={data.keywords || ""}
            onChange={(v) => updateSeo("keywords", v)}
            placeholder="쉼표로 구분 (예: 법률사무소, 변호사, 상담)"
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <FormField
            label="OG 이미지 URL (이 페이지 전용 — 비우면 전역 기본값 사용)"
            value={data.ogImage || ""}
            onChange={(v) => updateSeo("ogImage", v)}
            placeholder="https://example.com/og-image.png"
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => openPicker("page")} style={btnStyle(COLORS.textSecondary)}>
              미디어 라이브러리에서 선택
            </button>
            {data.ogImage && (
              <img
                src={data.ogImage.startsWith("http") ? data.ogImage : `${SITE_URL}${data.ogImage}`}
                alt="페이지 OG 미리보기"
                style={{ height: 60, borderRadius: 4, border: `1px solid ${COLORS.border}` }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
          </div>
        </div>
      </SectionCard>

      {/* Google 검색 미리보기 */}
      <SectionCard title="Google 검색 미리보기">
        <div style={{
          background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8,
          padding: 20, maxWidth: 600,
        }}>
          <div style={{
            fontSize: 18, color: "#1a0dab", fontWeight: 400,
            marginBottom: 4, cursor: "pointer",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {data.metaTitle || `${pageInfo?.label || ""} | 법무법인 하이로`}
          </div>
          <div style={{ fontSize: 13, color: "#006621", marginBottom: 4 }}>
            {SITE_URL}{pageInfo?.url || "/"}
          </div>
          <div style={{
            fontSize: 13, color: "#545454", lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {data.metaDescription || "메타 설명을 입력하면 여기에 표시됩니다."}
          </div>
        </div>
      </SectionCard>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={() => saveSeoPage(seoPage)} disabled={seoSaving} style={btnStyle(COLORS.accent)}>
          {seoSaving ? "저장 중..." : "SEO 저장"}
        </button>
      </div>

      <MediaPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePick}
        accept="image"
      />
    </>
  );
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
