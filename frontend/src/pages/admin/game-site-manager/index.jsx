/**
 * HIGHLAW 게임센터 통합 관리자 페이지 (/admin/game-site-manager)
 * — 5개 탭: 게임센터 홈, 게임센터 소개, 업무분야, 하이로 소식, 상담문의
 */
import { useState, useEffect } from "react";
import { PageHeader } from "../../../components/admin";
import { COLORS } from "../../../components/admin/styles";

/* ══════════════════════════════════════
   탭 및 서브탭 정의
══════════════════════════════════════ */
const MAIN_TABS = [
  { key: "home",         label: "게임센터 홈" },
  { key: "about",        label: "게임센터 소개" },
  { key: "practices",    label: "업무분야" },
  { key: "info",         label: "하이로 소식" },
  { key: "consultation", label: "상담문의" },
];

const ABOUT_SUBTABS = [
  { id: "greeting",   label: "인사말" },
  { id: "values",     label: "핵심가치" },
  { id: "directions", label: "오시는 길" },
];

const PRACTICES_SUBTABS = [
  { id: "item-fraud",       label: "아이템·계정 거래 사기" },
  { id: "hacking",          label: "해킹·계정 도용" },
  { id: "currency-fraud",   label: "게임머니 편취" },
  { id: "operator-sanction",label: "운영사 부당 제재" },
];

const INFO_SUBTABS = [
  { id: "news",  label: "하이로 뉴스" },
  { id: "guide", label: "게임법 가이드" },
];

const CONSULTATION_SUBTABS = [
  { id: "form",    label: "상담신청" },
  { id: "process", label: "진행절차" },
  { id: "faq",     label: "FAQ" },
];

/* ══════════════════════════════════════
   공용 컴포넌트
══════════════════════════════════════ */

function Toast({ msg, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: type === "success" ? "#166534" : "#c0392b",
      color: "#fff", padding: "12px 22px",
      borderRadius: 8, fontSize: 13.5, fontWeight: 500,
      boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
    }}>
      {msg}
    </div>
  );
}

function MainTabBar({ activeTab, onSelect }) {
  return (
    <div style={{
      display: "flex", borderBottom: `1px solid ${COLORS.border}`,
      marginBottom: 28, marginTop: 20, overflowX: "auto",
    }}>
      {MAIN_TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            style={{
              padding: "10px 22px", fontSize: 13.5,
              fontWeight: isActive ? 700 : 400,
              color: isActive ? COLORS.primary : COLORS.textMuted,
              background: "none", border: "none", cursor: "pointer",
              whiteSpace: "nowrap",
              borderBottom: isActive ? `2px solid ${COLORS.primary}` : "2px solid transparent",
              marginBottom: -1, transition: "color 0.15s",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* 서브탭 바 */
function SubTabBar({ tabs, activeId, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
      {tabs.map((t) => {
        const isActive = activeId === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              padding: "6px 16px", fontSize: 13, borderRadius: 20,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "#fff" : COLORS.textSecondary,
              background: isActive ? COLORS.accent : COLORS.bgCard,
              border: `1px solid ${isActive ? COLORS.accent : COLORS.border}`,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* 간단 섹션 편집기 (텍스트 영역) */
function SimpleSectionEditor({ title, placeholder, onSave }) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (onSave) onSave(text);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 24, marginBottom: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 14 }}>{title}</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={6}
        style={{
          width: "100%", padding: "12px 14px", fontSize: 13.5,
          border: `1px solid ${COLORS.border}`, borderRadius: 8,
          resize: "vertical", fontFamily: "inherit",
          background: COLORS.bgPage, color: COLORS.textPrimary,
          outline: "none", boxSizing: "border-box",
        }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <button
          onClick={handleSave}
          style={{
            padding: "9px 24px", fontSize: 13.5, fontWeight: 600,
            background: saved ? "#166534" : COLORS.accent,
            color: "#fff", border: "none", borderRadius: 8,
            cursor: "pointer", transition: "background 0.2s",
          }}
        >
          {saved ? "저장됨 ✓" : "저장"}
        </button>
      </div>
    </div>
  );
}

/* 홈 탭 — 페이지 주요 섹션 편집 */
function HomeTab({ onToast }) {
  const sections = [
    { title: "히어로 제목", placeholder: "예: 게임에서 피해를 입었다면, 디지털 증거가 핵심입니다" },
    { title: "히어로 부제목", placeholder: "예: 아이템 거래 사기·계정 해킹·게임머니 편취·운영사 부당 제재까지..." },
    { title: "통계 항목", placeholder: "형사+민사 양면 전략 / 디지털 증거 전문 분석 / 1:1 담당 변호인 직접 대응" },
    { title: "상황 리스트", placeholder: "각 상황을 한 줄씩 입력하세요. 예: 게임 아이템 거래에서 사기를 당해 현금 피해를 입었다" },
    { title: "최종 CTA 문구", placeholder: "예: 지금 바로 변호인을 선임하세요" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <a
          href="https://highlaw.co.kr/game"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 13, color: COLORS.primary, textDecoration: "underline" }}
        >
          ↗ 게임센터 홈페이지 미리보기 (highlaw.co.kr/game)
        </a>
      </div>
      {sections.map((s) => (
        <SimpleSectionEditor
          key={s.title}
          title={s.title}
          placeholder={s.placeholder}
          onSave={() => onToast(`${s.title} 저장됨`)}
        />
      ))}
    </div>
  );
}

/* 서브페이지 탭 (about / practices / info / consultation) */
function SubPageTab({ page, subTabs, pageUrl, onToast }) {
  const [activeSubTab, setActiveSubTab] = useState(subTabs[0]?.id);

  return (
    <div>
      {pageUrl && (
        <div style={{ marginBottom: 16 }}>
          <a href={pageUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: COLORS.primary, textDecoration: "underline" }}>
            ↗ {pageUrl} 미리보기
          </a>
        </div>
      )}
      <SubTabBar tabs={subTabs} activeId={activeSubTab} onSelect={setActiveSubTab} />
      {subTabs.map((t) =>
        activeSubTab === t.id ? (
          <SimpleSectionEditor
            key={t.id}
            title={`${t.label} 콘텐츠`}
            placeholder={`${t.label} 페이지 내용을 입력하세요`}
            onSave={() => onToast(`${t.label} 저장됨`)}
          />
        ) : null
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   메인 컴포넌트
══════════════════════════════════════ */
export default function GameSiteManager() {
  const [activeTab, setActiveTab] = useState("home");
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
  }

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", background: COLORS.bgPage }}>
      <PageHeader
        title="게임센터 관리"
        subtitle="highlaw.co.kr/game 및 하위 페이지 콘텐츠 편집"
      />

      <MainTabBar activeTab={activeTab} onSelect={setActiveTab} />

      {activeTab === "home" && <HomeTab onToast={showToast} />}

      {activeTab === "about" && (
        <SubPageTab
          page="about"
          subTabs={ABOUT_SUBTABS}
          pageUrl="https://highlaw.co.kr/game/about"
          onToast={showToast}
        />
      )}

      {activeTab === "practices" && (
        <SubPageTab
          page="practices"
          subTabs={PRACTICES_SUBTABS}
          pageUrl="https://highlaw.co.kr/game/practices"
          onToast={showToast}
        />
      )}

      {activeTab === "info" && (
        <SubPageTab
          page="info"
          subTabs={INFO_SUBTABS}
          pageUrl="https://highlaw.co.kr/game/info"
          onToast={showToast}
        />
      )}

      {activeTab === "consultation" && (
        <SubPageTab
          page="consultation"
          subTabs={CONSULTATION_SUBTABS}
          pageUrl="https://highlaw.co.kr/game/consultation"
          onToast={showToast}
        />
      )}

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
