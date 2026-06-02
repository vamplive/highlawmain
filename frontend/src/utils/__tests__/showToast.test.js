/**
 * showToast.js — 토스트 DOM 삽입/자동 제거 타이밍 테스트
 * (색상 검증은 jsdom CSS 파서가 cssText 숏핸드를 드롭해 스킵한다)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { showToast } from "../showToast";
import { TOAST_DURATION_MS, TOAST_FADEOUT_MS } from "../timing";

describe("showToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("DOM에 토스트 엘리먼트를 추가한다", () => {
    showToast("저장 실패", "error");
    const el = document.body.querySelector("div");
    expect(el).not.toBeNull();
    expect(el.textContent).toBe("저장 실패");
  });

  it("body의 마지막 자식으로 추가된다", () => {
    document.body.appendChild(document.createElement("main"));
    showToast("메시지");
    expect(document.body.lastChild.textContent).toBe("메시지");
  });

  it("여러 번 호출하면 여러 개가 쌓인다", () => {
    showToast("A");
    showToast("B");
    const els = document.body.querySelectorAll("div");
    expect(els.length).toBe(2);
    expect(els[0].textContent).toBe("A");
    expect(els[1].textContent).toBe("B");
  });

  it("TOAST_DURATION_MS 이후 opacity가 0으로 바뀐다", () => {
    showToast("잠깐만");
    const el = document.body.querySelector("div");
    vi.advanceTimersByTime(TOAST_DURATION_MS);
    expect(el.style.opacity).toBe("0");
    expect(document.body.contains(el)).toBe(true);
  });

  it("TOAST_DURATION_MS + FADEOUT_MS 이후 DOM에서 제거된다", () => {
    showToast("사라질");
    const el = document.body.querySelector("div");
    vi.advanceTimersByTime(TOAST_DURATION_MS + TOAST_FADEOUT_MS);
    expect(document.body.contains(el)).toBe(false);
  });

  it("타이머가 실행되기 전에는 DOM에 남아있다", () => {
    showToast("아직");
    const el = document.body.querySelector("div");
    vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
    expect(document.body.contains(el)).toBe(true);
    expect(el.style.opacity).not.toBe("0");
  });
});
