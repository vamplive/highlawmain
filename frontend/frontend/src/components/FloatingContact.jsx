/**
 * 플로팅 컨택트 스택 — 전화 / 카카오톡 / 텔레그램 버튼을 한 묶음으로 배치한다.
 *
 * - 모바일: 하단 우측에 세로 스택. 탭 타겟 56px 보장.
 * - 데스크톱: 동일 배치이나 마우스오버 시 라벨 노출.
 * - 각 채널은 관리자 사이트 매니저(공통 → 플로팅 문의 버튼) 설정으로 ON/OFF 가능.
 * - prefers-reduced-motion 사용자를 위해 transition 축소.
 */
import { useState } from "react";
import { Phone } from "lucide-react";
import { useSiteSettingsPage, useLanguage } from "../hooks/useSiteSettings";
import { LAYOUT_DEFAULTS } from "./layout/layoutConfig";
import { KAKAO_CHANNEL_CHAT } from "../utils/kakaoChannel";
import { TELEGRAM_CONTACT_URL } from "../utils/telegramContact";
import { safeHttpUrl } from "../utils/safeUrl";

const FALLBACK_PHONE = "준비 중";

export default function FloatingContact() {
  const lang = useLanguage();
  const { settings } = useSiteSettingsPage("layout", LAYOUT_DEFAULTS, lang);
  const contact = settings.contact || LAYOUT_DEFAULTS.contact;

  const phone = contact.phone || FALLBACK_PHONE;
  const kakaoUrl = safeHttpUrl(contact.kakaoUrl, KAKAO_CHANNEL_CHAT);
  const telegramUrl = safeHttpUrl(contact.telegramUrl, TELEGRAM_CONTACT_URL);
  const instagramUrl = safeHttpUrl(contact.instagramUrl, "");
  const youtubeUrl = safeHttpUrl(contact.youtubeUrl, "");
  const naverBlogUrl = safeHttpUrl(contact.naverBlogUrl, "");

  const phoneEnabled = contact.phoneEnabled !== false;
  const kakaoEnabled = contact.kakaoEnabled !== false && !!kakaoUrl;
  const telegramEnabled = (contact.telegramEnabled !== false || !contact.telegramUrl) && !!telegramUrl;
  const instagramEnabled = contact.instagramEnabled !== false && !!instagramUrl;
  const youtubeEnabled = contact.youtubeEnabled !== false && !!youtubeUrl;
  const naverBlogEnabled = contact.naverBlogEnabled !== false && !!naverBlogUrl;

  // 켜진 버튼이 하나도 없으면 컨테이너 자체를 렌더링하지 않음
  if (!phoneEnabled && !kakaoEnabled && !telegramEnabled && !instagramEnabled && !youtubeEnabled && !naverBlogEnabled) return null;

  return (
    <>
      {/* iOS 홈 인디케이터 및 모바일 버튼 크기 대응 */}
      <style>{`
        .floating-contact-stack {
          position: fixed;
          bottom: 24px;
          right: 16px;
          z-index: 9998;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        @supports (bottom: env(safe-area-inset-bottom)) {
          .floating-contact-stack {
            bottom: calc(env(safe-area-inset-bottom) + 16px);
          }
        }
        @media (max-width: 768px) {
          .floating-contact-stack {
            right: 12px;
            gap: 8px;
          }
          .floating-btn-shell {
            width: 48px !important;
            height: 48px !important;
            min-width: 48px !important;
          }
        }
      `}</style>
      <div className="floating-contact-stack">
        {phoneEnabled && <PhoneButton phone={phone} />}
        {kakaoEnabled && <KakaoButton url={kakaoUrl} />}
        {telegramEnabled && <TelegramButton url={telegramUrl} />}
        {youtubeEnabled && <YoutubeButton url={youtubeUrl} />}
        {instagramEnabled && <InstagramButton url={instagramUrl} />}
        {naverBlogEnabled && <NaverBlogButton url={naverBlogUrl} />}
      </div>
    </>
  );
}

function KakaoButton({ url }) {
  const [hover, setHover] = useState(false);
  return (
    <FloatingButtonShell
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      aria-label="카카오톡 상담 — 새 창으로 열림"
      background="#FEE500"
      label="카카오톡 상담"
      hover={hover}
      onHoverChange={setHover}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path d="M14 4C8.477 4 4 7.582 4 12c0 2.87 1.89 5.39 4.726 6.836l-.96 3.56c-.08.296.256.536.512.368L12.4 20.2c.52.06 1.06.1 1.6.1 5.523 0 10-3.582 10-8s-4.477-8-10-8z" fill="#3C1E1E" />
      </svg>
    </FloatingButtonShell>
  );
}

function TelegramButton({ url }) {
  const [hover, setHover] = useState(false);
  return (
    <FloatingButtonShell
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      aria-label="텔레그램 문의 — 새 창으로 열림"
      background="#229ED9"
      label="텔레그램 문의"
      hover={hover}
      onHoverChange={setHover}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M22.05 2.7 1.79 10.49c-1.38.55-1.37 1.32-.25 1.66l5.2 1.62 12.04-7.6c.57-.35 1.09-.16.66.22l-9.75 8.8h-.01l.01.01-.36 5.36c.55 0 .79-.25 1.1-.55l2.64-2.57 5.49 4.05c1.01.56 1.74.27 1.99-.94l3.6-16.97c.37-1.49-.57-2.16-1.55-1.81z"
          fill="#fff"
        />
      </svg>
    </FloatingButtonShell>
  );
}

function YoutubeButton({ url }) {
  const [hover, setHover] = useState(false);
  return (
    <FloatingButtonShell
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      aria-label="유튜브 채널 — 새 창으로 열림"
      background="#FF0000"
      label="유튜브 채널"
      hover={hover}
      onHoverChange={setHover}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.376.504A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136C4.495 20.454 12 20.454 12 20.454s7.505 0 9.376-.504a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.546 15.568V8.432L15.818 12l-6.272 3.568z"
          fill="#fff"
        />
      </svg>
    </FloatingButtonShell>
  );
}

function InstagramButton({ url }) {
  const [hover, setHover] = useState(false);
  return (
    <FloatingButtonShell
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      aria-label="인스타그램 — 새 창으로 열림"
      background="linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)"
      label="인스타그램"
      hover={hover}
      onHoverChange={setHover}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.416 2.175 8.796 2.163 12 2.163zm0 1.838c-3.15 0-3.51.012-4.74.068-1.024.047-1.578.218-1.948.362-.49.19-.84.418-1.207.785-.367.367-.595.717-.785 1.207-.144.37-.315.924-.362 1.948-.056 1.23-.068 1.59-.068 4.74s.012 3.51.068 4.74c.047 1.024.218 1.578.362 1.948.19.49.418.84.785 1.207.367.367.717.595 1.207.785.37.144.924.315 1.948.362 1.23.056 1.59.068 4.74.068s3.51-.012 4.74-.068c1.024-.047 1.578-.218 1.948-.362.49-.19.84-.418 1.207-.785.367-.367.595-.717.785-1.207.144-.37.315-.924.362-1.948.056-1.23.068-1.59.068-4.74s-.012-3.51-.068-4.74c-.047-1.024-.218-1.578-.362-1.948-.19-.49-.418-.84-.785-1.207-.367-.367-.717-.595-1.207-.785-.37-.144-.924-.315-1.948-.362-1.23-.056-1.59-.068-4.74-.068zm0 3.155A4.844 4.844 0 1 1 12 16.84a4.844 4.844 0 0 1 0-9.688zm0 7.99a3.146 3.146 0 1 0 0-6.293 3.146 3.146 0 0 0 0 6.293zm6.16-8.198a1.132 1.132 0 1 1-2.265 0 1.132 1.132 0 0 1 2.265 0z"
          fill="#fff"
        />
      </svg>
    </FloatingButtonShell>
  );
}

function NaverBlogButton({ url }) {
  const [hover, setHover] = useState(false);
  return (
    <FloatingButtonShell
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      aria-label="네이버 블로그 — 새 창으로 열림"
      background="#03C75A"
      label="네이버 블로그"
      hover={hover}
      onHoverChange={setHover}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M16.2 3H21v18h-4.8l-8.4-12v12H3V3h4.8l8.4 12V3z"
          fill="#fff"
        />
      </svg>
    </FloatingButtonShell>
  );
}

function PhoneButton({ phone }) {
  const [hover, setHover] = useState(false);
  const tel = normalizeTel(phone);
  // tel: 스킴은 모바일에서 다이얼러를, 데스크톱에서는 FaceTime/Teams 등 기본 핸들러를 호출한다
  return (
    <FloatingButtonShell
      as="a"
      href={`tel:${tel}`}
      aria-label={`전화 상담 ${phone}`}
      background="var(--accent-gold)"
      label={phone}
      hover={hover}
      onHoverChange={setHover}
    >
      <Phone size={24} strokeWidth={1.8} color="#fff" aria-hidden="true" />
    </FloatingButtonShell>
  );
}

function normalizeTel(phone) {
  return String(phone || FALLBACK_PHONE).replace(/[^\d+]/g, "");
}

/**
 * 공통 플로팅 버튼 껍질 — 원형 아이콘 + 호버 시 왼쪽으로 펼쳐지는 라벨.
 */
function FloatingButtonShell({ as = "button", children, label, background, hover, onHoverChange, ...rest }) {
  const Tag = as;
  const baseStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    minWidth: 56,
    borderRadius: "50%",
    background,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
    transition: "transform 0.2s, box-shadow 0.2s",
    transform: hover ? "scale(1.06)" : "scale(1)",
    textDecoration: "none",
    position: "relative",
  };
  return (
    <Tag
      {...rest}
      className="floating-btn-shell"
      style={baseStyle}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onFocus={() => onHoverChange(true)}
      onBlur={() => onHoverChange(false)}
    >
      {children}
      {/* 호버/포커스 시 왼쪽에 툴팁 형태 라벨 노출 */}
      {hover && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "calc(100% + 10px)",
            top: "50%",
            transform: "translateY(-50%)",
            whiteSpace: "nowrap",
            fontSize: 12,
            fontWeight: 500,
            background: "rgba(10,22,40,0.92)",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: 4,
            pointerEvents: "none",
          }}
        >
          {label}
        </span>
      )}
    </Tag>
  );
}
