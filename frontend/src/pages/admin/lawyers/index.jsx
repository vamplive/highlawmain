import { useState } from "react";
import useCrudForm from "../../../hooks/useCrudForm";
import { api } from "../../../utils/api";
import {
  PageHeader, EditPanel, FormField, EmptyState, ErrorBanner,
  RepeatableEditor, outlineBtnStyle, COLORS, btnStyle,
} from "../../../components/admin";
import LecturesSection from "./LecturesSection";
import useSiteSettings from "../site-manager/useSiteSettings";

const POSITIONS = ["대표변호사", "변호사", "전문위원", "직원"];
const POSITION_OPTIONS = POSITIONS.map((p) => ({ value: p, label: p }));

const SUB_TABS = [
  { key: "hero", label: "히어로" },
  { key: "lawyer", label: "변호사" },
  { key: "advisor", label: "전문위원" },
  { key: "staff", label: "직원" }
];

/** JSON 문자열 → 배열, 줄바꿈 텍스트도 허용 */
function parseArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return String(value).split("\n").map((s) => s.trim()).filter(Boolean);
}

const EMPTY_FORM = {
  name: "", nameEn: "", nameHanja: "", position: "변호사",
  team: "", photoUrl: "", tagline: "", introduction: "",
  email: "", phone: "", consultHours: "", blogUrl: "",
  sortOrder: 0, isActive: 1,
  // 배열 필드 — 폼 내부에서는 파싱된 배열로 보유
  specialties: [],
  education: [],
  career: [],
  qualifications: [],
  memberships: [],
  publications: [],
  books: [],
  media: [],
  columns: [],
  cases: [],
};

/** API 행(JSON 문자열) → 폼 상태(배열) 변환 */
function mapRowToForm(row) {
  return {
    name: row.name || "",
    nameEn: row.nameEn || "",
    nameHanja: row.nameHanja || "",
    position: row.position || "변호사",
    team: row.team || "",
    photoUrl: row.photoUrl || "",
    tagline: row.tagline || "",
    introduction: row.introduction || "",
    email: row.email || "",
    phone: row.phone || "",
    consultHours: row.consultHours || "",
    blogUrl: row.blogUrl || "",
    sortOrder: row.sortOrder ?? 0,
    isActive: row.isActive ?? 1,
    specialties: parseArray(row.specialties),
    education: parseArray(row.education),
    career: parseArray(row.career),
    qualifications: parseArray(row.qualifications),
    memberships: parseArray(row.memberships),
    publications: parseArray(row.publications),
    books: parseArray(row.books),
    media: parseArray(row.media),
    columns: parseArray(row.columns),
    cases: parseArray(row.cases),
  };
}

/** 폼 상태(배열) → API 페이로드(JSON 문자열) 변환 */
function serializeForm(form) {
  const arrayFields = [
    "specialties", "education", "career", "qualifications", "memberships",
    "publications", "books", "media", "columns", "cases",
  ];
  const out = { ...form };
  for (const f of arrayFields) {
    out[f] = JSON.stringify(form[f] || []);
  }
  return out;
}

/** 단순 문자열 항목용 — 자격/소속/전문분야 */
const STRING_FIELD = [{ key: "value", label: "내용", placeholder: "내용 입력" }];

/** 학력·경력 — 시기 + 내용 + 부가설명 */
const TIMELINE_FIELDS = [
  { key: "period", label: "시기", placeholder: "예: 2024 / 前 / 現", width: "140px" },
  { key: "title", label: "내용", placeholder: "예: 서울대 법학전문대학원 졸업", width: "1fr" },
  { key: "detail", label: "부가설명", placeholder: "선택 (수료논문 등)", width: "1fr" },
];

const PUBLICATION_FIELDS = [
  { key: "year", label: "연도", placeholder: "2024", width: "90px" },
  { key: "title", label: "논문 제목", placeholder: "논문명", width: "1.6fr" },
  { key: "journal", label: "학술지·발행처", placeholder: "예: 건설법학회지 제15권", width: "1.4fr" },
  { key: "url", label: "URL", placeholder: "https://...", width: "1fr" },
];

const BOOK_FIELDS = [
  { key: "year", label: "연도", placeholder: "2024", width: "90px" },
  { key: "title", label: "저서 제목", placeholder: "도서명", width: "1.6fr" },
  { key: "publisher", label: "출판사", placeholder: "예: 법문사", width: "1fr" },
  { key: "role", label: "역할", placeholder: "공저/단독", width: "1fr" },
];

const MEDIA_FIELDS = [
  { key: "date", label: "날짜", placeholder: "2025-03-12", width: "120px" },
  { key: "outlet", label: "매체", placeholder: "예: 법률신문", width: "1fr" },
  { key: "title", label: "제목", placeholder: "기사 제목", width: "2fr" },
  { key: "url", label: "URL", placeholder: "https://...", width: "1fr" },
];

const COLUMN_FIELDS = [
  { key: "date", label: "날짜", placeholder: "2026-04-22", width: "120px" },
  { key: "title", label: "칼럼 제목", placeholder: "칼럼 제목", width: "2fr" },
  { key: "excerpt", label: "발췌", placeholder: "한 줄 요약 (선택)", width: "1.5fr" },
  { key: "url", label: "링크", placeholder: "/blog/slug 또는 https://...", width: "1fr" },
];

const CASE_FIELDS = [
  { key: "year", label: "연도", placeholder: "2024", width: "90px" },
  { key: "category", label: "분야", placeholder: "예: 건설", width: "120px" },
  { key: "caseNumber", label: "사건번호", placeholder: "예: 2024가합○○○○", width: "1.4fr" },
  { key: "description", label: "설명", placeholder: "익명·일반화 표기", width: "2fr" },
  { key: "outcome", label: "결과", placeholder: "예: 일부승소", width: "120px" },
];

export default function AdminLawyers({ settings, update }) {
  const [activeSubTab, setActiveSubTab] = useState("lawyer");
  const localSettings = useSiteSettings();
  const s = settings || localSettings.settings;
  const upd = update || localSettings.update;

  const [savingHero, setSavingHero] = useState(false);
  const saveHeroSettings = async () => {
    setSavingHero(true);
    try {
      const heroContent = s["partners/hero"];
      await api.post("/site-settings/bulk", {
        settings: [{ page: "partners", section: "hero", content: heroContent }]
      });
      alert("히어로 설정이 저장되었습니다.");
    } catch (err) {
      alert("저장 실패: " + err.message);
    } finally {
      setSavingHero(false);
    }
  };

  const crud = useCrudForm("/lawyers", EMPTY_FORM, {
    queryParams: "?all=true",
    mapToForm: mapRowToForm,
    validate: (form) => !form.name.trim() ? "이름을 입력해주세요" : null,
  });

  const filteredItems = crud.items.filter((item) => {
    if (activeSubTab === "lawyer") {
      return item.position === "대표변호사" || item.position === "변호사";
    }
    if (activeSubTab === "advisor") {
      return item.position === "전문위원";
    }
    if (activeSubTab === "staff") {
      return item.position === "직원";
    }
    return false;
  });

  // 배열 필드를 JSON 문자열로 직렬화 후 직접 API 호출 — useCrudForm.save 는 form 상태 closure 를 사용하므로 우회
  const save = async () => {
    if (!crud.form.name.trim()) {
      // useCrudForm 의 validate 가 동작하도록 폼을 그대로 두고 호출
      return crud.save();
    }
    const payload = serializeForm(crud.form);
    try {
      if (crud.isNew) {
        await api.post("/lawyers", payload);
      } else {
        await api.patch(`/lawyers/${crud.editing}`, payload);
      }
      crud.cancelEdit();
      crud.load();
    } catch (err) {
      // useCrudForm 에 에러 표시를 외부에서 직접 set 할 방법이 없어 재시도 시 사용자에게 노출
      alert("저장 실패: " + err.message);
    }
  };

  // 단순 파생값 헬퍼
  const setArr = (key) => (next) => crud.setField(key, next);

  const moveUp = async (filteredIndex) => {
    if (filteredIndex === 0) return;
    const current = filteredItems[filteredIndex];
    const prev = filteredItems[filteredIndex - 1];

    const masterList = [...crud.items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const idxCurrent = masterList.findIndex((item) => item.id === current.id);
    const idxPrev = masterList.findIndex((item) => item.id === prev.id);

    if (idxCurrent === -1 || idxPrev === -1) return;

    const temp = masterList[idxCurrent];
    masterList[idxCurrent] = masterList[idxPrev];
    masterList[idxPrev] = temp;

    const updates = [];
    masterList.forEach((item, index) => {
      const newOrder = index + 1;
      if (item.sortOrder !== newOrder) {
        updates.push({ id: item.id, sortOrder: newOrder });
      }
    });

    try {
      await Promise.all(
        updates.map(({ id, sortOrder }) => api.patch(`/lawyers/${id}`, { sortOrder }))
      );
      crud.load();
    } catch (err) {
      alert("순서 변경 실패: " + err.message);
    }
  };

  const moveDown = async (filteredIndex) => {
    if (filteredIndex === filteredItems.length - 1) return;
    const current = filteredItems[filteredIndex];
    const next = filteredItems[filteredIndex + 1];

    const masterList = [...crud.items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const idxCurrent = masterList.findIndex((item) => item.id === current.id);
    const idxNext = masterList.findIndex((item) => item.id === next.id);

    if (idxCurrent === -1 || idxNext === -1) return;

    const temp = masterList[idxCurrent];
    masterList[idxCurrent] = masterList[idxNext];
    masterList[idxNext] = temp;

    const updates = [];
    masterList.forEach((item, index) => {
      const newOrder = index + 1;
      if (item.sortOrder !== newOrder) {
        updates.push({ id: item.id, sortOrder: newOrder });
      }
    });

    try {
      await Promise.all(
        updates.map(({ id, sortOrder }) => api.patch(`/lawyers/${id}`, { sortOrder }))
      );
      crud.load();
    } catch (err) {
      alert("순서 변경 실패: " + err.message);
    }
  };

  const handleAdd = () => {
    let defaultPosition = "변호사";
    if (activeSubTab === "advisor") defaultPosition = "전문위원";
    if (activeSubTab === "staff") defaultPosition = "직원";
    crud.openNew({ position: defaultPosition, sortOrder: crud.items.length + 1 });
  };

  return (
    <div>
      <ErrorBanner message={crud.error} onDismiss={crud.clearError} />
      {activeSubTab !== "hero" ? (
        <PageHeader
          title="구성원 관리"
          onAdd={handleAdd}
          addLabel={`+ ${SUB_TABS.find((t) => t.key === activeSubTab)?.label} 등록`}
        />
      ) : (
        <PageHeader title="구성원 관리" />
      )}

      {/* 구성원 유형 탭 */}
      <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${COLORS.borderLight}`, marginBottom: 20 }}>
        {SUB_TABS.map((tab) => {
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveSubTab(tab.key); }}
              style={{
                padding: "10px 22px", fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? COLORS.accent : COLORS.textSecondary,
                background: "none", border: "none", cursor: "pointer",
                borderBottom: isActive ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                marginBottom: -2, whiteSpace: "nowrap", transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeSubTab === "hero" ? (
        <div style={{ background: "#fff", padding: 24, border: `1px solid ${COLORS.borderLight}`, borderRadius: 6, marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 16 }}>히어로 섹션 편집</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FormField
              label="제목 (Heading)"
              value={s["partners/hero"]?.heading || ""}
              onChange={(v) => upd("partners/hero", "heading", v)}
              placeholder="구성원"
            />
            <FormField
              label="부제목 (Subheading)"
              value={s["partners/hero"]?.subheading || ""}
              onChange={(v) => upd("partners/hero", "subheading", v)}
              placeholder="PEOPLE"
            />
            <FormField
              label="설명 (Description)"
              value={s["partners/hero"]?.description || ""}
              onChange={(v) => upd("partners/hero", "description", v)}
              type="textarea"
              placeholder="설명을 입력해 주세요."
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button
                onClick={saveHeroSettings}
                disabled={savingHero}
                style={{
                  ...btnStyle(COLORS.accent),
                  padding: "8px 16px",
                  fontSize: 13,
                }}
              >
                {savingHero ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── 편집 폼 ── */}
          {crud.isEditing && (
            <EditPanel isNew={crud.isNew} entityName="변호사" onSave={save} onCancel={crud.cancelEdit}>
              <SectionTitle>기본 정보</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
                <FormField label="이름" value={crud.form.name} onChange={(v) => crud.setField("name", v)} required placeholder="홍길동" />
                <FormField label="한자 이름" value={crud.form.nameHanja} onChange={(v) => crud.setField("nameHanja", v)} placeholder="洪吉童" />
                <FormField label="영문 이름" value={crud.form.nameEn} onChange={(v) => crud.setField("nameEn", v)} placeholder="Gil-Dong Hong" />
                <FormField label="직위" value={crud.form.position} onChange={(v) => crud.setField("position", v)} type="select" options={POSITION_OPTIONS} required />
                <FormField label="팀" value={crud.form.team} onChange={(v) => crud.setField("team", v)} placeholder="예: 건설·부동산팀" />
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <FormField label="사진 URL" value={crud.form.photoUrl} onChange={(v) => crud.setField("photoUrl", v)} placeholder="/lawyers/.../photo.jpg" />
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <input
                      type="file"
                      accept="image/*"
                      id="partner-photo-upload"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const formData = new FormData();
                          formData.append("file", file);
                          formData.append("folder", "lawyers");
                          const res = await api.upload("/media/upload", formData);
                          if (res.data?.url) {
                            crud.setField("photoUrl", res.data.url);
                            alert("사진이 성공적으로 업로드되었습니다.");
                          }
                        } catch (err) {
                          alert("업로드 실패: " + err.message);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById("partner-photo-upload")?.click()}
                      style={{
                        ...outlineBtnStyle(),
                        padding: "8px 12px",
                        fontSize: 13,
                        height: 38,
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      내 컴퓨터에서 선택
                    </button>
                  </div>
                </div>
                <FormField label="이메일" value={crud.form.email} onChange={(v) => crud.setField("email", v)} placeholder="lawyer@HIGHLAW.com" />
                <FormField label="전화번호" value={crud.form.phone} onChange={(v) => crud.setField("phone", v)} placeholder="준비 중" />
                <FormField label="상담시간" value={crud.form.consultHours} onChange={(v) => crud.setField("consultHours", v)} placeholder="평일 09:30 – 18:00" />
                <FormField label="블로그 URL" value={crud.form.blogUrl} onChange={(v) => crud.setField("blogUrl", v)} placeholder="https://blog.naver.com/..." />
                <FormField label="정렬 순서" value={crud.form.sortOrder} onChange={(v) => crud.setField("sortOrder", v)} type="number" />
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14 }}>
                    <input type="checkbox" checked={crud.form.isActive === 1} onChange={(e) => crud.setField("isActive", e.target.checked ? 1 : 0)} />
                    사이트에 표시
                  </label>
                </div>
              </div>

              <FormField label="태그라인 (한 줄 소개)" value={crud.form.tagline} onChange={(v) => crud.setField("tagline", v)} placeholder="건설과 부동산 분쟁의 실전 해결" />
              <div style={{ marginTop: 12 }} />
              <FormField label="소개글" value={crud.form.introduction} onChange={(v) => crud.setField("introduction", v)} type="textarea" placeholder="변호사 소개글" />

              {crud.form.photoUrl && (
                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 4 }}>사진 미리보기</label>
                  <img src={crud.form.photoUrl} alt="미리보기" style={{ width: 120, height: 150, objectFit: "cover", border: "1px solid #ddd", borderRadius: 4 }}
                    onError={(e) => { e.target.style.display = "none"; }} />
                </div>
              )}

              <SectionTitle>학력 · 경력</SectionTitle>
              <RepeatableEditor label="학력" value={crud.form.education} onChange={setArr("education")} fields={TIMELINE_FIELDS} />
              <RepeatableEditor label="경력" value={crud.form.career} onChange={setArr("career")} fields={TIMELINE_FIELDS} />

              <SectionTitle>업무분야 · 자격 · 소속</SectionTitle>
              <RepeatableEditor label="전문 업무분야" value={crud.form.specialties} onChange={setArr("specialties")} simple
                fields={[{ key: "value", placeholder: "예: 건설" }]} addLabel="+ 분야 추가" />
              <RepeatableEditor label="자격" value={crud.form.qualifications} onChange={setArr("qualifications")} simple
                fields={[{ key: "value", placeholder: "예: 대한변호사협회 인증 형사법 전문변호사" }]} addLabel="+ 자격 추가" />
              <RepeatableEditor label="소속 위원회 · 학회" value={crud.form.memberships} onChange={setArr("memberships")} simple
                fields={[{ key: "value", placeholder: "예: 한국건설법학회" }]} addLabel="+ 소속 추가" />

              <SectionTitle>논문 · 저서</SectionTitle>
              <RepeatableEditor label="논문" value={crud.form.publications} onChange={setArr("publications")} fields={PUBLICATION_FIELDS} addLabel="+ 논문 추가" />
              <RepeatableEditor label="저서" value={crud.form.books} onChange={setArr("books")} fields={BOOK_FIELDS} addLabel="+ 저서 추가" />

              <SectionTitle>미디어 · 칼럼</SectionTitle>
              <RepeatableEditor label="미디어" value={crud.form.media} onChange={setArr("media")} fields={MEDIA_FIELDS} addLabel="+ 미디어 추가" />
              <RepeatableEditor label="칼럼" value={crud.form.columns} onChange={setArr("columns")} fields={COLUMN_FIELDS} addLabel="+ 칼럼 추가" />

              <SectionTitle>주요 수행사례</SectionTitle>
              <RepeatableEditor label="수행사례 (변호사법·광고규정 준수 익명 표기)" value={crud.form.cases} onChange={setArr("cases")} fields={CASE_FIELDS} addLabel="+ 사례 추가" />

              <SectionTitle>강의 · 세미나</SectionTitle>
              {crud.isNew ? (
                <p style={{ fontSize: 13, color: COLORS.muted, padding: "8px 0" }}>
                  변호사 정보를 먼저 저장한 뒤 강의를 등록할 수 있습니다.
                </p>
              ) : (
                <LecturesSection lawyerId={crud.editing} />
              )}
            </EditPanel>
          )}

          {/* ── 변호사 목록 ── */}
          {crud.loading ? (
            <p style={{ color: COLORS.muted, fontSize: 14 }}>로딩 중...</p>
          ) : filteredItems.length === 0 ? (
            <EmptyState icon="⚖️" message={`등록된 ${SUB_TABS.find((t) => t.key === activeSubTab)?.label || ""}가 없습니다`} />
          ) : (
            <div className="space-y-3">
              {filteredItems.map((lawyer, index) => (
                <LawyerCard
                  key={lawyer.id}
                  lawyer={lawyer}
                  index={index}
                  totalItems={filteredItems.length}
                  onEdit={() => crud.openEdit(lawyer)}
                  onRemove={() => crud.remove(lawyer.id)}
                  onToggleActive={() => crud.patchItem(lawyer.id, { isActive: lawyer.isActive ? 0 : 1 })}
                  onMoveUp={() => moveUp(index)}
                  onMoveDown={() => moveDown(index)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h4 style={{
      fontSize: 13, fontWeight: 700, color: COLORS.text,
      margin: "24px 0 12px", paddingBottom: 6,
      borderBottom: `1px solid ${COLORS.borderLight}`,
      letterSpacing: "0.02em",
    }}>{children}</h4>
  );
}

/** 변호사 목록 카드 — 단일 항목 렌더링 */
function LawyerCard({ lawyer, index, totalItems, onEdit, onRemove, onToggleActive, onMoveUp, onMoveDown }) {
  return (
    <div
      className="flex items-center gap-4"
      style={{
        padding: "16px 20px",
        background: lawyer.isActive ? "#fff" : COLORS.bgInactive,
        border: `1px solid ${COLORS.borderLight}`,
        borderRadius: 6,
        opacity: lawyer.isActive ? 1 : 0.6,
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
        background: lawyer.photoUrl ? `url(${lawyer.photoUrl}) center/cover no-repeat` : "#e0e0e0",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, color: COLORS.textLight,
      }}>
        {!lawyer.photoUrl && "⚖️"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-baseline gap-2">
          <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{lawyer.name}</span>
          {lawyer.nameEn && <span style={{ fontSize: 11, color: COLORS.textLight }}>{lawyer.nameEn}</span>}
        </div>
        <span style={{ fontSize: 12, color: COLORS.accent }}>{lawyer.position}</span>
        {!lawyer.isActive && <span style={{ fontSize: 10, color: "#c00", marginLeft: 8 }}>(비공개)</span>}
      </div>

      <span style={{ fontSize: 11, color: "#ccc", minWidth: 40, textAlign: "center" }}>#{lawyer.sortOrder}</span>

      <div className="flex gap-2">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          style={{
            ...outlineBtnStyle(),
            opacity: index === 0 ? 0.3 : 1,
            cursor: index === 0 ? "default" : "pointer"
          }}
          title="위로 이동"
        >
          ▲
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === totalItems - 1}
          style={{
            ...outlineBtnStyle(),
            opacity: index === totalItems - 1 ? 0.3 : 1,
            cursor: index === totalItems - 1 ? "default" : "pointer"
          }}
          title="아래로 이동"
        >
          ▼
        </button>

        <button onClick={onToggleActive} title={lawyer.isActive ? "비공개" : "공개"} style={outlineBtnStyle()}>
          {lawyer.isActive ? "👁️" : "🔒"}
        </button>
        <button onClick={onEdit} style={outlineBtnStyle()}>✏️</button>
        <button onClick={onRemove} style={outlineBtnStyle("#c00")}>🗑️</button>
      </div>
    </div>
  );
}
