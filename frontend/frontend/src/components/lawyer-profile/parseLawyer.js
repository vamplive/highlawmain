/** API 응답 → 페이지가 기대하는 표준 모양으로 정규화.
 *  JSON 문자열로 저장된 필드를 모두 파싱하고, 누락 시 빈 배열/null 보장. */
export function parseLawyer(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameHanja: row.nameHanja || "",
    nameEn: row.nameEn || "",
    title: row.position || "",
    affiliation: "법무법인 하이로",
    team: row.team || "",
    photo: row.photoUrl || "",
    photoAlt: `${row.name} ${row.position || ""} 프로필 사진`.trim(),
    tagline: row.tagline || "",
    intro: row.introduction || "",
    consultUrl: "/consultation",
    email: row.email || "",
    phone: row.phone || "",
    consultHours: row.consultHours || "",
    blogUrl: row.blogUrl || "",
    practiceAreas: parseList(row.specialties),
    education: parseTimeline(row.education),
    career: parseTimeline(row.career),
    qualifications: parseList(row.qualifications),
    publications: parseList(row.publications),
    books: parseList(row.books),
    media: parseList(row.media),
    columns: parseList(row.columns),
    cases: parseList(row.cases),
    memberships: parseList(row.memberships),
  };
}

/** JSON 배열 또는 줄바꿈 텍스트 모두 허용 */
function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return String(value).split("\n").map((s) => s.trim()).filter(Boolean);
}

/** 학력/경력 — 객체 배열 또는 "기간 / 내용" 문자열 허용 */
function parseTimeline(value) {
  const list = parseList(value);
  return list.map((item) => {
    if (item && typeof item === "object") return { period: item.period || "", title: item.title || "", detail: item.detail || "" };
    const str = String(item);
    const slash = str.indexOf("/");
    if (slash > -1) return { period: str.slice(0, slash).trim(), title: str.slice(slash + 1).trim() };
    const m = str.match(/^([\d~\-–\s년월일현재]+)\s+(.+)$/);
    if (m) return { period: m[1].trim(), title: m[2].trim() };
    return { period: "", title: str };
  });
}
