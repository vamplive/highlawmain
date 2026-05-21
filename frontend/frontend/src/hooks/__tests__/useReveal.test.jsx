/**
 * useReveal — IntersectionObserver 기반 페이드인 훅 테스트
 * Observer 생성·타겟 관찰·교차 시 .visible 추가·언마운트 disconnect를 검증한다.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import useReveal from "../useReveal";

/** IntersectionObserver 호출 흔적을 기록하기 위한 mock 인스턴스 모음 */
let observers = [];

beforeEach(() => {
  observers = [];
  // new IntersectionObserver(...)로 호출되므로 function 선언(생성자 가능)으로 모킹
  global.IntersectionObserver = function (callback, options) {
    this.callback = callback;
    this.options = options;
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
    this.trigger = (entries) => callback(entries, this);
    observers.push(this);
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** 훅을 쓰는 최소 컴포넌트 — targets 수는 props로 제어 */
function Probe({ targets = 2 }) {
  const ref = useReveal();
  return (
    <div ref={ref}>
      {Array.from({ length: targets }, (_, i) => (
        <div key={i} className="reveal" data-testid={`t-${i}`}>아이템 {i}</div>
      ))}
    </div>
  );
}

describe("useReveal", () => {
  it(".reveal 타겟이 있으면 IntersectionObserver를 만들어 각각 observe한다", () => {
    render(<Probe targets={3} />);
    expect(observers).toHaveLength(1);
    expect(observers[0].observe).toHaveBeenCalledTimes(3);
    expect(observers[0].options.threshold).toBe(0.15);
  });

  it(".reveal 타겟이 없으면 Observer를 만들지 않는다", () => {
    function Empty() {
      const ref = useReveal();
      return <div ref={ref}><div>일반</div></div>;
    }
    render(<Empty />);
    expect(observers).toHaveLength(0);
  });

  it("교차(intersecting) 시 타겟에 'visible' 클래스를 추가하고 unobserve한다", () => {
    const { getByTestId } = render(<Probe targets={2} />);
    const target0 = getByTestId("t-0");
    const target1 = getByTestId("t-1");

    observers[0].trigger([
      { target: target0, isIntersecting: true },
      { target: target1, isIntersecting: false },
    ]);

    expect(target0.classList.contains("visible")).toBe(true);
    expect(target1.classList.contains("visible")).toBe(false);
    expect(observers[0].unobserve).toHaveBeenCalledWith(target0);
    expect(observers[0].unobserve).not.toHaveBeenCalledWith(target1);
  });

  it("언마운트 시 Observer를 disconnect한다", () => {
    const { unmount } = render(<Probe targets={1} />);
    const observer = observers[0];
    unmount();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });
});
