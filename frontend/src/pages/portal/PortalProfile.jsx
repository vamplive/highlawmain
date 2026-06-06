/**
 * 포털 프로필 설정 — 본인 변호사 프로필만 편집 가능
 * - 다른 변호사 프로필 수정·열람 불가
 * - 사진은 로컬 파일 업로드 방식 (URL 직접 입력 불가)
 * - 순서 변경·타인 프로필 편집은 /admin 에서만 가능
 */
import { useState, useEffect, useRef } from "react";
import { portalApi } from "../../utils/api";
import { T, fieldStyle, labelStyle } from "./portalStyles";
import {
  User,
  GraduationCap,
  Briefcase,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Upload,
  X,
} from "lucide-react";
import { showToast } from "../../utils/showToast";

const POSITION_OPTIONS = [
  "대표변호사",
  "변호사",
  "전문위원",
  "직원",
];

const SUB_TABS = [
  { key: "basic",      label: "기본 정보",    Icon: User },
  { key: "career",     label: "학력 & 경력",  Icon: GraduationCap },
  { key: "fields",     label: "전문 분야",    Icon: Briefcase },
  { key: "activities", label: "활동 & 이력",  Icon: BookOpen },
];

// JSON array or string parser helper
function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return String(value).split("\n").map((s) => s.trim()).filter(Boolean);
}

// Convert JSON array of objects/strings to newline-separated text for textarea
function jsonToText(value, keys = []) {
  const arr = parseJsonArray(value);
  return arr
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") return item;
      if (keys.length > 0) {
        const parts = keys.map((k) => (item[k] !== undefined && item[k] !== null ? String(item[k]).trim() : ""));
        while (parts.length > 0 && parts[parts.length - 1] === "") {
          parts.pop();
        }
        return parts.join(" / ");
      }
      return Object.values(item).join(" / ");
    })
    .filter(Boolean)
    .join("\n");
}

// Convert newline-separated text to JSON array of objects
function textToJSON(text, keys = []) {
  if (!text) return JSON.stringify([]);
  const lines = text.split("\n").map((s) => s.trim()).filter(Boolean);
  const arr = lines.map((line) => {
    const parts = line.split("/").map((p) => p.trim());
    if (keys.length > 0) {
      const obj = {};
      keys.forEach((key, idx) => {
        if (idx === keys.length - 1 && parts.length > keys.length) {
          obj[key] = parts.slice(idx).join(" / ");
        } else {
          obj[key] = parts[idx] || "";
        }
      });
      return obj;
    }
    return line;
  });
  return JSON.stringify(arr);
}

// Specialties helper (comma-separated strings)
function specialtiesToText(value) {
  const arr = parseJsonArray(value);
  return arr.join(", ");
}

function textToSpecialties(text) {
  if (!text) return JSON.stringify([]);
  const arr = text.split(",").map((s) => s.trim()).filter(Boolean);
  return JSON.stringify(arr);
}

// Simple list (newline-separated strings)
function listToText(value) {
  const arr = parseJsonArray(value);
  return arr.join("\n");
}

function textToList(text) {
  if (!text) return JSON.stringify([]);
  const arr = text.split("\n").map((s) => s.trim()).filter(Boolean);
  return JSON.stringify(arr);
}

const EMPTY_FORM = {
  name: "", nameEn: "", nameHanja: "",
  position: "변호사", team: "",
  photoUrl: "",
  tagline: "", email: "", phone: "", blogUrl: "",
  education: "", career: "", qualifications: "",
  specialties: "", introduction: "", consultHours: "",
  publications: "", books: "", media: "", columns: "",
  cases: "", memberships: "",
};

export default function PortalProfile() {
  const [subTab, setSubTab] = useState("basic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // 사진 업로드 상태
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const meRes = await portalApi.get("/me");
      const email = meRes.data?.user?.email || "";

      const res = await portalApi.get("/lawyers/my-profile");
      let initialForm = EMPTY_FORM;
      let hasProfile = false;

      if (res.data) {
        const prof = res.data;
        hasProfile = true;
        initialForm = mapToForm(prof);
      } else {
        hasProfile = false;
        initialForm = { ...EMPTY_FORM, email };
      }

      // 로컬 스토리지에 미저장 임시본이 있는지 확인
      const draftKey = `portal_profile_draft_${email}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          // 임시본이 서버 데이터와 다른 경우에만 복구 의사 타진
          const isDifferent = Object.keys(initialForm).some(
            (key) => String(initialForm[key]) !== String(parsedDraft[key])
          );
          if (isDifferent) {
            if (window.confirm("이전에 작성 중이던 임시 저장본이 있습니다. 불러오시겠습니까?")) {
              setProfileExists(hasProfile);
              setForm(parsedDraft);
              setPhotoPreview(parsedDraft.photoUrl || null);
              setLoading(false);
              return;
            } else {
              localStorage.removeItem(draftKey);
            }
          }
        } catch (e) {
          localStorage.removeItem(draftKey);
        }
      }

      setProfileExists(hasProfile);
      setForm(initialForm);
      setPhotoPreview(initialForm.photoUrl || null);
    } catch {
      setProfileExists(false);
    } finally {
      setLoading(false);
    }
  };

  // 입력 변경 시마다 실시간 자동 임시저장
  useEffect(() => {
    if (loading || !form.email) return;
    localStorage.setItem(`portal_profile_draft_${form.email}`, JSON.stringify(form));
  }, [form, loading]);


  const mapToForm = (prof) => ({
    name: prof.name || "",
    nameEn: prof.nameEn || "",
    nameHanja: prof.nameHanja || "",
    position: prof.position || "변호사",
    team: prof.team || "",
    photoUrl: prof.photoUrl || "",
    tagline: prof.tagline || "",
    email: prof.email || "",
    phone: prof.phone || "",
    blogUrl: prof.blogUrl || "",
    education: jsonToText(prof.education, ["period", "title", "detail"]),
    career: jsonToText(prof.career, ["period", "title", "detail"]),
    qualifications: listToText(prof.qualifications),
    specialties: specialtiesToText(prof.specialties),
    introduction: prof.introduction || "",
    consultHours: prof.consultHours || "",
    publications: jsonToText(prof.publications, ["year", "title", "journal", "url"]),
    books: jsonToText(prof.books, ["year", "title", "publisher", "role"]),
    media: jsonToText(prof.media, ["date", "outlet", "title", "url"]),
    columns: jsonToText(prof.columns, ["date", "title", "excerpt", "url"]),
    cases: jsonToText(prof.cases, ["year", "category", "caseNumber", "description", "outcome"]),
    memberships: listToText(prof.memberships),
  });

  const field = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // 로컬 파일 선택 → 서버 업로드
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 로컬 미리보기
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);

    // 서버 업로드
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);

      const json = await portalApi.upload("/upload-photo", formData);

      setForm((prev) => ({ ...prev, photoUrl: json.data.url }));
      showToast("사진이 업로드되었습니다", "success");
    } catch (err) {
      showToast(err.message || "사진 업로드에 실패했습니다", "error");
      setPhotoPreview(form.photoUrl || null);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setForm((prev) => ({ ...prev, photoUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast("이름을 입력해주세요", "error");

    setSaving(true);
    try {
      const payload = {
        ...form,
        education: textToJSON(form.education, ["period", "title", "detail"]),
        career: textToJSON(form.career, ["period", "title", "detail"]),
        qualifications: textToList(form.qualifications),
        specialties: textToSpecialties(form.specialties),
        publications: textToJSON(form.publications, ["year", "title", "journal", "url"]),
        books: textToJSON(form.books, ["year", "title", "publisher", "role"]),
        media: textToJSON(form.media, ["date", "outlet", "title", "url"]),
        columns: textToJSON(form.columns, ["date", "title", "excerpt", "url"]),
        cases: textToJSON(form.cases, ["year", "category", "caseNumber", "description", "outcome"]),
        memberships: textToList(form.memberships),
      };

      if (profileExists) {
        await portalApi.put("/lawyers/my-profile", payload);
        showToast("프로필이 수정되었습니다", "success");
      } else {
        await portalApi.post("/lawyers/my-profile", payload);
        showToast("프로필이 등록되었습니다", "success");
        setProfileExists(true);
      }
      // 저장 성공 시 임시본 삭제
      localStorage.removeItem(`portal_profile_draft_${form.email}`);
    } catch (err) {
      showToast(err.message || "저장에 실패했습니다", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center", color: T.textMuted, fontSize: 14 }}>
        프로필 정보를 불러오는 중...
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 6 }}>
          내 프로필 설정
        </h1>
        <p style={{ fontSize: 13, color: T.textSec }}>
          홈페이지에 소개되는 본인 변호사 프로필을 편집합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{
          display: "grid", gridTemplateColumns: "180px 1fr", gap: 24,
          background: "#fff", borderRadius: 12, border: `1px solid ${T.border}`,
          padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}>

          {/* 왼쪽 사이드 탭 메뉴 */}
          <div style={{ borderRight: `1px solid ${T.border}`, paddingRight: 16 }}>
            {SUB_TABS.map(({ key, label, Icon }) => {
              const active = subTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSubTab(key)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 12px", marginBottom: 4,
                    border: "none", borderRadius: 6,
                    fontSize: 13, fontWeight: 600, textAlign: "left", cursor: "pointer",
                    background: active ? "rgba(201,168,76,0.10)" : "transparent",
                    color: active ? T.accent : T.textSec,
                    transition: "all 0.15s",
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}

            {/* 프로필 상태 배지 */}
            <div style={{ marginTop: 20 }}>
              {profileExists ? (
                <div style={{ padding: "8px 10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, fontSize: 11, color: "#166534", display: "flex", alignItems: "center", gap: 5 }}>
                  <CheckCircle size={12} /> 홈페이지 노출 중
                </div>
              ) : (
                <div style={{ padding: "8px 10px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, fontSize: 11, color: "#92400e", display: "flex", alignItems: "center", gap: 5 }}>
                  <HelpCircle size={12} /> 프로필 미등록
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽 폼 영역 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 4px", paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>
              {SUB_TABS.find((t) => t.key === subTab)?.label}
            </h3>

            {/* 기본 정보 탭 */}
            {subTab === "basic" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* 프로필 사진 — 로컬 파일 업로드 */}
                <div>
                  <label style={labelStyle}>프로필 사진</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {/* 미리보기 */}
                    <div style={{
                      width: 80, height: 80, borderRadius: 8, overflow: "hidden",
                      border: `1px solid ${T.border}`, background: "#f8f8f8",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {photoPreview ? (
                        <img src={photoPreview} alt="프로필" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <User size={28} style={{ color: "#c0c0c0" }} />
                      )}
                    </div>

                    {/* 버튼 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: "none" }}
                        onChange={handlePhotoSelect}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={photoUploading}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "8px 14px", fontSize: 12, fontWeight: 600,
                          color: T.accent, background: "rgba(201,168,76,0.08)",
                          border: `1px solid rgba(201,168,76,0.4)`, borderRadius: 6,
                          cursor: photoUploading ? "default" : "pointer",
                          opacity: photoUploading ? 0.6 : 1,
                        }}
                      >
                        <Upload size={13} />
                        {photoUploading ? "업로드 중..." : "내 컴퓨터에서 선택"}
                      </button>
                      {photoPreview && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "6px 14px", fontSize: 12,
                            color: "#c62828", background: "transparent",
                            border: "1px solid #ffcdd2", borderRadius: 6, cursor: "pointer",
                          }}
                        >
                          <X size={12} /> 사진 제거
                        </button>
                      )}
                      <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>
                        JPG·PNG·WebP, 최대 5MB
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>이름 *</label>
                    <input style={fieldStyle} value={form.name} onChange={field("name")} required placeholder="홍길동" />
                  </div>
                  <div>
                    <label style={labelStyle}>직급</label>
                    <select style={{ ...fieldStyle, appearance: "none" }} value={form.position} onChange={field("position")}>
                      {POSITION_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>영문 이름</label>
                    <input style={fieldStyle} value={form.nameEn} onChange={field("nameEn")} placeholder="Hong Gil Dong" />
                  </div>
                  <div>
                    <label style={labelStyle}>한자 이름</label>
                    <input style={fieldStyle} value={form.nameHanja} onChange={field("nameHanja")} placeholder="洪吉童" />
                  </div>
                  <div>
                    <label style={labelStyle}>소속 팀</label>
                    <input style={fieldStyle} value={form.team} onChange={field("team")} placeholder="기업법무팀" />
                  </div>
                  <div>
                    <label style={labelStyle}>이메일 *</label>
                    <input type="email" style={{ ...fieldStyle, background: "#f5f5f5", cursor: "not-allowed" }} value={form.email} disabled />
                  </div>
                  <div>
                    <label style={labelStyle}>연락처</label>
                    <input style={fieldStyle} value={form.phone} onChange={field("phone")} placeholder="02-1234-5678" />
                  </div>
                  <div>
                    <label style={labelStyle}>개인 블로그 URL</label>
                    <input style={fieldStyle} value={form.blogUrl} onChange={field("blogUrl")} placeholder="https://blog.naver.com/..." />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={labelStyle}>슬로건 / 한줄 소개</label>
                    <input style={fieldStyle} value={form.tagline} onChange={field("tagline")} placeholder="신뢰와 정성으로 의뢰인과 동행합니다." />
                  </div>
                </div>
              </div>
            )}

            {/* 학력 & 경력 탭 */}
            {subTab === "career" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>학력 (한 줄에 하나씩)</label>
                  <textarea style={{ ...fieldStyle, height: 110, resize: "vertical" }} value={form.education} onChange={field("education")} placeholder={"서울대학교 법과대학 졸업\n미국 NYU 로스쿨 LL.M 수료"} />
                </div>
                <div>
                  <label style={labelStyle}>경력 (한 줄에 하나씩)</label>
                  <textarea style={{ ...fieldStyle, height: 140, resize: "vertical" }} value={form.career} onChange={field("career")} placeholder={"제50회 사법시험 합격\n사법연수원 제40기 수료\n서울중앙지방검찰청 검사"} />
                </div>
                <div>
                  <label style={labelStyle}>주요 자격</label>
                  <textarea style={{ ...fieldStyle, height: 80, resize: "vertical" }} value={form.qualifications} onChange={field("qualifications")} placeholder="변리사 자격 취득" />
                </div>
              </div>
            )}

            {/* 전문 분야 탭 */}
            {subTab === "fields" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={labelStyle}>전문 업무 분야 (쉼표 구분)</label>
                  <input style={fieldStyle} value={form.specialties} onChange={field("specialties")} placeholder="건설 분쟁, 부동산, 형사" />
                </div>
                <div>
                  <label style={labelStyle}>상담 가능 시간</label>
                  <input style={fieldStyle} value={form.consultHours} onChange={field("consultHours")} placeholder="평일 09:00~18:00" />
                </div>
                <div>
                  <label style={labelStyle}>상세 소개글</label>
                  <textarea style={{ ...fieldStyle, height: 160, resize: "vertical" }} value={form.introduction} onChange={field("introduction")} placeholder="변호 철학과 강점을 서술해 주세요." />
                </div>
              </div>
            )}

            {/* 활동 & 이력 탭 */}
            {subTab === "activities" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>학술 발표 / 논문</label>
                  <textarea style={{ ...fieldStyle, height: 100, resize: "vertical" }} value={form.publications} onChange={field("publications")} placeholder="건설 하도급법 연구 (2023)" />
                </div>
                <div>
                  <label style={labelStyle}>저서</label>
                  <textarea style={{ ...fieldStyle, height: 100, resize: "vertical" }} value={form.books} onChange={field("books")} placeholder="부동산 거래의 실무 (2022)" />
                </div>
                <div>
                  <label style={labelStyle}>언론 보도 / 방송</label>
                  <textarea style={{ ...fieldStyle, height: 100, resize: "vertical" }} value={form.media} onChange={field("media")} placeholder="KBS 뉴스 출연 (2024)" />
                </div>
                <div>
                  <label style={labelStyle}>기고 칼럼</label>
                  <textarea style={{ ...fieldStyle, height: 100, resize: "vertical" }} value={form.columns} onChange={field("columns")} placeholder="법률신문 기고 (2023)" />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>주요 수행 사건</label>
                  <textarea style={{ ...fieldStyle, height: 90, resize: "vertical" }} value={form.cases} onChange={field("cases")} placeholder="공사대금 청구 소송 승소&#10;주택조합 설립인가 무효 소송 승소" />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>소속 협회 / 사회 활동</label>
                  <textarea style={{ ...fieldStyle, height: 80, resize: "vertical" }} value={form.memberships} onChange={field("memberships")} placeholder="대한변호사협회 건설전문변호사 등록" />
                </div>
              </div>
            )}

            {/* 저장 버튼 */}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "11px 28px", fontSize: 14, fontWeight: 700,
                  color: "#fff", background: T.accent, border: "none",
                  borderRadius: 6, cursor: saving ? "default" : "pointer",
                  opacity: saving ? 0.6 : 1, transition: "opacity 0.2s",
                }}
              >
                {saving ? "저장 중..." : profileExists ? "프로필 수정" : "프로필 등록"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
