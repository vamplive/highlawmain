/**
 * SEO 상수와 JSON-LD 빌더 — 사이트 전역 메타 정보의 단일 진실 공급원.
 *
 * 도메인은 빌드 시점 환경 변수(VITE_SITE_URL)로 덮어쓸 수 있고,
 * 미설정 시 기본값(highlaw.co.kr)을 사용한다. backend/SITE_URL과 동일하게 유지해야 한다.
 */

const RAW_SITE_URL = import.meta.env.VITE_SITE_URL || "https://highlaw.co.kr";
/** 끝의 슬래시 제거된 사이트 URL */
export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, "");

export const SITE_NAME = "법무법인 하이로";
export const SITE_NAME_EN = "HIGH & LAW FIRM";

export const DEFAULT_DESCRIPTION =
  "법무법인 하이로 — 불법파견·게임사기·노동·군사건 특화 로펌. 강남 테헤란로, 전문 변호사가 직접 상담합니다.";

/** OG 이미지 기본값 (1200x630 공유 이미지 권장) */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

/** 사무소 연락처 — JSON-LD와 페이지 푸터에서 공통 사용 */
export const OFFICE_CONTACT = {
  telephone: "+82-2-594-5583",
  streetAddress: "테헤란로 141, 15층",
  addressLocality: "강남구",
  addressRegion: "서울특별시",
  postalCode: "06164",
  addressCountry: "KR",
  businessRegistrationNumber: "433-86-04078",
};

/**
 * 절대 URL 생성. path가 이미 절대 URL이면 그대로 반환한다.
 * @param {string} path
 * @returns {string}
 */
export function absoluteUrl(path = "/") {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

/**
 * 사이트 단위 LegalService 구조화 데이터 (홈/About 등 대표 페이지용).
 * index.html의 정적 JSON-LD와 중복되지만, SPA 페이지 전환 시에도 안정적으로
 * 노출되도록 동적 주입한다.
 */
export function buildLegalServiceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: SITE_NAME,
    alternateName: SITE_NAME_EN,
    url: SITE_URL,
    telephone: OFFICE_CONTACT.telephone,
    address: {
      "@type": "PostalAddress",
      streetAddress: OFFICE_CONTACT.streetAddress,
      addressLocality: OFFICE_CONTACT.addressLocality,
      addressRegion: OFFICE_CONTACT.addressRegion,
      postalCode: OFFICE_CONTACT.postalCode,
      addressCountry: OFFICE_CONTACT.addressCountry,
    },
    description: DEFAULT_DESCRIPTION,
    image: DEFAULT_OG_IMAGE,
    areaServed: { "@type": "City", name: "서울특별시" },
    priceRange: "₩₩",
    serviceType: ["불법파견", "게임사기", "노동", "군사건"],
  };
}

/**
 * 변호사 1인의 Person/Attorney JSON-LD를 생성한다.
 * @param {{
 *   name: string,
 *   jobTitle?: string,
 *   image?: string,
 *   email?: string,
 *   telephone?: string,
 *   bio?: string,
 *   alumniOf?: string[],
 *   memberOf?: string[],
 *   sameAs?: string[],
 * }} lawyer
 */
export function buildAttorneyJsonLd(lawyer) {
  if (!lawyer || !lawyer.name) return null;
  const node = {
    "@context": "https://schema.org",
    "@type": "Attorney",
    name: lawyer.name,
    jobTitle: lawyer.jobTitle || "변호사",
    worksFor: { "@type": "LegalService", name: SITE_NAME, url: SITE_URL },
    address: {
      "@type": "PostalAddress",
      streetAddress: OFFICE_CONTACT.streetAddress,
      addressLocality: OFFICE_CONTACT.addressLocality,
      addressRegion: OFFICE_CONTACT.addressRegion,
      addressCountry: OFFICE_CONTACT.addressCountry,
    },
  };
  if (lawyer.image) node.image = absoluteUrl(lawyer.image);
  if (lawyer.email) node.email = lawyer.email;
  if (lawyer.telephone) node.telephone = lawyer.telephone;
  if (lawyer.bio) node.description = lawyer.bio;
  if (lawyer.alumniOf?.length) node.alumniOf = lawyer.alumniOf;
  if (lawyer.memberOf?.length) node.memberOf = lawyer.memberOf;
  if (lawyer.sameAs?.length) node.sameAs = lawyer.sameAs;
  return node;
}

/**
 * 블로그/판례 글의 Article JSON-LD를 생성한다.
 * @param {{
 *   title: string,
 *   description?: string,
 *   slug: string,
 *   image?: string,
 *   author?: string,
 *   datePublished?: string,
 *   dateModified?: string,
 * }} post
 * @param {string} pathPrefix - "/blog" 등 라우트 prefix
 */
export function buildArticleJsonLd(post, pathPrefix = "/blog") {
  if (!post || !post.title) return null;
  const url = absoluteUrl(`${pathPrefix}/${post.slug}`);
  const node = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: DEFAULT_OG_IMAGE },
    },
  };
  if (post.description) node.description = post.description;
  if (post.image) node.image = absoluteUrl(post.image);
  if (post.author) node.author = { "@type": "Person", name: post.author };
  if (post.datePublished) node.datePublished = post.datePublished;
  if (post.dateModified) node.dateModified = post.dateModified;
  return node;
}

/**
 * BreadcrumbList JSON-LD 빌더.
 * @param {Array<{ name: string, path: string }>} items - 루트부터 현재 페이지까지
 */
export function buildBreadcrumbJsonLd(items) {
  if (!items?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}
