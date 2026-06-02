/**
 * 플로팅 퀵 메뉴 — 우측 고정 세로형 위젯
 *
 * - 전화상담 (헤더/다이얼러 연결): 파란색 둥근 헤더와 상단 팝업 헤드셋 아이콘.
 * - 카카오톡, 빠른 상담, 오시는 길 (바디): 화이트 배경, 개별 아이콘 및 텍스트 구성.
 * - 모바일 환경: 우측 하단 컴팩트한 배치 및 반응형 스케일 처리.
 */
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

  // Split phone number vertically
  const { part1, part2 } = formatPhoneVertical(phone);
  const tel = normalizeTel(phone);

  return (
    <>
      <style>{`
        /* Quick Menu Container */
        .quick-menu-container {
          position: fixed;
          right: 24px;
          top: 55%;
          transform: translateY(-50%);
          z-index: 9999;
          width: 96px;
          display: flex;
          flex-direction: column;
          font-family: var(--font-sans-kr);
          filter: drop-shadow(0 10px 25px rgba(11, 31, 58, 0.15));
          transition: all 0.3s ease;
        }

        /* Top Popping Headset Circle Tab */
        .quick-menu-tab {
          position: absolute;
          top: -22px;
          left: 50%;
          transform: translateX(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #2b44eb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          transition: background-color 0.3s ease, transform 0.3s ease;
          z-index: 10;
        }

        /* Quick Menu Header (전화상담) */
        .quick-menu-header {
          position: relative;
          background: #2b44eb;
          color: #ffffff;
          padding: 26px 8px 12px;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          text-align: center;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: background-color 0.3s ease;
          cursor: pointer;
        }

        .quick-menu-header:hover {
          background: #1f35cc;
        }
        
        .quick-menu-header:hover .quick-menu-tab {
          background: #1f35cc;
          transform: translateX(-50%) scale(1.05);
        }

        .quick-menu-header-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
          opacity: 0.95;
          text-transform: uppercase;
        }

        /* Phone numbers vertically split */
        .quick-menu-phone-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          line-height: 1.15;
        }

        .quick-menu-phone-num {
          font-family: var(--font-sans-en);
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .quick-menu-phone-dash {
          font-size: 12px;
          font-weight: 700;
          opacity: 0.8;
          margin: 1px 0;
        }

        /* Quick Menu Body (White section with links) */
        .quick-menu-body {
          background: #ffffff;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
          border: 1px solid rgba(11, 31, 58, 0.08);
          border-top: none;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Quick Menu Item */
        .quick-menu-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 15px 4px;
          text-decoration: none;
          color: #333333;
          background: #ffffff;
          transition: all 0.25s ease;
          border-bottom: 1px solid rgba(11, 31, 58, 0.08);
          gap: 7px;
          cursor: pointer;
        }

        .quick-menu-item:last-child {
          border-bottom: none;
        }

        .quick-menu-item:hover {
          background: #f8fafc;
          color: #2b44eb;
        }

        .quick-menu-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #111111;
          transition: transform 0.25s ease, color 0.25s ease;
        }

        .quick-menu-item:hover .quick-menu-item-icon {
          transform: translateY(-2px);
          color: #2b44eb;
        }

        .quick-menu-item-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: -0.03em;
        }

        /* Mobile Sizing Adaptation */
        @media (max-width: 768px) {
          .quick-menu-container {
            right: 8px;
            top: auto;
            bottom: 80px;
            transform: scale(0.85);
            transform-origin: bottom right;
          }
        }
      `}</style>

      <div className="quick-menu-container">
        {/* Clickable Header for Dialing */}
        <a href={`tel:${tel}`} className="quick-menu-header" aria-label={`전화 상담 ${phone}`}>
          <div className="quick-menu-tab">
            {/* Smiling Helpline Agent Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 14c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="#fff" />
              <rect x="2" y="12" width="2" height="5" rx="1" fill="#fff" stroke="#fff" />
              <rect x="20" y="12" width="2" height="5" rx="1" fill="#fff" stroke="#fff" />
              <circle cx="12" cy="14" r="5" stroke="#fff" strokeWidth="2" />
              <path d="M10.5 15.5c.5.8 1.5 1.2 2.5 1.2s2-.4 2.5-1.2" stroke="#fff" strokeWidth="1.5" />
              <circle cx="10.5" cy="13" r="0.75" fill="#fff" />
              <circle cx="13.5" cy="13" r="0.75" fill="#fff" />
              <path d="M21 14.5c0 1.5-1.5 2.5-3 2.5" stroke="#fff" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="quick-menu-header-title">전화상담</span>
          <div className="quick-menu-phone-box">
            <span className="quick-menu-phone-num">{part1}</span>
            <span className="quick-menu-phone-dash">-</span>
            <span className="quick-menu-phone-num">{part2}</span>
          </div>
        </a>

        <div className="quick-menu-body">
          {/* Item 1: KakaoTalk */}
          <a
            href={kakaoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="quick-menu-item"
            aria-label="카카오톡 상담 — 새 창으로 열림"
          >
            <div className="quick-menu-item-icon">
              {/* Talk Bubble Icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.054-.188.702-.68 2.531-.777 2.92-.12.484.177.478.372.348.154-.102 2.449-1.664 3.435-2.334A10.15 10.15 0 0012 17.23c4.97 0 9-3.185 9-7.115S16.97 3 12 3z" fill="#000" />
                <text x="12" y="11.8" fill="#fff" fontSize="5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">TALK</text>
              </svg>
            </div>
            <span className="quick-menu-item-label">카카오톡</span>
          </a>

          {/* Item 2: Quick Consultation */}
          <Link to="/consultation" className="quick-menu-item" aria-label="빠른 상담 신청">
            <div className="quick-menu-item-icon">
              {/* Speech Bubble Icon with Three Dots */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-12 9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
              </svg>
            </div>
            <span className="quick-menu-item-label">빠른 상담</span>
          </Link>

          {/* Item 3: Directions */}
          <Link to="/about/directions" className="quick-menu-item" aria-label="오시는 길 안내">
            <div className="quick-menu-item-icon">
              {/* Folded Map Icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.27-.36.48v15.12c0 .22.14.42.36.49l5.64-1.9 6 2.1 5.64-1.9c.22-.07.36-.27.36-.49V3.5c0-.22-.14-.42-.36-.49-.04-.01-.09-.01-.14-.01zM15 19l-6-2.11V5l6 2.11V19z" />
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

function formatPhoneVertical(phone) {
  if (!phone) return { part1: "", part2: "" };
  const cleaned = phone.trim();
  const parts = cleaned.split("-");
  if (parts.length === 2) {
    return { part1: parts[0], part2: parts[1] };
  } else if (parts.length === 3) {
    return { part1: `${parts[0]}-${parts[1]}`, part2: parts[2] };
  }
  if (cleaned.length > 4) {
    return { part1: cleaned.slice(0, cleaned.length - 4), part2: cleaned.slice(cleaned.length - 4) };
  }
  return { part1: cleaned, part2: "" };
}
