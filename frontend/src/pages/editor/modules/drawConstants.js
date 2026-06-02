/**
 * 그리기 도구 상수 — 펜/형광펜 도구, 색상 팔레트 등
 */
import { Pencil, Pen } from "lucide-react";

/** 아이콘 기본/대형 크기 */
export const ICON_SIZE = 12;
export const ICON_SIZE_LARGE = 18;

/** 펜 도구 종류 정의 */
export const PEN_TOOLS = [
  { id: "fine", label: "가는 펜", width: 1, icon: Pencil },
  { id: "medium", label: "중간 펜", width: 3, icon: Pen },
  { id: "thick", label: "굵은 펜", width: 6, icon: Pen },
];

/** 형광펜 도구 종류 정의 */
export const HIGHLIGHTER_TOOLS = [
  { id: "highlight-thin", label: "가는 형광펜", width: 8, opacity: 0.4 },
  { id: "highlight-thick", label: "굵은 형광펜", width: 16, opacity: 0.4 },
];

/** 기본 펜 색상 팔레트 */
export const PEN_COLORS = [
  "#000000", "#FF0000", "#0000FF", "#008000", "#FF8C00",
  "#800080", "#A52A2A", "#4169E1", "#2E8B57", "#DC143C",
];

/** 형광펜 기본 색상 팔레트 */
export const HIGHLIGHTER_COLORS = [
  "#FFFF00", "#00FF00", "#00FFFF", "#FF69B4", "#FFA500",
  "#87CEEB", "#DDA0DD", "#98FB98", "#FFB6C1", "#FFDAB9",
];

/** 최대 보관할 최근 사용 색상 수 */
export const MAX_RECENT_COLORS = 10;
