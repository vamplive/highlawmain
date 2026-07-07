/**
 * 플로팅 퀵 메뉴 — 법무법인 하이로 프리미엄 퀵메뉴
 *
 * - 법률상담도우미 (챗봇 연동 헤더): 딥 네이비 배경 + 골드 팝업 챗봇 탭.
 * - 전화상담: 다이얼러 연결, 대표 번호 표시.
 * - 카카오톡: 새 창 카카오톡 연결.
 * - 텔레그램: 새 창 텔레그램 연결.
 * - 빠른 상담: /consultation 이동.
 * - 오시는 길: /about/directions 이동.
 * - 디자인 테마: 법무법인 하이로 브랜드 아이덴티티에 최적화된 Deep Navy (#0b1f3a) & Gold (#c9a84c) 명품 럭셔리 스타일.
 */
import { useState, useEffect } from "react";
import { useSiteSettingsPage, useLanguage } from "../hooks/useSiteSettings";
import { LAYOUT_DEFAULTS } from "./layout/layoutConfig";
import { KAKAO_CHANNEL_CHAT } from "../utils/kakaoChannel";
import { safeHttpUrl } from "../utils/safeUrl";
import { Link } from "react-router-dom";

const FALLBACK_PHONE = "1555-6997";

export default function FloatingContact() {
  const lang = useLanguage();
  const { settings } = useSiteSettingsPage("layout", LAYOUT_DEFAULTS, lang);
  const contact = settings.contact || LAYOUT_DEFAULTS.contact;

  const phone = contact.phone || FALLBACK_PHONE;
  const kakaoUrl = safeHttpUrl(contact.kakaoUrl, KAKAO_CHANNEL_CHAT);
  const instagramUrl = safeHttpUrl(contact.instagramUrl, LAYOUT_DEFAULTS.contact.instagramUrl);
  const naverReservationUrl = contact.naverReservationEnabled
    ? safeHttpUrl(contact.naverReservationUrl, "")
    : "";
  const telegramUrl = contact.telegramEnabled ? safeHttpUrl(contact.telegramUrl, "") : "";
  const naverBlogUrl = contact.naverBlogEnabled ? safeHttpUrl(contact.naverBlogUrl, "") : "";
  const youtubeUrl  = contact.youtubeEnabled  ? safeHttpUrl(contact.youtubeUrl,  "") : "";

  const tel = normalizeTel(phone);

  const [chatbotOpen, setChatbotOpen] = useState(false);

  // 챗봇 개폐 상태 수신
  useEffect(() => {
    const handleChatbotState = (e) => {
      setChatbotOpen(!!e.detail?.open);
    };
    window.addEventListener("chatbot-state", handleChatbotState);
    return () => window.removeEventListener("chatbot-state", handleChatbotState);
  }, []);

  // 챗봇 열기 커스텀 이벤트 디스패치
  const triggerChatbot = (e) => {
    e.preventDefault();
    window.dispatchEvent(new Event("open-chatbot"));
  };

  return (
    <>
      <style>{`
        /* 럭셔리 퀵 메뉴 컨테이너 */
        .quick-menu-container {
          position: fixed;
          right: 24px;
          top: 55%;
          transform: translateY(-50%);
          z-index: 9999;
          width: 98px;
          display: flex;
          flex-direction: column;
          font-family: var(--font-sans-kr);
          filter: drop-shadow(0 15px 35px rgba(11, 31, 58, 0.22));
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          border-radius: 12px;
          border: 1px solid rgba(201, 168, 76, 0.2); /* 은은한 골드 테두리 */
          overflow: visible;
        }

        /* 골드 상단 팝업 탭 (챗봇 아이콘) */
        .quick-menu-tab {
          position: absolute;
          top: -22px;
          left: 50%;
          transform: translateX(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #c9a84c; /* 골드 액센트 */
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 -4px 12px rgba(201, 168, 76, 0.3), 0 4px 10px rgba(11, 31, 58, 0.15);
          transition: all 0.3s ease;
          z-index: 10;
        }

        /* 챗봇 헤더 (법률상담도우미) */
        .quick-menu-header {
          position: relative;
          background: #0b1f3a; /* 프리미엄 딥 네이비 */
          color: #ffffff;
          padding: 28px 4px 14px;
          border-top-left-radius: 11px;
          border-top-right-radius: 11px;
          text-align: center;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          cursor: pointer;
          border-bottom: 2px solid #c9a84c; /* 헤더-바디 골드 구분선 */
          border-left: none;
          border-right: none;
          border-top: none;
          width: 100%;
        }

        .quick-menu-header:hover {
          background: #132d52; /* 조금 밝은 네이비 */
        }
        
        .quick-menu-header:hover .quick-menu-tab {
          transform: translateX(-50%) scale(1.08);
          background: #b8923e; /* 골드 호버 */
          box-shadow: 0 -4px 16px rgba(201, 168, 76, 0.45);
        }

        .quick-menu-header-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: #ffffff;
          opacity: 0.95;
          line-height: 1.2;
        }
        
        .quick-menu-header-subtitle {
          font-size: 9px;
          font-weight: 500;
          color: #c9a84c; /* 골드 서브텍스트 */
          margin-top: 3px;
          letter-spacing: -0.02em;
        }

        /* 퀵 메뉴 바디 (화이트 섹션) */
        .quick-menu-body {
          background: #ffffff;
          border-bottom-left-radius: 11px;
          border-bottom-right-radius: 11px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* 개별 아이템 스타일 */
        .quick-menu-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 13px 4px;
          text-decoration: none;
          color: #333333;
          background: #ffffff;
          transition: all 0.25s ease;
          border-bottom: 1px solid rgba(11, 31, 58, 0.06);
          gap: 5px;
          cursor: pointer;
        }

        .quick-menu-item:last-child {
          border-bottom: none;
        }

        .quick-menu-item:hover {
          background: rgba(201, 168, 76, 0.04); /* 은은한 명품 골드빛 틴트 배경 */
          color: #c9a84c; /* 호버 시 텍스트 골드 전환 */
        }

        /* 아이콘 호버 애니메이션 */
        .quick-menu-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0b1f3a; /* 브랜드 딥 네이비 */
          transition: all 0.25s ease;
        }

        .quick-menu-item:hover .quick-menu-item-icon {
          transform: translateY(-2px);
          color: #c9a84c; /* 호버 시 아이콘 골드 전환 */
        }

        .quick-menu-item-label {
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: -0.04em;
        }

        /* 전화번호 전용 라벨 */
        .quick-menu-phone-num {
          font-family: var(--font-sans-en);
          font-size: 9px;
          font-weight: 500;
          color: #8a97a8;
          margin-top: 1px;
          letter-spacing: -0.02em;
          transition: color 0.25s ease;
        }

        .quick-menu-item:hover .quick-menu-phone-num {
          color: #b8923e;
        }

        /* 모바일 환경 대응 (컴팩트 스케일 및 아래로 이동) */
        @media (max-width: 768px) {
          .quick-menu-container {
            right: 8px;
            top: auto;
            bottom: 40px;
            transform: scale(0.8);
            transform-origin: bottom right;
          }
          
          /* 모바일에서 챗봇이 열릴 때 퀵메뉴를 깔끔히 페이드아웃하여 겹침 방지 */
          .quick-menu-container.chatbot-active {
            opacity: 0 !important;
            pointer-events: none !important;
            transform: scale(0.7) translateY(20px) !important;
          }
        }
      `}</style>

      <div className={`quick-menu-container ${chatbotOpen ? "chatbot-active" : ""}`}>
        {/* 헤더 버튼: 법률상담도우미 (클릭 시 챗봇 실행) */}
        <button onClick={triggerChatbot} className="quick-menu-header" aria-label="법률상담도우미 열기">
          <div className="quick-menu-tab">
            {/* Chat Bubble Icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#fff" />
              <path d="M8 10h.01M12 10h.01M16 10h.01" stroke="#fff" strokeWidth="2.5" />
            </svg>
          </div>
          <span className="quick-menu-header-title">법률상담도우미</span>
          <span className="quick-menu-header-subtitle">AI 실시간 답변</span>
        </button>

        <div className="quick-menu-body">
          {/* Item 1: 전화상담 */}
          {contact.phoneEnabled !== false && (
          <a href={`tel:${tel}`} className="quick-menu-item" aria-label={`전화상담 연결 ${phone}`}>
            <div className="quick-menu-item-icon">
              {/* Phone Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <span className="quick-menu-item-label">전화상담</span>
            <span className="quick-menu-phone-num">{phone}</span>
          </a>
          )}

          {/* Item 2: 카카오톡 */}
          {contact.kakaoEnabled !== false && (
          <a
            href={kakaoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="quick-menu-item"
            aria-label="카카오톡 상담 — 새 창으로 열림"
          >
            <div className="quick-menu-item-icon">
              {/* Talk Bubble Icon */}
              <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.054-.188.702-.68 2.531-.777 2.92-.12.484.177.478.372.348.154-.102 2.449-1.664 3.435-2.334A10.15 10.15 0 0012 17.23c4.97 0 9-3.185 9-7.115S16.97 3 12 3z" fill="#000" />
                <text x="12" y="11.8" fill="#fff" fontSize="5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">TALK</text>
              </svg>
            </div>
            <span className="quick-menu-item-label">카카오톡</span>
          </a>
          )}

          {/* Item 3: 인스타그램 */}
          {contact.instagramEnabled !== false && instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
              className="quick-menu-item" aria-label="인스타그램 — 새 창으로 열림">
              <div className="quick-menu-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <span className="quick-menu-item-label">인스타그램</span>
            </a>
          )}

          {/* Item 4: 네이버 예약 */}
          {naverReservationUrl && (
            <a href={naverReservationUrl} target="_blank" rel="noopener noreferrer"
              className="quick-menu-item" aria-label="네이버 예약 — 새 창으로 열림">
              <div className="quick-menu-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <path d="M8 14h.01M12 14h.01M16 14h.01"/>
                </svg>
              </div>
              <span className="quick-menu-item-label">네이버 예약</span>
            </a>
          )}

          {/* Telegram */}
          {telegramUrl && (
            <a href={telegramUrl} target="_blank" rel="noopener noreferrer"
              className="quick-menu-item" aria-label="텔레그램 — 새 창으로 열림">
              <div className="quick-menu-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
                </svg>
              </div>
              <span className="quick-menu-item-label">텔레그램</span>
            </a>
          )}

          {/* 네이버 블로그 */}
          {naverBlogUrl && (
            <a href={naverBlogUrl} target="_blank" rel="noopener noreferrer"
              className="quick-menu-item" aria-label="네이버 블로그 — 새 창으로 열림">
              <div className="quick-menu-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4l-4 4V17z"/>
                  <path d="M9 9h6M9 13h4" strokeWidth="1.8"/>
                </svg>
              </div>
              <span className="quick-menu-item-label">블로그</span>
            </a>
          )}

          {/* 유튜브 */}
          {youtubeUrl && (
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer"
              className="quick-menu-item" aria-label="유튜브 — 새 창으로 열림">
              <div className="quick-menu-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.96 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
                </svg>
              </div>
              <span className="quick-menu-item-label">유튜브</span>
            </a>
          )}

          {/* 오시는 길 */}
          <Link to="/about/directions" className="quick-menu-item" aria-label="오시는 길 안내">
            <div className="quick-menu-item-icon">
              {/* Modern Map Pin Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span className="quick-menu-item-label">오시는 길</span>
          </Link>
        </div>
      </div>
    </>
  );
}

function normalizeTel(phone) {
  return String(phone || FALLBACK_PHONE).replace(/[^\d+]/g, "");
}
