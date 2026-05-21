/**
 * 히어로 배경 영상 시드 데이터
 * - frontend/public/videos/ 내 로컬 파일 30개 등록
 * - 실행: node seed-hero-videos.js
 */
const { db } = require("../db");
const { heroVideos } = require("../db/schema");

const VIDEOS = [
  // ── 맨하탄 (12개) ──
  { title: "맨하탄 도시 타임랩스", url: "/videos/manhattan-city-timelapse.mp4", category: "manhattan", sortOrder: 1, isActive: 1 },
  { title: "맨하탄 야간 스카이라인", url: "/videos/manhattan-skyline-night.mp4", category: "manhattan", sortOrder: 2 },
  { title: "맨하탄 파노라마 전경", url: "/videos/manhattan-panoramic.mp4", category: "manhattan", sortOrder: 3 },
  { title: "맨하탄 워터프론트", url: "/videos/manhattan-waterfront.mp4", category: "manhattan", sortOrder: 4 },
  { title: "맨하탄 하이 앵글 뷰", url: "/videos/manhattan-highview.mp4", category: "manhattan", sortOrder: 5 },
  { title: "맨하탄 교차로 틸트시프트", url: "/videos/manhattan-crossroad.mp4", category: "manhattan", sortOrder: 6 },
  { title: "맨하탄 황혼 항공촬영", url: "/videos/manhattan-aerial-dusk.mp4", category: "manhattan", sortOrder: 7 },
  { title: "맨하탄 브릿지와 성조기", url: "/videos/manhattan-bridge-flag.mp4", category: "manhattan", sortOrder: 8 },
  { title: "미드타운 맨하탄", url: "/videos/manhattan-midtown.mp4", category: "manhattan", sortOrder: 9 },
  { title: "맨하탄 대로 교통", url: "/videos/manhattan-avenue-traffic.mp4", category: "manhattan", sortOrder: 10 },
  { title: "맨하탄 대로 항공 뷰", url: "/videos/manhattan-aerial-avenue.mp4", category: "manhattan", sortOrder: 11 },
  { title: "엠파이어 스테이트 빌딩", url: "/videos/manhattan-empire-state.mp4", category: "manhattan", sortOrder: 12 },

  // ── 뉴욕시 (5개) ──
  { title: "맨하탄 비오기 전", url: "/videos/manhattan-before-rain.mp4", category: "nyc", sortOrder: 13 },
  { title: "맨하탄 마천루 에픽 샷", url: "/videos/manhattan-skyscrapers-epic.mp4", category: "nyc", sortOrder: 14 },
  { title: "맨하탄 빌딩 황혼", url: "/videos/manhattan-buildings-dusk.mp4", category: "nyc", sortOrder: 15 },
  { title: "맨하탄 오피스 빌딩 항공", url: "/videos/manhattan-office-buildings.mp4", category: "nyc", sortOrder: 16 },
  { title: "맨하탄 세피아 항공촬영", url: "/videos/manhattan-sepia-aerial.mp4", category: "nyc", sortOrder: 17 },

  // ── 도시 풍경 (8개) ──
  { title: "타임스퀘어 거리", url: "/videos/nyc-times-square.mp4", category: "cityscape", sortOrder: 18 },
  { title: "뉴욕 야경", url: "/videos/nyc-night-sky.mp4", category: "cityscape", sortOrder: 19 },
  { title: "센트럴파크와 마천루", url: "/videos/nyc-central-park.mp4", category: "cityscape", sortOrder: 20 },
  { title: "뉴욕 야간 항공촬영", url: "/videos/nyc-aerial-night.mp4", category: "cityscape", sortOrder: 21 },
  { title: "자유의 여신상", url: "/videos/nyc-statue-liberty.mp4", category: "cityscape", sortOrder: 22 },
  { title: "도시 스카이라인", url: "/videos/city-skyline-generic.mp4", category: "cityscape", sortOrder: 23 },
  { title: "도시 일출 타임랩스", url: "/videos/city-sunrise-timelapse.mp4", category: "cityscape", sortOrder: 24 },
  { title: "도시 위 구름", url: "/videos/city-clouds-skyline.mp4", category: "cityscape", sortOrder: 25 },

  // ── 오피스 (5개) ──
  { title: "도시 일출", url: "/videos/city-sun-rises.mp4", category: "office", sortOrder: 26 },
  { title: "분주한 오피스", url: "/videos/office-busy-space.mp4", category: "office", sortOrder: 27 },
  { title: "비즈니스 미팅", url: "/videos/office-meeting.mp4", category: "office", sortOrder: 28 },
  { title: "오피스 빌딩 로비", url: "/videos/office-lobby.mp4", category: "office", sortOrder: 29 },
  { title: "오픈 오피스 공간", url: "/videos/office-open-space.mp4", category: "office", sortOrder: 30 },

  // ── 스카이라인 (20개) ──
  { title: "뉴욕 틸트 항공촬영", url: "/videos/skyline-ny-tilt-aerial.mp4", category: "manhattan", sortOrder: 31 },
  { title: "뉴욕 아침 스카이라인", url: "/videos/skyline-ny-morning.mp4", category: "manhattan", sortOrder: 32 },
  { title: "911 메모리얼과 스카이라인", url: "/videos/skyline-911-memorial.mp4", category: "manhattan", sortOrder: 33 },
  { title: "브루클린 브릿지 교통", url: "/videos/skyline-brooklyn-bridge.mp4", category: "manhattan", sortOrder: 34 },
  { title: "뉴욕 항구 스카이라인", url: "/videos/skyline-ny-harbor.mp4", category: "manhattan", sortOrder: 35 },
  { title: "센트럴파크에서 본 스카이라인", url: "/videos/skyline-central-park-view.mp4", category: "manhattan", sortOrder: 36 },
  { title: "뉴욕 빌딩 스카이라인", url: "/videos/skyline-ny-buildings.mp4", category: "manhattan", sortOrder: 37 },
  { title: "뉴욕 야간 항공 스카이라인", url: "/videos/skyline-ny-night-aerial.mp4", category: "manhattan", sortOrder: 38 },
  { title: "바다에서 본 뉴욕 스카이라인", url: "/videos/skyline-nyc-from-sea.mp4", category: "manhattan", sortOrder: 39 },
  { title: "뉴욕 도심 항공촬영", url: "/videos/skyline-ny-urban-aerial.mp4", category: "manhattan", sortOrder: 40 },
  { title: "석양의 마천루", url: "/videos/skyline-sunset-skyscrapers.mp4", category: "manhattan", sortOrder: 41 },
  { title: "뉴욕 일출 스카이라인", url: "/videos/skyline-ny-sunrise.mp4", category: "manhattan", sortOrder: 42 },
  { title: "브루클린 브릿지 비행촬영", url: "/videos/skyline-brooklyn-bridge-fly.mp4", category: "manhattan", sortOrder: 43 },
  { title: "뉴욕 아파트 지역 항공뷰", url: "/videos/skyline-nyc-apartments.mp4", category: "manhattan", sortOrder: 44 },
  { title: "뉴욕 하루 타임랩스", url: "/videos/skyline-ny-timelapse-day.mp4", category: "manhattan", sortOrder: 45 },
  { title: "맨하탄 빌딩과 마천루", url: "/videos/skyline-manhattan-buildings.mp4", category: "manhattan", sortOrder: 46 },
  { title: "뉴욕시 줌 촬영", url: "/videos/skyline-zoom-nyc.mp4", category: "manhattan", sortOrder: 47 },
  { title: "다운타운 맨하탄 새벽", url: "/videos/skyline-downtown-early.mp4", category: "manhattan", sortOrder: 48 },
  { title: "센트럴파크와 빌딩 스카이라인", url: "/videos/skyline-central-park-bldgs.mp4", category: "manhattan", sortOrder: 49 },
  { title: "뉴욕 클래식 스카이라인", url: "/videos/skyline-ny-classic.mp4", category: "manhattan", sortOrder: 50 },
];

async function seed() {
  console.log("히어로 영상 시드 시작...");

  // 기존 데이터 삭제
  await db.delete(heroVideos);

  for (const v of VIDEOS) {
    await db.insert(heroVideos).values({
      title: v.title,
      url: v.url,
      category: v.category,
      isActive: v.isActive || 0,
      sortOrder: v.sortOrder || 0,
    });
  }

  console.log(`${VIDEOS.length}개 영상 시드 완료`);
  process.exit(0);
}

seed().catch((e) => {
  console.error("시드 실패:", e);
  process.exit(1);
});
