/** 공개 페이지 하단 푸터 — 모던 로펌 스타일 (브랜드, 정보 컬럼, 링크) */
import { Link } from "react-router-dom";
import { FOOTER_LINKS, FOOTER_LINKS_EN, LAYOUT_DEFAULTS } from "./layoutConfig";
import { openPrivacyConsentSettings } from "../../utils/privacy-consent";
import { useSiteSettingsPage } from "../../hooks/useSiteSettings";
import { safeHttpUrl } from "../../utils/safeUrl";

export default function Footer({ isLawyerDetail, lang = "ko" }) {
  const isEnglish = lang === "en";
  const footerLinks = isEnglish ? FOOTER_LINKS_EN : FOOTER_LINKS;
  const { settings } = useSiteSettingsPage("layout", LAYOUT_DEFAULTS, lang);
  const contact = settings.contact || LAYOUT_DEFAULTS.contact;
  const instagramUrl = safeHttpUrl(contact.instagramUrl, "");
  const youtubeUrl = safeHttpUrl(contact.youtubeUrl, "");
  const naverBlogUrl = safeHttpUrl(contact.naverBlogUrl, "");
  const showSocials = !!(instagramUrl || youtubeUrl || naverBlogUrl);

  return (
    <footer
      style={{ background: isLawyerDetail ? "#333333" : "var(--bg-dark)" }}
      aria-label="사이트 하단 정보"
    >
      <div
        className="footer-modern-inner"
        style={{ maxWidth: 1280, margin: "0 auto", padding: "52px 64px 44px" }}
      >
        {/* Row 1 — 브랜드 + 정보 컬럼 */}
        <div
          className="footer-modern-row1"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 48,
            flexWrap: "wrap",
          }}
        >
          {/* 좌측 — 로고 */}
          <div>
            <p
              className="font-serif"
              style={{
                fontSize: 13,
                letterSpacing: "0.25em",
                color: "#fff",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              HIGH &amp; LAW FIRM
            </p>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
                marginTop: 8,
                margin: "8px 0 0",
              }}
            >
              {isEnglish ? "Attorneys at Law" : "법무법인 하이로"}
            </p>
            {!isEnglish && (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
                광고책임변호사 조덕재
              </p>
            )}
          </div>

          {/* 우측 — 3개 정보 컬럼 */}
          <div
            className="footer-modern-columns"
            style={{ display: "flex", gap: 64 }}
          >
            {/* LOCATION */}
            <div>
              <p
                className="font-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 12,
                  margin: "0 0 12px",
                }}
              >
                LOCATION
              </p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, margin: 0 }}>
                {isEnglish ? (
                  <>15F, 141 Teheran-ro, Gangnam-gu, Seoul<br />(06135)</>
                ) : (
                  <>서울특별시 강남구 테헤란로 141, 15층<br />(우: 06135)</>
                )}
              </p>
            </div>

            {/* CONTACT */}
            <div>
              <p
                className="font-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 12,
                  margin: "0 0 12px",
                }}
              >
                CONTACT
              </p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, margin: 0 }}>
                T. 02-6925-6757<br />E. mingukang@highlaw.net
              </p>
            </div>

            {/* HOURS */}
            <div>
              <p
                className="font-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 12,
                  margin: "0 0 12px",
                }}
              >
                HOURS
              </p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, margin: 0 }}>
                {isEnglish ? (
                  <>Weekdays 10:00 — 18:00<br />Weekends by appointment</>
                ) : (
                  <>평일 10:00 — 18:00<br />주말·공휴일 사전예약</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Row 1.5 — 소셜 아이콘 */}
        {showSocials && (
          <div style={{ marginTop: 32, display: "flex", gap: 12, alignItems: "center" }}>
            {youtubeUrl && (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="유튜브 채널 — 새 창으로 열림"
                style={socialIconStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#FF0000"; e.currentTarget.style.borderColor = "#FF0000"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.376.504A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136C4.495 20.454 12 20.454 12 20.454s7.505 0 9.376-.504a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.546 15.568V8.432L15.818 12l-6.272 3.568z" />
                </svg>
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="인스타그램 — 새 창으로 열림"
                style={socialIconStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(45deg,#f09433,#dc2743,#bc1888)"; e.currentTarget.style.borderColor = "transparent"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.416 2.175 8.796 2.163 12 2.163zm0 1.838c-3.15 0-3.51.012-4.74.068-1.024.047-1.578.218-1.948.362-.49.19-.84.418-1.207.785-.367.367-.595.717-.785 1.207-.144.37-.315.924-.362 1.948-.056 1.23-.068 1.59-.068 4.74s.012 3.51.068 4.74c.047 1.024.218 1.578.362 1.948.19.49.418.84.785 1.207.367.367.717.595 1.207.785.37.144.924.315 1.948.362 1.23.056 1.59.068 4.74.068s3.51-.012 4.74-.068c1.024-.047 1.578-.218 1.948-.362.49-.19.84-.418 1.207-.785.367-.367.595-.717.785-1.207.144-.37.315-.924.362-1.948.056-1.23.068-1.59.068-4.74s-.012-3.51-.068-4.74c-.047-1.024-.218-1.578-.362-1.948-.19-.49-.418-.84-.785-1.207-.367-.367-.717-.595-1.207-.785-.37-.144-.924-.315-1.948-.362-1.23-.056-1.59-.068-4.74-.068zm0 3.155A4.844 4.844 0 1 1 12 16.84a4.844 4.844 0 0 1 0-9.688zm0 7.99a3.146 3.146 0 1 0 0-6.293 3.146 3.146 0 0 0 0 6.293zm6.16-8.198a1.132 1.132 0 1 1-2.265 0 1.132 1.132 0 0 1 2.265 0z" />
                </svg>
              </a>
            )}
            {naverBlogUrl && (
              <a
                href={naverBlogUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="네이버 블로그 — 새 창으로 열림"
                style={socialIconStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#03C75A"; e.currentTarget.style.borderColor = "#03C75A"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <path d="M16.2 3H21v18h-4.8l-8.4-12v12H3V3h4.8l8.4 12V3z"/>
                </svg>
              </a>
            )}
          </div>
        )}

        {/* Row 2 — 링크 + 저작권 (자연스러운 세로 스택 & 가장 좌측 정렬 통일) */}
        <div
          className="footer-modern-row2"
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 20,
          }}
        >
          {/* 좌측 링크 */}
          <div className="footer-modern-links" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.5)",
                  textDecoration: "none",
                  transition: "color 0.3s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={openPrivacyConsentSettings}
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
                textDecoration: "none",
                transition: "color 0.3s",
                border: 0,
                padding: 0,
                background: "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
            >
              {isEnglish ? "Privacy Settings" : "개인정보 설정"}
            </button>
          </div>

          {/* 저작권 + 사업자 정보 (가장 좌측 "법무법인 하이로"와 세로 시작 위치 수평 일치) */}
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.4)",
              textAlign: "left",
              lineHeight: 1.6,
            }}
          >
            {isEnglish ? (
              <>
                HIGH &amp; LAW FIRM | Attorneys : Deok Jae Cho, Beom Kim, Min Gu Kang | Reg. No. : 433-86-04078<br />
                © 2026 HIGH &amp; LAW FIRM. ALL RIGHTS RESERVED.<br />
                ATTORNEY ADVERTISING. PRIOR RESULTS DO NOT GUARANTEE A SIMILAR OUTCOME.
              </>
            ) : (
              <>
                법무법인 하이로 | 대표변호사 : 조덕재, 김범, 강민구 | 사업자등록번호 : 433-86-04078<br />
                © 2026 HIGH &amp; LAW FIRM. ALL RIGHTS RESERVED.<br />
                ATTORNEY ADVERTISING. PRIOR RESULTS DO NOT GUARANTEE A SIMILAR OUTCOME.
              </>
            )}
          </span>
        </div>
      </div>

      {/* 반응형 스타일 — 모바일 세로 스택 */}
      <style>{`
        @media (max-width: 768px) {
          .footer-modern-inner {
            padding: 40px 24px !important;
          }
          .footer-modern-row1 {
            flex-direction: column !important;
          }
          .footer-modern-columns {
            flex-direction: column !important;
            gap: 24px !important;
          }
          .footer-modern-row2 {
            flex-direction: column !important;
            gap: 18px !important;
            text-align: left !important;
            align-items: flex-start !important;
          }
          .footer-modern-links {
            flex-direction: column !important;
            gap: 10px !important;
          }
        }
      `}</style>
    </footer>
  );
}

const socialIconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 38,
  height: 38,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.25)",
  background: "transparent",
  textDecoration: "none",
  transition: "background 0.25s ease, border-color 0.25s ease",
};
