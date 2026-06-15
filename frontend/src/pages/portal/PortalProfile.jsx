/**
 * 포털 프로필 설정 — 본인 변호사 프로필만 편집 가능
 * - 다른 변호사 프로필 수정·열람 불가
 * - 사진은 로컬 파일 업로드 방식 (URL 직접 입력 불가)
 * - 순서 변경·타인 프로필 편집은 /admin 에서만 가능
 */
import { useState, useEffect, useRef } from "react";
import { portalApi } from "../../utils/api";
import { T, fieldStyle, labelStyle, pageHeaderStyle, pageHeaderIconStyle } from "./portalStyles";
import {
  User,
  GraduationCap,
  Briefcase,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Upload,
  X,
  Lock,
} from "lucide-react";
import { showToast } from "../../utils/showToast";

const POSITION_OPTIONS = [
  "대표변호사",
  "변호사",
  "전문위원",
  "직원",
];

const SUB_TABS = [
  { key: "basic",      label: "기본 정보",       Icon: User },
  { key: "career",     label: "학력 & 경력",     Icon: GraduationCap },
  { key: "fields",     label: "전문 분야",       Icon: Briefcase },
  { key: "activities", label: "활동 & 이력",     Icon: BookOpen },
  { key: "password",   label: "비밀번호 재설정", Icon: Lock },
];

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

  // 비밀번호 변경 상태
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

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
      let hasProfile = false;
      let initialForm = { ...EMPTY_FORM, email };

      if (res.data) {
        const prof = res.data;
        hasProfile = true;
        initialForm = mapToForm(prof);
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
        } catch {
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
    education: prof.education || "",
    career: prof.career || "",
    qualifications: prof.qualifications || "",
    specialties: prof.specialties || "",
    introduction: prof.introduction || "",
    consultHours: prof.consultHours || "",
    publications: prof.publications || "",
    books: prof.books || "",
    media: prof.media || "",
    columns: prof.columns || "",
    cases: prof.cases || "",
    memberships: prof.memberships || "",
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
      if (profileExists) {
        await portalApi.put("/lawyers/my-profile", form);
        showToast("프로필이 수정되었습니다", "success");
      } else {
        await portalApi.post("/lawyers/my-profile", form);
        showToast("프로필이 등록되었습니다", "success");
        setProfileExists(true);
      }
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
      {/* 페이지 헤더 배너 */}
      <div style={pageHeaderStyle}>
        <div style={pageHeaderIconStyle}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px 0", letterSpacing: -0.3 }}>내 프로필 설정</h1>
          <p style={{ fontSize: 13, margin: 0, opacity: 0.85 }}>
            홈페이지에 소개되는 본인 변호사 프로필을 편집합니다.{" "}
            <a href="/admin/lawyers" style={{ color: "rgba(255,255,255,0.8)", textDecoration: "underline" }} target="_blank" rel="noreferrer">관리자 페이지</a>에서 다른 변호사 프로필도 편집 가능합니다.
          </p>
        </div>
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
                    <label style={labelStyle}>이메일</label>
                    <input type="email" style={fieldStyle} value={form.email} onChange={field("email")} placeholder="name@highlaw.co.kr" />
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

            {/* 비밀번호 재설정 탭 */}
            {subTab === "password" && (
              <PasswordChangeForm pwForm={pwForm} setPwForm={setPwForm} pwSaving={pwSaving} setPwSaving={setPwSaving} />
            )}

            {/* 저장 버튼 — 비밀번호 탭에서는 숨김 (해당 탭 자체 버튼 사용) */}
            {subTab !== "password" && (
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
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function PasswordChangeForm({ pwForm, setPwForm, pwSaving, setPwSaving }) {
  const set = (key) => (e) => setPwForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pwForm.current) return showToast("현재 비밀번호를 입력해주세요");
    if (pwForm.next.length < 8) return showToast("새 비밀번호는 8자 이상이어야 합니다");
    if (pwForm.next !== pwForm.confirm) return showToast("새 비밀번호와 확인 비밀번호가 일치하지 않습니다");

    setPwSaving(true);
    try {
      await portalApi.post("/change-password", { currentPassword: pwForm.current, newPassword: pwForm.next });
      showToast("비밀번호가 변경되었습니다");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      showToast(err.message || "비밀번호 변경에 실패했습니다");
    } finally {
      setPwSaving(false);
    }
  };

  const inputStyle = {
    ...fieldStyle,
    marginTop: 4,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 400 }}>
      <div>
        <label style={labelStyle}>현재 비밀번호</label>
        <input type="password" value={pwForm.current} onChange={set("current")} style={inputStyle} autoComplete="current-password" required />
      </div>
      <div>
        <label style={labelStyle}>새 비밀번호 <span style={{ color: "#94a3b8", fontWeight: 400 }}>(8자 이상)</span></label>
        <input type="password" value={pwForm.next} onChange={set("next")} style={inputStyle} autoComplete="new-password" required />
      </div>
      <div>
        <label style={labelStyle}>새 비밀번호 확인</label>
        <input type="password" value={pwForm.confirm} onChange={set("confirm")} style={inputStyle} autoComplete="new-password" required />
      </div>
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
        <button
          type="submit"
          disabled={pwSaving}
          style={{
            padding: "11px 28px", fontSize: 14, fontWeight: 700,
            color: "#fff", background: T.accent, border: "none",
            borderRadius: 6, cursor: pwSaving ? "default" : "pointer",
            opacity: pwSaving ? 0.6 : 1,
          }}
        >
          {pwSaving ? "변경 중..." : "비밀번호 변경"}
        </button>
      </div>
    </form>
  );
}
