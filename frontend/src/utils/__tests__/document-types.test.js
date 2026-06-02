/**
 * document-types.js — 문서 유형 라벨/색상 매핑 테스트
 */
import { describe, it, expect } from "vitest";
import {
  TYPE_CONFIG,
  ALL_DOCUMENT_TYPES,
  getTypeLabel,
  getTypeColor,
} from "../document-types";

describe("TYPE_CONFIG / ALL_DOCUMENT_TYPES", () => {
  it("7개 유형을 모두 포함한다", () => {
    expect(ALL_DOCUMENT_TYPES).toEqual([
      "statute", "case_law", "textbook", "book", "paper", "news", "note",
    ]);
  });

  it("각 항목은 label과 color를 가진다", () => {
    for (const type of ALL_DOCUMENT_TYPES) {
      expect(TYPE_CONFIG[type]).toHaveProperty("label");
      expect(TYPE_CONFIG[type].color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe("getTypeLabel", () => {
  it("등록된 유형은 한국어 라벨을 반환한다", () => {
    expect(getTypeLabel("statute")).toBe("법령");
    expect(getTypeLabel("case_law")).toBe("판례");
    expect(getTypeLabel("note")).toBe("메모");
  });

  it("알 수 없는 유형은 입력 문자열을 그대로 반환한다", () => {
    expect(getTypeLabel("unknown")).toBe("unknown");
    expect(getTypeLabel("")).toBe("");
  });
});

describe("getTypeColor", () => {
  it("등록된 유형의 hex 색상을 반환한다", () => {
    expect(getTypeColor("statute")).toBe("#3498db");
    expect(getTypeColor("news")).toBe("#2ecc71");
  });

  it("알 수 없는 유형은 폴백 회색(#95a5a6)을 반환한다", () => {
    expect(getTypeColor("unknown")).toBe("#95a5a6");
    expect(getTypeColor(undefined)).toBe("#95a5a6");
  });
});
