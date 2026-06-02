/**
 * ResizableImage — 순수 헬퍼 단위 테스트
 * (NodeView/TipTap 통합은 e2e가 아니면 의미 있는 검증이 어려워 제외)
 */
import { describe, it, expect } from "vitest";
import {
  clampWidth,
  normalizeAlign,
  buildAttributes,
  DEFAULT_ALIGN,
  MIN_WIDTH_PX,
  MAX_WIDTH_PX,
} from "../extensions/resizableImage";

describe("clampWidth", () => {
  it("null/undefined/0 은 null", () => {
    expect(clampWidth(null)).toBe(null);
    expect(clampWidth(undefined)).toBe(null);
    expect(clampWidth(0)).toBe(null);
    expect(clampWidth(-100)).toBe(null);
    expect(clampWidth("xyz")).toBe(null);
  });

  it("범위 안의 값은 그대로 반환", () => {
    expect(clampWidth(400)).toBe(400);
    expect(clampWidth("400")).toBe(400);
    expect(clampWidth(400.4)).toBe(400);
  });

  it("최소/최대 범위로 제한", () => {
    expect(clampWidth(10)).toBe(MIN_WIDTH_PX);
    expect(clampWidth(99999)).toBe(MAX_WIDTH_PX);
  });
});

describe("normalizeAlign", () => {
  it("허용된 값은 그대로", () => {
    for (const a of ["none", "left", "center", "right", "full"]) {
      expect(normalizeAlign(a)).toBe(a);
    }
  });

  it("알 수 없는 값은 기본값으로", () => {
    expect(normalizeAlign("middle")).toBe(DEFAULT_ALIGN);
    expect(normalizeAlign("")).toBe(DEFAULT_ALIGN);
    expect(normalizeAlign(undefined)).toBe(DEFAULT_ALIGN);
  });
});

describe("buildAttributes", () => {
  it("기본값에서는 클래스 + figureStyle 생성", () => {
    const built = buildAttributes({ align: "none", width: null });
    expect(built.figureClass).toContain("yj-image");
    expect(built.figureClass).toContain("yj-image-none");
    expect(built.figureStyle).toBe("");
  });

  it("정렬 center + width=400 → figureStyle 에 width/text-align", () => {
    const built = buildAttributes({ align: "center", width: 400 });
    expect(built.figureClass).toContain("yj-image-center");
    expect(built.figureStyle).toContain("width:400px");
    expect(built.figureStyle).toContain("text-align:center");
  });

  it("rounded/bordered 플래그가 클래스에 반영", () => {
    const built = buildAttributes({ align: "left", rounded: true, bordered: true });
    expect(built.figureClass).toContain("yj-image-rounded");
    expect(built.figureClass).toContain("yj-image-bordered");
  });

  it("회전 각도가 imgStyle 에 transform 으로 반영", () => {
    const built = buildAttributes({ rotation: 90 });
    expect(built.imgStyle).toContain("transform:rotate(90deg)");
  });

  it("width 가 있으면 imgStyle 에 width:100% 추가", () => {
    const built = buildAttributes({ width: 500 });
    expect(built.imgStyle).toContain("width:100%");
  });

  it("범위를 벗어난 width 는 클램핑", () => {
    const tooSmall = buildAttributes({ width: 1 });
    expect(tooSmall.figureStyle).toContain(`width:${MIN_WIDTH_PX}px`);
    const tooBig = buildAttributes({ width: 99999 });
    expect(tooBig.figureStyle).toContain(`width:${MAX_WIDTH_PX}px`);
  });
});
