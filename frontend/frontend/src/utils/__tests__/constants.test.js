/**
 * constants.js / kakaoChannel.js — 전역 상수 무결성 테스트
 * 라벨/옵션 매핑과 URL 생성 규칙의 회귀를 방지한다.
 */
import { describe, it, expect } from "vitest";
import { STATUS_LABELS, STATUS_OPTIONS } from "../constants";
import {
  KAKAO_CHANNEL_ID,
  KAKAO_CHANNEL_HOME,
  KAKAO_CHANNEL_CHAT,
  KAKAO_CHANNEL_ADD,
} from "../kakaoChannel";

describe("STATUS_LABELS / STATUS_OPTIONS", () => {
  it("5가지 상태를 포함한다", () => {
    expect(Object.keys(STATUS_LABELS)).toEqual([
      "inbox", "reading", "completed", "archived", "reference",
    ]);
  });

  it("모든 라벨이 한국어 문자열이다", () => {
    for (const label of Object.values(STATUS_LABELS)) {
      expect(label).toMatch(/[가-힣]/);
    }
  });

  it("STATUS_OPTIONS는 {value, label} 쌍 배열", () => {
    expect(STATUS_OPTIONS.length).toBe(Object.keys(STATUS_LABELS).length);
    for (const opt of STATUS_OPTIONS) {
      expect(opt).toHaveProperty("value");
      expect(opt).toHaveProperty("label");
      expect(STATUS_LABELS[opt.value]).toBe(opt.label);
    }
  });
});

describe("kakaoChannel URL 상수", () => {
  it("KAKAO_CHANNEL_ID는 _로 시작하는 채널 식별자", () => {
    expect(KAKAO_CHANNEL_ID).toMatch(/^_[A-Za-z0-9]+$/);
  });

  it("HOME/CHAT/ADD URL이 모두 pf.kakao.com의 채널 ID 경로를 따른다", () => {
    expect(KAKAO_CHANNEL_HOME).toBe(`https://pf.kakao.com/${KAKAO_CHANNEL_ID}`);
    expect(KAKAO_CHANNEL_CHAT).toBe(`https://pf.kakao.com/${KAKAO_CHANNEL_ID}/chat`);
    expect(KAKAO_CHANNEL_ADD).toBe(`https://pf.kakao.com/${KAKAO_CHANNEL_ID}/friend`);
  });

  it("모두 https로 시작한다", () => {
    [KAKAO_CHANNEL_HOME, KAKAO_CHANNEL_CHAT, KAKAO_CHANNEL_ADD].forEach((url) => {
      expect(url.startsWith("https://")).toBe(true);
    });
  });
});
