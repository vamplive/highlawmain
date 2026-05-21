/**
 * 비디오 에디터 — 프리미어 프로 스타일 풀스크린 에디터
 * 상단 바 + 비디오 프리뷰 + 속성 패널 + 타임라인 구성
 */
import { useState, useEffect, useRef } from "react";
import {
  D, topBtn, SPEED_OPTIONS, WAVEFORM_BAR_COUNT,
  buildCssFilter, buildCssTransform, formatTimecode,
} from "./constants";
import TransportControls from "./TransportControls";
import PropertyPanel from "./PropertyPanel";
import Timeline from "./Timeline";

export default function VideoEditor({ video, onClose, onActivate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [trimIn, setTrimIn] = useState(0);
  const [trimOut, setTrimOut] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [activePanel, setActivePanel] = useState("color");
  const [videoMeta, setVideoMeta] = useState({ width: 0, height: 0, fps: 0 });

  const [filters, setFilters] = useState({
    brightness: 100, contrast: 100, saturate: 100,
    hueRotate: 0, sepia: 0, blur: 0, opacity: 100,
    temperature: 0, vignette: 0,
  });

  const [transform, setTransform] = useState({
    scale: 100, rotate: 0, translateX: 0, translateY: 0,
    flipH: false, flipV: false,
  });

  const cssFilter = buildCssFilter(filters);
  const cssTransform = buildCssTransform(transform);

  /* ── 비디오 이벤트 ── */
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const onMeta = () => {
      setDuration(videoEl.duration);
      setTrimOut(videoEl.duration);
      setVideoMeta({ width: videoEl.videoWidth, height: videoEl.videoHeight, fps: 30 });
    };
    const onTime = () => setCurrentTime(videoEl.currentTime);
    const onEnd = () => setPlaying(false);
    videoEl.addEventListener("loadedmetadata", onMeta);
    videoEl.addEventListener("timeupdate", onTime);
    videoEl.addEventListener("ended", onEnd);
    return () => {
      videoEl.removeEventListener("loadedmetadata", onMeta);
      videoEl.removeEventListener("timeupdate", onTime);
      videoEl.removeEventListener("ended", onEnd);
    };
  }, [video.url]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) videoEl.playbackRate = speed;
  }, [speed]);

  /* ── 트림 영역 밖 정지 ── */
  useEffect(() => {
    if (playing && currentTime >= trimOut) {
      videoRef.current?.pause();
      queueMicrotask(() => setPlaying(false));
    }
  }, [currentTime, trimOut, playing]);

  const togglePlay = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (playing) {
      videoEl.pause();
    } else {
      if (videoEl.currentTime < trimIn || videoEl.currentTime >= trimOut) videoEl.currentTime = trimIn;
      videoEl.play();
    }
    setPlaying(!playing);
  };

  const seek = (t) => {
    if (videoRef.current) {
      videoRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };

  const stepFrame = (dir) =>
    seek(Math.max(0, Math.min(duration, currentTime + dir / 30)));

  const exportSnapshot = () => {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    if (!videoEl || !canvasEl) return;
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    const ctx = canvasEl.getContext("2d");
    ctx.filter = cssFilter;
    ctx.save();
    ctx.translate(canvasEl.width / 2, canvasEl.height / 2);
    ctx.rotate((transform.rotate * Math.PI) / 180);
    ctx.scale(
      (transform.scale / 100) * (transform.flipH ? -1 : 1),
      (transform.scale / 100) * (transform.flipV ? -1 : 1)
    );
    ctx.drawImage(videoEl, -canvasEl.width / 2, -canvasEl.height / 2, canvasEl.width, canvasEl.height);
    ctx.restore();
    canvasEl.toBlob((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${video.title}-snapshot.png`;
      link.click();
    });
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: D.bg, display: "flex", flexDirection: "column",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* ── 상단 바 ── */}
      <div
        style={{
          height: 42, background: D.surface,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", borderBottom: `1px solid ${D.border}`, flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: D.accent }}>◆</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: D.text, letterSpacing: "0.04em" }}>VIDEO EDITOR</span>
          <span style={{ fontSize: 11, color: D.textDim, marginLeft: 8 }}>— {video.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={exportSnapshot} style={topBtn}>📷 스냅샷</button>
          {!video.isActive && (
            <button onClick={() => onActivate(video.id)} style={{ ...topBtn, background: D.accent, color: "#fff" }}>
              활성화
            </button>
          )}
          <button onClick={onClose} style={{ ...topBtn, color: D.red }}>✕ 닫기</button>
        </div>
      </div>

      {/* ── 메인 영역 ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* 프리뷰 영역 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0a0a14" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "relative", overflow: "hidden", boxShadow: "0 0 60px rgba(0,0,0,0.5)" }}>
              <video
                ref={videoRef}
                src={video.url}
                muted={volume === 0}
                playsInline
                style={{ maxWidth: `${zoom}%`, maxHeight: "100%", filter: cssFilter, transform: cssTransform, display: "block" }}
              />
              {filters.vignette > 0 && (
                <div
                  style={{
                    position: "absolute", inset: 0, pointerEvents: "none",
                    background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${filters.vignette / 100}) 100%)`,
                  }}
                />
              )}
            </div>
          </div>

          <TransportControls
            playing={playing} currentTime={currentTime} duration={duration}
            speed={speed} zoom={zoom} trimIn={trimIn} trimOut={trimOut}
            onTogglePlay={togglePlay} onSeek={seek} onStepFrame={stepFrame}
            onSpeedChange={setSpeed} onZoomChange={setZoom}
            formatTimecode={formatTimecode} speedOptions={SPEED_OPTIONS}
          />
        </div>

        <PropertyPanel
          activePanel={activePanel} setActivePanel={setActivePanel}
          filters={filters} setFilters={setFilters}
          transform={transform} setTransform={setTransform}
          trimIn={trimIn} trimOut={trimOut} duration={duration}
          currentTime={currentTime} setTrimIn={setTrimIn} setTrimOut={setTrimOut}
          formatTimecode={formatTimecode} video={video} videoMeta={videoMeta}
        />
      </div>

      {/* ── 하단 타임라인 ── */}
      <Timeline
        duration={duration} currentTime={currentTime}
        trimIn={trimIn} trimOut={trimOut}
        onSeek={seek} formatTimecode={formatTimecode}
        barCount={WAVEFORM_BAR_COUNT}
      />
    </div>
  );
}
