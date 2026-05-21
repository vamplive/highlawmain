/**
 * 페이지 메타·OG·구조화 데이터를 한 컴포넌트에서 주입한다.
 * react-helmet-async 기반으로 SPA 라우트 전환 시에도 head가 갱신된다.
 *
 * OG 이미지 우선순위:
 *   1. 페이지가 `image` prop으로 직접 전달 (예: 변호사 프로필 사진)
 *   2. 관리자 사이트 매니저 → SEO 탭의 "전역 기본 OG 이미지"
 *   3. lib/seo.js의 DEFAULT_OG_IMAGE (logo.png 폴백)
 */
import { Helmet } from "react-helmet-async";
import { useSiteSettingsPage } from "../hooks/useSiteSettings";
import {
  SITE_NAME,
  SITE_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
} from "../lib/seo";

const SEO_DEFAULTS = { global: { defaultOgImage: "" } };

/**
 * @param {{
 *   title?: string,           // 페이지 제목 (없으면 사이트명만)
 *   description?: string,     // 메타 설명 (없으면 사이트 기본값)
 *   path?: string,            // 현재 라우트 경로 (canonical/og:url 계산용)
 *   canonicalUrl?: string,    // 직접 지정 canonical URL
 *   image?: string,           // OG 이미지 (절대 또는 상대 경로)
 *   noindex?: boolean,        // true면 검색엔진에서 제외 (404, 관리자 등)
 *   type?: "website"|"article", // OG type
 *   jsonLd?: object|object[]|null, // 구조화 데이터(JSON-LD). 배열이면 여러 개 주입.
 * }} props
 */
export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  canonicalUrl,
  image,
  noindex = false,
  type = "website",
  jsonLd = null,
}) {
  const { settings } = useSiteSettingsPage("seo", SEO_DEFAULTS);
  const adminDefaultOg = settings?.global?.defaultOgImage || "";

  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonical = canonicalUrl ? absoluteUrl(canonicalUrl) : absoluteUrl(path);
  const ogImage = image
    ? absoluteUrl(image)
    : (adminDefaultOg ? absoluteUrl(adminDefaultOg) : DEFAULT_OG_IMAGE);
  const jsonLdNodes = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : (jsonLd ? [jsonLd] : []);
  const cspNonce = typeof document !== "undefined"
    ? document.querySelector('meta[name="csp-nonce"]')?.getAttribute("content") || undefined
    : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="ko_KR" />
      <meta property="og:image" content={ogImage} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD 구조화 데이터 (페이지별로 0개 이상) */}
      {jsonLdNodes.map((node, i) => (
        <script
          key={`jsonld-${i}`}
          type="application/ld+json"
          nonce={cspNonce}
        >{JSON.stringify(node)}</script>
      ))}
    </Helmet>
  );
}

/** 외부에서 절대 URL이 필요한 경우를 위해 재노출 */
export { SITE_URL };
