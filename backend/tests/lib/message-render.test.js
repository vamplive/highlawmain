/**
 * message-render.js — 메시지 렌더링 순수 함수 테스트
 * 플레이스홀더 치환, 이메일 푸터 삽입, 추적 픽셀 등 순수 로직만 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

/* db/schema/drizzle-orm/helpers를 모킹해 모듈 로드를 가능하게 한다 */
vi.mock("../../db", () => ({ db: {} }));
vi.mock("../../db/schema", () => ({ clients: {} }));
vi.mock("drizzle-orm", () => ({ eq: vi.fn() }));
vi.mock("../../services/helpers", () => ({ cleanPhone: vi.fn((p) => p) }));

const {
  buildUnsubscribeUrl, buildOpenTrackingUrl,
  replacePlaceholders, appendEmailFooter, injectTrackingPixel,
  getAppUrl,
} = await import("../../lib/message-render.js");

describe("getAppUrl", () => {
  beforeEach(() => { delete process.env.APP_URL; });

  it("APP_URL 환경변수가 있으면 그것을 쓴다", () => {
    process.env.APP_URL = "https://example.com";
    expect(getAppUrl()).toBe("https://example.com");
  });

  it("APP_URL이 없으면 localhost 기본값을 쓴다", () => {
    expect(getAppUrl()).toBe("http://localhost:5173");
  });
});

describe("buildUnsubscribeUrl", () => {
  it("토큰이 없으면 null", () => {
    expect(buildUnsubscribeUrl(null)).toBeNull();
    expect(buildUnsubscribeUrl(undefined)).toBeNull();
    expect(buildUnsubscribeUrl("")).toBeNull();
  });

  it("토큰을 URL 인코딩해 쿼리스트링에 담는다", () => {
    const url = buildUnsubscribeUrl("abc/def=1");
    expect(url).toContain("/unsubscribe?token=");
    expect(url).toContain("abc%2Fdef%3D1");
  });
});

describe("buildOpenTrackingUrl", () => {
  it("logId가 없으면 null", () => {
    expect(buildOpenTrackingUrl(null)).toBeNull();
  });

  it(".gif 경로에 logId를 인코딩해 넣는다", () => {
    const url = buildOpenTrackingUrl("log-1/2");
    expect(url).toContain("/api/messages/track/open/");
    expect(url).toContain("log-1%2F2");
    expect(url.endsWith(".gif")).toBe(true);
  });

  it("APP_URL 뒤쪽 슬래시를 중복하지 않는다", () => {
    process.env.APP_URL = "https://example.com/";
    const url = buildOpenTrackingUrl("abc");
    expect(url.startsWith("https://example.com/api/")).toBe(true);
    delete process.env.APP_URL;
  });
});

describe("replacePlaceholders", () => {
  it("빈 문자열/null은 빈 문자열 반환", () => {
    expect(replacePlaceholders("", {})).toBe("");
    expect(replacePlaceholders(null, {})).toBe("");
  });

  it("{name}, {category}를 치환한다", () => {
    const out = replacePlaceholders(
      "안녕하세요 {name}님, {category} 상담 건입니다.",
      { name: "홍길동", category: "civil" }
    );
    expect(out).toContain("홍길동");
    expect(out).toContain("민사");
    expect(out).not.toContain("{name}");
    expect(out).not.toContain("{category}");
  });

  it("한글 고객명과 이중 중괄호 플레이스홀더도 고객 이름으로 치환한다", () => {
    const out = replacePlaceholders(
      "안녕하세요 {고객명}님 / {{고객명}}님 / {{ name }}님 / {고객 이름}님",
      { name: "김민수" }
    );
    expect(out).toBe("안녕하세요 김민수님 / 김민수님 / 김민수님 / 김민수님");
  });

  it("알 수 없는 카테고리는 원본 값을 그대로 표시한다", () => {
    const out = replacePlaceholders("{category}", { category: "newtype" });
    expect(out).toBe("newtype");
  });

  it("{meeting_type}을 한국어 라벨로 치환한다", () => {
    expect(replacePlaceholders("{meeting_type}", { meetingType: "in_person" })).toBe("대면 상담");
    expect(replacePlaceholders("{meeting_type}", { meetingType: "phone" })).toBe("전화 상담");
    expect(replacePlaceholders("{meeting_type}", { meetingType: "video" })).toBe("화상 상담");
  });

  it("{meeting_info}는 방식별로 다른 텍스트를 반환한다", () => {
    const inPerson = replacePlaceholders("{meeting_info}", { meetingType: "in_person" });
    expect(inPerson).toMatch(/서울|한국|빌딩|층/);
    const phone = replacePlaceholders("{meeting_info}", { meetingType: "phone" });
    expect(phone).toContain("연락");
    const video = replacePlaceholders("{meeting_info}", { meetingType: "video", meetingLink: "https://meet.example/xyz" });
    expect(video).toBe("https://meet.example/xyz");
  });

  it("화상인데 링크가 없으면 준비 중 안내", () => {
    expect(replacePlaceholders("{meeting_info}", { meetingType: "video" })).toContain("준비 중");
  });

  it("{unsubscribe_link}를 치환한다", () => {
    const out = replacePlaceholders("{unsubscribe_link}", { unsubscribeUrl: "https://ex.com/u" });
    expect(out).toBe("https://ex.com/u");
  });
});

describe("appendEmailFooter", () => {
  it("unsubscribeUrl이 없으면 푸터를 붙이지 않는다", () => {
    expect(appendEmailFooter("<p>본문</p>", null)).toBe("<p>본문</p>");
  });

  it("HTML 태그가 있으면 그대로 두고 푸터만 붙인다", () => {
    const out = appendEmailFooter("<p>안녕</p>", "https://ex/u");
    expect(out).toContain("<p>안녕</p>");
    expect(out).toContain("href=\"https://ex/u\"");
    expect(out).toContain("수신을 원치 않으시면");
  });

  it("평문 본문의 개행을 <br>로 바꾼다", () => {
    const out = appendEmailFooter("첫줄\n둘째줄", "https://ex/u");
    expect(out).toContain("첫줄<br>둘째줄");
  });
});

describe("injectTrackingPixel", () => {
  it("logId가 없으면 HTML을 그대로 반환", () => {
    expect(injectTrackingPixel("<p>본문</p>", null)).toBe("<p>본문</p>");
  });

  it("logId가 있으면 1x1 픽셀 태그를 끝에 붙인다", () => {
    const out = injectTrackingPixel("<p>본문</p>", "log-1");
    expect(out).toContain("<p>본문</p>");
    expect(out).toMatch(/<img[^>]*width="1"[^>]*height="1"/);
    expect(out).toContain("log-1.gif");
  });
});
