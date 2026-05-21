/**
 * 페이지 레이아웃 훅
 * — EditorPage에서 분리된 여백, 용지, 방향, 페이지 계산 로직
 */
import { useState, useMemo } from "react";
import { MARGIN_PRESETS, PAGE_SIZES } from "../modules/constants";

/** 페이지 갭 높이 (페이지 사이 회색 영역) */
const PAGE_GAP = 40;

export default function usePageLayout() {
  const [margins, setMargins] = useState("normal");
  const [customMargins, setCustomMargins] = useState({ top: 96, bottom: 96, left: 120, right: 120 });
  const [orientation, setOrientation] = useState("portrait");
  const [pageSize, setPageSize] = useState("a4");
  const [columns, setColumns] = useState(1);
  const [pageColor, setPageColor] = useState("#ffffff");
  const [watermarkText, setWatermarkText] = useState("");
  const [pageBorder, setPageBorder] = useState(null);
  const [headerFooterSettings, setHeaderFooterSettings] = useState({
    headerPos: 12.5, footerPos: 12.5, differentFirstPage: false, differentOddEven: false,
  });

  /** 계산된 페이지 치수 */
  const dimensions = useMemo(() => {
    const pageDim = PAGE_SIZES.find(p => p.value === pageSize) || PAGE_SIZES[0];
    const marginPreset = MARGIN_PRESETS.find(m => m.value === margins) || MARGIN_PRESETS[1];

    const pageW = orientation === "portrait" ? pageDim.width : pageDim.height;
    const pageH = orientation === "portrait" ? pageDim.height : pageDim.width;
    const marginTop = margins === "custom" ? customMargins.top : marginPreset.top;
    const marginBottom = margins === "custom" ? customMargins.bottom : marginPreset.bottom;
    const marginLeft = margins === "custom" ? customMargins.left : marginPreset.left;
    const marginRight = margins === "custom" ? customMargins.right : marginPreset.right;
    const contentAreaHeight = pageH - marginTop - marginBottom;
    const gapH = marginBottom + PAGE_GAP + marginTop;

    return { pageW, pageH, marginTop, marginBottom, marginLeft, marginRight, contentAreaHeight, gapH };
  }, [margins, customMargins, orientation, pageSize]);

  return {
    // 상태
    margins, setMargins,
    customMargins, setCustomMargins,
    orientation, setOrientation,
    pageSize, setPageSize,
    columns, setColumns,
    pageColor, setPageColor,
    watermarkText, setWatermarkText,
    pageBorder, setPageBorder,
    headerFooterSettings, setHeaderFooterSettings,
    // 계산값
    ...dimensions,
    PAGE_GAP,
  };
}
