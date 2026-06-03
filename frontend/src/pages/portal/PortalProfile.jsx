import { useState, useEffect } from "react";
import { portalApi } from "../../utils/api";
import { T, fieldStyle, labelStyle } from "./portalStyles";
import {
  User,
  Settings,
  Shield,
  ArrowUp,
  ArrowDown,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  CheckCircle,
  HelpCircle,
  Briefcase,
  GraduationCap,
  BookOpen,
  Mail,
  Phone as PhoneIcon,
  Globe,
  Clock
} from "lucide-react";

export default function PortalProfile() {
  // 탭 상태: "my" | "admin"
  const [activeTab, setActiveTab] = useState("my");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 현재 사용자 세션 정보
  const [userSession, setUserSession] = useState(null);

  // 내 프로필 상태
  const [myProfile, setMyProfile] = useState(null);
  const [profileExists, setProfileExists] = useState(false);

  // 어드민: 전체 변호사 목록
  const [allLawyers, setAllLawyers] = useState([]);

  // 내 프로필 폼 서브탭: "basic" | "career" | "fields" | "activities"
  const [mySubTab, setMySubTab] = useState("basic");

  // 모달 상태 (어드민 추가/수정용)
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEditingId, setAdminEditingId] = useState(null);
  const [adminSubTab, setAdminSubTab] = useState("basic");

  // 폼 입력 필드 상태
  const [formFields, setFormFields] = useState({
    name: "",
    nameEn: "",
    nameHanja: "",
    position: "어소시에이트",
    team: "",
    photoUrl: "",
    tagline: "",
    education: "",
    career: "",
    specialties: "",
    qualifications: "",
    publications: "",
    books: "",
    media: "",
    columns: "",
    cases: "",
    memberships: "",
    consultHours: "",
    blogUrl: "",
    introduction: "",
    email: "",
    phone: "",
  });

  const positionOptions = [
    "대표변호사",
    "파트너변호사",
    "시니어변호사",
    "어소시에이트",
    "고문변호사",
  ];

  // 1. 초기 로드
  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setLoading(true);
    try {
      // 1. 세션 정보 조회
      const meRes = await portalApi.get("/me");
      setUserSession(meRes.data?.user || null);

      // 2. 어드민 여부 확인
      const adminCheck = await portalApi.get("/lawyers/admin/check");
      const adminFlag = adminCheck.data?.isAdmin || false;
      setIsAdmin(adminFlag);

      // 3. 내 변호사 프로필 조회
      await fetchMyProfile(meRes.data?.user?.email);

      // 4. 어드민인 경우 전체 변호사 목록도 조회
      if (adminFlag) {
        await fetchAllLawyers();
      }
    } catch (e) {
      console.error("[PortalProfile] 초기 데이터 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  // 내 프로필 조회
  const fetchMyProfile = async (email) => {
    try {
      const res = await portalApi.get("/lawyers/my-profile");
      if (res.data?.data) {
        const prof = res.data.data;
        setMyProfile(prof);
        setProfileExists(true);
        // 내 프로필인 경우 폼에 값 대입
        setFormFields(mapProfileToForm(prof));
      } else {
        setProfileExists(false);
        setMyProfile(null);
        // 기본 이메일 세팅
        setFormFields(prev => ({ ...prev, email: email || "" }));
      }
    } catch (e) {
      // 404 등 프로필 없음
      setProfileExists(false);
      setMyProfile(null);
      setFormFields(prev => ({ ...prev, email: email || "" }));
    }
  };

  // 어드민: 전체 변호사 조회
  const fetchAllLawyers = async () => {
    try {
      const res = await portalApi.get("/lawyers/admin/list");
      setAllLawyers(res.data?.data || []);
    } catch (e) {
      console.error("[PortalProfile] 변호사 목록 로드 실패:", e);
    }
  };

  // 프로필 데이터를 Form 상태에 맵핑
  const mapProfileToForm = (prof) => {
    return {
      name: prof.name || "",
      nameEn: prof.nameEn || "",
      nameHanja: prof.nameHanja || "",
      position: prof.position || "어소시에이트",
      team: prof.team || "",
      photoUrl: prof.photoUrl || "",
      tagline: prof.tagline || "",
      education: prof.education || "",
      career: prof.career || "",
      specialties: prof.specialties || "",
      qualifications: prof.qualifications || "",
      publications: prof.publications || "",
      books: prof.books || "",
      media: prof.media || "",
      columns: prof.columns || "",
      cases: prof.cases || "",
      memberships: prof.memberships || "",
      consultHours: prof.consultHours || "",
      blogUrl: prof.blogUrl || "",
      introduction: prof.introduction || "",
      email: prof.email || "",
      phone: prof.phone || "",
    };
  };

  // 폼 입력 제어
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormFields(prev => ({ ...prev, [name]: value }));
  };

  // 내 프로필 저장
  const handleSaveMyProfile = async (e) => {
    e.preventDefault();
    if (!formFields.name.trim()) return alert("이름을 입력해주세요.");

    try {
      if (profileExists) {
        await portalApi.put("/lawyers/my-profile", formFields);
        alert("프로필이 수정되었습니다.");
      } else {
        await portalApi.post("/lawyers/my-profile", formFields);
        alert("프로필이 생성되었습니다.");
        setProfileExists(true);
      }
      if (userSession?.email) {
        await fetchMyProfile(userSession.email);
      }
      if (isAdmin) {
        await fetchAllLawyers();
      }
    } catch (err) {
      alert(err.response?.data?.error || "프로필 저장에 실패했습니다.");
    }
  };

  // 어드민: 변호사 추가 모달 열기
  const handleOpenAddModal = () => {
    setAdminEditingId(null);
    setAdminSubTab("basic");
    setFormFields({
      name: "",
      nameEn: "",
      nameHanja: "",
      position: "어소시에이트",
      team: "",
      photoUrl: "",
      tagline: "",
      education: "",
      career: "",
      specialties: "",
      qualifications: "",
      publications: "",
      books: "",
      media: "",
      columns: "",
      cases: "",
      memberships: "",
      consultHours: "",
      blogUrl: "",
      introduction: "",
      email: "",
      phone: "",
    });
    setShowAdminModal(true);
  };

  // 어드민: 변호사 수정 모달 열기
  const handleOpenEditModal = (lawyer) => {
    setAdminEditingId(lawyer.id);
    setAdminSubTab("basic");
    setFormFields(mapProfileToForm(lawyer));
    setShowAdminModal(true);
  };

  // 어드민: 변호사 삭제
  const handleDeleteLawyer = async (id, name) => {
    if (!window.confirm(`정말로 ${name} 변호사 프로필을 삭제하시겠습니까?`)) return;
    try {
      await portalApi.delete(`/lawyers/admin/${id}`);
      alert("삭제되었습니다.");
      fetchAllLawyers();
      // 만약 내 프로필이 삭제된 경우 갱신
      if (userSession?.email) {
        fetchMyProfile(userSession.email);
      }
    } catch (e) {
      alert("삭제 실패했습니다.");
    }
  };

  // 어드민: 변호사 저장 (추가/수정)
  const handleSaveAdminLawyer = async (e) => {
    e.preventDefault();
    if (!formFields.name.trim()) return alert("이름을 입력해주세요.");
    if (!formFields.email.trim()) return alert("이메일을 입력해주세요.");

    try {
      if (adminEditingId) {
        await portalApi.put(`/lawyers/admin/${adminEditingId}`, formFields);
        alert("수정 완료되었습니다.");
      } else {
        await portalApi.post("/lawyers/admin/create", formFields);
        alert("등록 완료되었습니다.");
      }
      setShowAdminModal(false);
      fetchAllLawyers();
      if (userSession?.email) {
        fetchMyProfile(userSession.email);
      }
    } catch (err) {
      alert(err.response?.data?.error || "저장에 실패했습니다.");
    }
  };

  // 어드민: 순서 변경 (위로/아래로)
  const handleReorder = async (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= allLawyers.length) return;

    const id1 = allLawyers[index].id;
    const id2 = allLawyers[targetIndex].id;

    try {
      await portalApi.post("/lawyers/admin/reorder", { id1, id2 });
      // 목록 다시 불러오기
      fetchAllLawyers();
    } catch (e) {
      alert("순서 정렬에 실패했습니다.");
    }
  };

  // 서브탭 렌더링 헬퍼 (공통)
  const renderFormContent = (tabKey) => {
    switch (tabKey) {
      case "basic":
        return (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>이름 <span style={{ color: "#ef4444" }}>*</span></label>
              <input type="text" name="name" value={formFields.name} onChange={handleInputChange} style={fieldStyle} required />
            </div>
            <div>
              <label style={labelStyle}>영문 이름</label>
              <input type="text" name="nameEn" value={formFields.nameEn} onChange={handleInputChange} style={fieldStyle} placeholder="e.g. Hong Gil Dong" />
            </div>
            <div>
              <label style={labelStyle}>한자 이름</label>
              <input type="text" name="nameHanja" value={formFields.nameHanja} onChange={handleInputChange} style={fieldStyle} placeholder="e.g. 洪吉童" />
            </div>
            <div>
              <label style={labelStyle}>직급 <span style={{ color: "#ef4444" }}>*</span></label>
              <select name="position" value={formFields.position} onChange={handleInputChange} style={fieldStyle}>
                {positionOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>소속 팀</label>
              <input type="text" name="team" value={formFields.team} onChange={handleInputChange} style={fieldStyle} placeholder="e.g. 기업법무팀, 형사소송팀" />
            </div>
            <div>
              <label style={labelStyle}>이메일 <span style={{ color: "#ef4444" }}>*</span></label>
              <input type="email" name="email" value={formFields.email} onChange={handleInputChange} style={fieldStyle} placeholder="example@highlaw.co.kr" />
            </div>
            <div>
              <label style={labelStyle}>연락처</label>
              <input type="text" name="phone" value={formFields.phone} onChange={handleInputChange} style={fieldStyle} placeholder="e.g. 02-1234-5678" />
            </div>
            <div>
              <label style={labelStyle}>개인 블로그 URL</label>
              <input type="text" name="blogUrl" value={formFields.blogUrl} onChange={handleInputChange} style={fieldStyle} placeholder="e.g. https://blog.naver.com/..." />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>사진 이미지 URL</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input type="text" name="photoUrl" value={formFields.photoUrl} onChange={handleInputChange} style={{ ...fieldStyle, flex: 1 }} placeholder="e.g. /images/lawyers/hong.jpg" />
                {formFields.photoUrl ? (
                  <img src={formFields.photoUrl} alt="미리보기" style={{ width: 42, height: 42, borderRadius: 6, objectFit: "cover", border: "1px solid #cbd5e1" }} onError={(e) => { e.target.style.display = "none"; }} />
                ) : (
                  <div style={{ width: 42, height: 42, borderRadius: 6, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #cbd5e1" }}>
                    <ImageIcon size={18} style={{ color: "#94a3b8" }} />
                  </div>
                )}
              </div>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>슬로건 / 한줄 다짐</label>
              <input type="text" name="tagline" value={formFields.tagline} onChange={handleInputChange} style={fieldStyle} placeholder="e.g. 신뢰와 정성으로 끝까지 의뢰인과 동행하겠습니다." />
            </div>
          </div>
        );
      case "career":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>학력 사항 (한 줄에 하나씩 입력)</label>
              <textarea name="education" value={formFields.education} onChange={handleInputChange} style={{ ...fieldStyle, height: 120, resize: "vertical" }} placeholder="서울대학교 법과대학 졸업&#10;미국 로스쿨 LL.M 수료" />
            </div>
            <div>
              <label style={labelStyle}>경력 사항 (한 줄에 하나씩 입력)</label>
              <textarea name="career" value={formFields.career} onChange={handleInputChange} style={{ ...fieldStyle, height: 150, resize: "vertical" }} placeholder="제50회 사법시험 합격&#10;사법연수원 제40기 수료&#10;서울중앙지방검찰청 검사" />
            </div>
            <div>
              <label style={labelStyle}>주요 자격</label>
              <textarea name="qualifications" value={formFields.qualifications} onChange={handleInputChange} style={{ ...fieldStyle, height: 80, resize: "vertical" }} placeholder="변리사 자격 취득&#10;세무사 자격 취득" />
            </div>
          </div>
        );
      case "fields":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>전문 업무 분야 (쉼표로 구분)</label>
              <input type="text" name="specialties" value={formFields.specialties} onChange={handleInputChange} style={fieldStyle} placeholder="e.g. 건설 분쟁, 부동산 경매, 재개발/재건축" />
            </div>
            <div>
              <label style={labelStyle}>상세 인사말 / 소개글</label>
              <textarea name="introduction" value={formFields.introduction} onChange={handleInputChange} style={{ ...fieldStyle, height: 160, resize: "vertical" }} placeholder="의뢰인을 위한 변호철학과 강점을 자세히 서술해 주세요." />
            </div>
            <div>
              <label style={labelStyle}>상담 가능 시간</label>
              <input type="text" name="consultHours" value={formFields.consultHours} onChange={handleInputChange} style={fieldStyle} placeholder="e.g. 평일 09:00 ~ 18:00 (토/일 휴무)" />
            </div>
          </div>
        );
      case "activities":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>학술 발표 / 논문</label>
                <textarea name="publications" value={formFields.publications} onChange={handleInputChange} style={{ ...fieldStyle, height: 100, resize: "vertical" }} placeholder="건설 하도급법 연구 (2023)" />
              </div>
              <div>
                <label style={labelStyle}>저서</label>
                <textarea name="books" value={formFields.books} onChange={handleInputChange} style={{ ...fieldStyle, height: 100, resize: "vertical" }} placeholder="부동산 거래의 실무 가이드 (2022)" />
              </div>
              <div>
                <label style={labelStyle}>언론 보도 / 방송 출연</label>
                <textarea name="media" value={formFields.media} onChange={handleInputChange} style={{ ...fieldStyle, height: 100, resize: "vertical" }} placeholder="KBS 뉴스라인 건설 분쟁 토론 출연 (2024)" />
              </div>
              <div>
                <label style={labelStyle}>기고 칼럼</label>
                <textarea name="columns" value={formFields.columns} onChange={handleInputChange} style={{ ...fieldStyle, height: 100, resize: "vertical" }} placeholder="법률신문: 재개발 상가 명도소송 해법 기고" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>주요 수행 사건 이력</label>
              <textarea name="cases" value={formFields.cases} onChange={handleInputChange} style={{ ...fieldStyle, height: 100, resize: "vertical" }} placeholder="대기업 계열사 공사대금 청구 소송 대리 승소&#10;○○지역 주택조합 설립인가 무효 소송 승소" />
            </div>
            <div>
              <label style={labelStyle}>소속 협회 / 사회 활동</label>
              <textarea name="memberships" value={formFields.memberships} onChange={handleInputChange} style={{ ...fieldStyle, height: 80, resize: "vertical" }} placeholder="대한변호사협회 건설전문변호사 등록&#10;서울회생법원 법인파산관재인" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const subTabItems = [
    { key: "basic", label: "기본 정보", icon: User },
    { key: "career", label: "학력 & 경력", icon: GraduationCap },
    { key: "fields", label: "전문 분야", icon: Briefcase },
    { key: "activities", label: "활동 & 이력", icon: BookOpen },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, height: "100%" }}>
      {/* ==================== 1. 상단 탭 헤더 ==================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid #e2e8f0", pb: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Settings size={22} style={{ color: "#8b5cf6" }} />
            내 프로필 & 변호사 목록 관리
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>
            홈페이지에 소개되는 변호사 프로필의 정보를 수정 및 정렬할 수 있습니다.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setActiveTab("my")}
            style={{
              padding: "10px 18px", fontSize: 13.5, fontWeight: 600, border: "none", borderRadius: "8px 8px 0 0",
              cursor: "pointer", background: activeTab === "my" ? "#ffffff" : "transparent",
              color: activeTab === "my" ? "#7c3aed" : "#64748b",
              borderBottom: activeTab === "my" ? "2px solid #7c3aed" : "none",
              transition: "all 0.15s"
            }}
          >
            내 프로필 설정
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("admin")}
              style={{
                padding: "10px 18px", fontSize: 13.5, fontWeight: 600, border: "none", borderRadius: "8px 8px 0 0",
                cursor: "pointer", background: activeTab === "admin" ? "#ffffff" : "transparent",
                color: activeTab === "admin" ? "#7c3aed" : "#64748b",
                borderBottom: activeTab === "admin" ? "2px solid #7c3aed" : "none",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
              }}
            >
              <Shield size={14} />
              전체 변호사 관리 (Admin)
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
          프로필 정보를 로드하고 있습니다...
        </div>
      ) : (
        <>
          {/* ==================== 2-1. 내 프로필 설정 탭 ==================== */}
          {activeTab === "my" && (
            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24, background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
              {/* 왼쪽 카테고리 메뉴 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, borderRight: "1px solid #f1f5f9", paddingRight: 16 }}>
                {subTabItems.map((item) => {
                  const Icon = item.icon;
                  const isSel = mySubTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setMySubTab(item.key)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", border: "none",
                        borderRadius: 6, fontSize: 12.5, fontWeight: 600, textAlign: "left", cursor: "pointer",
                        background: isSel ? "#f5f3ff" : "transparent",
                        color: isSel ? "#7c3aed" : "#475569",
                        transition: "all 0.15s"
                      }}
                    >
                      <Icon size={15} />
                      {item.label}
                    </button>
                  );
                })}

                {profileExists ? (
                  <div style={{ marginTop: 24, padding: "8px 12px", background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: 6, fontSize: 11, color: "#166534", display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle size={13} />
                    <span>홈페이지 노출 중</span>
                  </div>
                ) : (
                  <div style={{ marginTop: 24, padding: "8px 12px", background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: 6, fontSize: 11, color: "#92400e", display: "flex", alignItems: "center", gap: 6 }}>
                    <HelpCircle size={13} />
                    <span>프로필 미등록 상태</span>
                  </div>
                )}
              </div>

              {/* 오른쪽 폼 및 입력란 */}
              <form onSubmit={handleSaveMyProfile} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: "0 0 16px 0", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                    {subTabItems.find(i => i.key === mySubTab)?.label} 설정
                  </h3>
                  {renderFormContent(mySubTab)}
                </div>

                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="submit"
                    style={{
                      background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 6,
                      padding: "10px 24px", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(139,92,246,0.15)", transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#7c3aed"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#8b5cf6"}
                  >
                    {profileExists ? "내 프로필 수정하기" : "내 프로필 신규 등록"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==================== 2-2. 어드민 변호사 전체 목록 탭 ==================== */}
          {activeTab === "admin" && isAdmin && (
            <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
              {/* 목록 상단 액션바 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <span style={{ fontSize: 13.5, color: "#64748b" }}>
                  전체 변호사 수: <strong>{allLawyers.length}</strong>명 (정렬 순서대로 메인 홈페이지 노출)
                </span>
                <button
                  onClick={handleOpenAddModal}
                  style={{
                    background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 6,
                    padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 4px rgba(139,92,246,0.1)"
                  }}
                >
                  <Plus size={15} />
                  새 변호사 추가
                </button>
              </div>

              {/* 목록 테이블 */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: 600 }}>
                      <th style={{ padding: "12px 8px", width: 60 }}>사진</th>
                      <th style={{ padding: "12px 8px", width: 100 }}>이름</th>
                      <th style={{ padding: "12px 8px", width: 120 }}>직급</th>
                      <th style={{ padding: "12px 8px", width: 120 }}>팀</th>
                      <th style={{ padding: "12px 8px" }}>이메일</th>
                      <th style={{ padding: "12px 8px", width: 80, textAlign: "center" }}>순서</th>
                      <th style={{ padding: "12px 8px", width: 140, textAlign: "center" }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLawyers.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>
                          등록된 변호사가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      allLawyers.map((lawyer, idx) => (
                        <tr key={lawyer.id} style={{ borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" }}>
                          {/* 사진 */}
                          <td style={{ padding: "8px" }}>
                            {lawyer.photoUrl ? (
                              <img src={lawyer.photoUrl} alt={lawyer.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "1px solid #e2e8f0" }} onError={(e) => { e.target.style.display = "none"; }} />
                            ) : (
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                                <User size={16} style={{ color: "#94a3b8" }} />
                              </div>
                            )}
                          </td>
                          {/* 이름 */}
                          <td style={{ padding: "8px", fontWeight: 600, color: "#1e293b" }}>
                            {lawyer.name}
                            {lawyer.nameEn && <span style={{ display: "block", fontSize: 10, fontWeight: 400, color: "#94a3b8" }}>{lawyer.nameEn}</span>}
                          </td>
                          {/* 직급 */}
                          <td style={{ padding: "8px", color: "#475569" }}>{lawyer.position}</td>
                          {/* 팀 */}
                          <td style={{ padding: "8px", color: "#475569" }}>{lawyer.team || "-"}</td>
                          {/* 이메일 */}
                          <td style={{ padding: "8px", color: "#475569" }}>{lawyer.email}</td>
                          {/* 순서 정렬 컨트롤 */}
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                              <button
                                disabled={idx === 0}
                                onClick={() => handleReorder(idx, "up")}
                                style={{
                                  background: "#f1f5f9", border: "none", display: "flex", padding: 4,
                                  borderRadius: 4, cursor: idx === 0 ? "not-allowed" : "pointer",
                                  opacity: idx === 0 ? 0.3 : 1
                                }}
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                disabled={idx === allLawyers.length - 1}
                                onClick={() => handleReorder(idx, "down")}
                                style={{
                                  background: "#f1f5f9", border: "none", display: "flex", padding: 4,
                                  borderRadius: 4, cursor: idx === allLawyers.length - 1 ? "not-allowed" : "pointer",
                                  opacity: idx === allLawyers.length - 1 ? 0.3 : 1
                                }}
                              >
                                <ArrowDown size={13} />
                              </button>
                            </div>
                          </td>
                          {/* 수정 / 삭제 */}
                          <td style={{ padding: "8px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                              <button
                                onClick={() => handleOpenEditModal(lawyer)}
                                style={{
                                  background: "#fff", border: "1px solid #cbd5e1", borderRadius: 4,
                                  padding: "4px 8px", fontSize: 12, cursor: "pointer", display: "flex",
                                  alignItems: "center", gap: 4, color: "#475569"
                                }}
                              >
                                <Edit size={12} />
                                수정
                              </button>
                              <button
                                onClick={() => handleDeleteLawyer(lawyer.id, lawyer.name)}
                                style={{
                                  background: "#fff", border: "1px solid #fee2e2", borderRadius: 4,
                                  padding: "4px 8px", fontSize: 12, cursor: "pointer", display: "flex",
                                  alignItems: "center", gap: 4, color: "#ef4444"
                                }}
                              >
                                <Trash2 size={12} />
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== 3. 어드민 변호사 생성/수정 팝업 모달 ==================== */}
      {showAdminModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(15,23,42,0.3)", zIndex: 1000, display: "flex",
          alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleSaveAdminLawyer} style={{
            background: "#ffffff", borderRadius: 12, width: "100%", maxWidth: 640,
            padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
            maxHeight: "90vh", display: "flex", flexDirection: "column"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                {adminEditingId ? "변호사 프로필 수정" : "새 변호사 프로필 등록"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                style={{ background: "transparent", border: "none", fontSize: 22, color: "#cbd5e1", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            {/* 모달 탭 분기 */}
            <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e2e8f0", marginBottom: 20 }}>
              {subTabItems.map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setAdminSubTab(item.key)}
                  style={{
                    padding: "8px 12px", border: "none", background: "transparent", fontSize: 12.5,
                    fontWeight: 600, cursor: "pointer",
                    color: adminSubTab === item.key ? "#7c3aed" : "#64748b",
                    borderBottom: adminSubTab === item.key ? "2px solid #7c3aed" : "none"
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* 입력 영역 */}
            <div style={{ flex: 1, overflowY: "auto", minHeight: 280, paddingRight: 4, marginBottom: 24 }}>
              {renderFormContent(adminSubTab)}
            </div>

            {/* 저장/닫기 */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                style={{
                  background: "#fff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 6,
                  padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer"
                }}
              >
                취소
              </button>
              <button
                type="submit"
                style={{
                  background: "#8b5cf6", color: "#fff", border: "none", borderRadius: 6,
                  padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(139,92,246,0.15)"
                }}
              >
                {adminEditingId ? "수정 완료" : "등록 완료"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
