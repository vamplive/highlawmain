/**
 * 업무분야 상세 페이지 — 4대 분야(불법파견·게임사기·노동·군사건) 공통 템플릿
 * URL의 :field 슬러그로 데이터를 분기한다.
 */
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowRight, Phone, CheckCircle2, AlertTriangle } from "lucide-react";
import useReveal from "../../hooks/useReveal";
import Seo from "../../components/Seo";
import { buildBreadcrumbJsonLd } from "../../lib/seo";
import { PublicHero, SectionHeading, SurfaceCard } from "../../components/public/PublicDesign";

const FIELDS = {
  "illegal-dispatch": {
    label: "ILLEGAL DISPATCH",
    title: "불법파견",
    eyebrow: "ILLEGAL DISPATCH LAW",
    headline: "도급의 외형, 파견의 실질을 가립니다",
    description: "도급계약서 한 장이 모든 것을 정당화하지 않습니다. 실제 지휘·감독, 노무 통제, 업무 일체성을 따져 위장도급·불법파견 여부를 가려내고 직접고용·차별시정·형사대응까지 완결합니다.",
    metaDescription: "법무법인 하이로 — 불법파견·위장도급 진정, 직접고용 청구, 차별시정, 파견법 위반 형사대응 전문.",
    painPoints: [
      "도급계약이라는데 사용사업주가 직접 지시를 내린다",
      "원청 직원과 동일한 업무를 하면서 급여·복리는 차별받는다",
      "사내하청·외주 형태로 수년째 같은 일을 반복하고 있다",
      "노동부 진정·근로감독을 어떻게 시작해야 할지 모르겠다",
    ],
    services: [
      { title: "위장도급·불법파견 진정", desc: "고용노동부 진정·근로감독 청구. 도급의 실질을 입증하기 위한 증거 수집·진술 전략을 함께 설계합니다." },
      { title: "직접고용 청구 소송", desc: "파견법상 사용사업주의 직접고용 의무 위반에 따른 고용의제·근로계약 체결 청구 소송 수행." },
      { title: "차별시정 신청", desc: "기간제법·파견법상 차별시정 절차로 임금·복리 차별 회복. 노동위원회 심판·중앙노동위원회 재심까지 대리." },
      { title: "파견법 위반 형사대응", desc: "사용사업주·파견사업주에 대한 파견법 위반 형사고소 또는 대리(피의자 변호)." },
    ],
    process: [
      { step: "01", title: "사실관계 정리", desc: "도급계약서, 작업지시 기록, 업무 메신저, 출퇴근 기록 등 증거 점검" },
      { step: "02", title: "파견·도급 판단 분석", desc: "지휘·감독, 인사·노무 권한, 업무 일체성 등 대법원 판단기준 적용" },
      { step: "03", title: "절차 선택", desc: "노동부 진정 / 직접고용 청구 / 차별시정 / 형사고소 중 최적 경로 결정" },
      { step: "04", title: "절차 수행·소송 대리", desc: "노동위·법원·검찰 단계별 대리 및 의뢰인 동행" },
    ],
  },
  "game-fraud": {
    label: "GAME FRAUD",
    title: "게임사기",
    eyebrow: "GAME FRAUD LAW",
    headline: "온라인 게임 환경의 사기·분쟁, 끝까지 대응합니다",
    description: "현금 아이템 거래 사기, 계정 도용·해킹, 게임머니 편취, 운영사 부당 제재까지—온라인 게임 환경 고유의 증거 구조와 운영사 약관을 이해하는 변호인이 형사·민사 양면으로 피해를 회복합니다.",
    metaDescription: "법무법인 하이로 — 게임 아이템·계정 거래 사기 형사고소, 해킹·도용 피해 구제, 게임머니 편취 민사소송, 운영사 제재 이의제기 전문.",
    painPoints: [
      "수백만 원짜리 아이템·계정을 거래했는데 상대가 사라졌다",
      "계정이 해킹되어 아이템·재화가 모두 사라졌다",
      "게임머니·재화 편취 사기로 큰 금전적 피해를 입었다",
      "운영사로부터 부당한 영구정지 처분을 받았다",
    ],
    services: [
      { title: "아이템·계정 거래 사기 형사고소", desc: "사기죄·전자금융거래법 위반 등 적용 가능 죄명을 검토하고 고소장 작성·고소 동행." },
      { title: "해킹·도용 피해 구제", desc: "정보통신망법·개인정보보호법 위반에 따른 형사·민사 동시 대응, 가상자산·계정 환원 청구." },
      { title: "게임머니·재화 편취 민사소송", desc: "부당이득반환·손해배상 청구. 거래내역·채팅로그·운영사 협조요청 등 증거 확보." },
      { title: "운영사 제재 이의제기", desc: "약관 위반·부정행위 판단에 대한 운영사 이의신청, 불복 시 민사소송으로 정지처분 무효 확인." },
    ],
    process: [
      { step: "01", title: "피해 사실 정리", desc: "거래 메시지, 입금 내역, 게임 내 로그, 스크린샷 등 디지털 증거 정리" },
      { step: "02", title: "혐의·청구 구조 설계", desc: "사기·전자금융거래법·정보통신망법·민법상 청구권 등 최적 조합 선정" },
      { step: "03", title: "고소·소송 준비", desc: "고소장·소장 작성, 운영사 사실조회·증거보전 신청" },
      { step: "04", title: "수사·재판 동행", desc: "고소인 조사·검찰 단계 대응, 민사소송 변론 진행" },
    ],
  },
  "labor": {
    label: "LABOR LAW",
    title: "노동",
    eyebrow: "LABOR LAW",
    headline: "근로기준법·산재보험법·노동조합법 전 영역",
    description: "임금체불, 부당해고, 산업재해, 직장 내 괴롭힘, 노조 활동 보장까지—근로자가 일터에서 마주하는 모든 권리 침해에 대응합니다. 노동위원회·법원·근로복지공단 절차를 모두 직접 대리합니다.",
    metaDescription: "법무법인 하이로 — 임금체불·퇴직금, 부당해고 구제신청, 산업재해 보상·민사, 직장 내 괴롭힘 대응 전문.",
    painPoints: [
      "수개월째 임금이 체불되어 생활이 어렵다",
      "정당한 사유 없이 해고·권고사직을 통보받았다",
      "산업재해를 당했지만 회사가 산재 신청을 미루고 있다",
      "직장 내 괴롭힘·성희롱으로 일을 계속할 수 없다",
    ],
    services: [
      { title: "임금체불·퇴직금 청구", desc: "고용노동부 진정, 체불임금 확정, 강제집행, 형사고소까지 일괄 대응." },
      { title: "부당해고 구제신청", desc: "지방노동위원회 구제신청·중앙노동위원회 재심·행정소송까지 단계별 대리." },
      { title: "산업재해 보상·민사", desc: "근로복지공단 산재 승인 신청, 불승인 시 행정심판·소송. 회사 상대 손해배상 민사 병행." },
      { title: "직장 내 괴롭힘 대응", desc: "근로기준법상 신고 절차, 회사 조사 대응, 가해자·사용자 책임 추궁 민·형사 절차." },
    ],
    process: [
      { step: "01", title: "사건 유형 분류", desc: "임금·해고·산재·괴롭힘 등 사건 성격 분류 및 시한 점검(제척기간·신청기한)" },
      { step: "02", title: "증거·기록 확보", desc: "근로계약서, 급여명세, 출퇴근 기록, 메신저, 의무기록 등 수집" },
      { step: "03", title: "최적 절차 선택", desc: "노동부 진정 / 노동위 구제 / 산재 신청 / 민·형사 소송 중 결정" },
      { step: "04", title: "절차 수행·동행", desc: "조사·심판·재판 단계별 대리, 합의 시 합의안 검토 및 협상" },
    ],
  },
  "military": {
    label: "MILITARY CASES",
    title: "군사건",
    eyebrow: "MILITARY LAW",
    headline: "군 수사·군사법원·항고심사위원회의 모든 절차",
    description: "군형사사건, 군 징계·인사처분 항고, 국가배상, 병역 관련 분쟁까지—민간 변호사로서 군의 폐쇄적 절차를 이해하고, 군사법원법·군인사법·군인의 지위 및 복무에 관한 기본법 전 영역에서 의뢰인을 변호합니다.",
    metaDescription: "법무법인 하이로 — 군형사사건 변호, 군 징계·인사처분 항고, 국가배상, 병역·전공상 분쟁 전문.",
    painPoints: [
      "군에서 형사사건 피의자·피해자로 조사를 받고 있다",
      "부당한 징계·전역·인사처분을 받아 항고를 준비 중이다",
      "군 복무 중 다쳤지만 국가배상·보훈 처리가 거부되었다",
      "병역 관련 처분(병역면탈·전공상 불인정 등)에 다투고 싶다",
    ],
    services: [
      { title: "군형사사건 변호", desc: "군수사단·군검찰·군사법원 단계 변호. 군형법·일반형법 모두 대응, 보통군사법원·고등군사법원·대법원까지." },
      { title: "군 징계·인사처분 항고", desc: "징계항고·인사소청·항고심사위원회 절차 대리. 사실관계 입증·양정 다툼·전역 무효 청구까지." },
      { title: "국가배상·보훈 청구", desc: "군 복무 중 사망·상이에 대한 국가배상 청구, 국가유공자·보훈보상자 등록 거부·등급 불복 행정쟁송." },
      { title: "병역·전공상 분쟁", desc: "병역처분 불복, 전공상 인정 여부 다툼, 군무이탈·복무이탈 관련 행정·형사 대응." },
    ],
    process: [
      { step: "01", title: "사건 성격 파악", desc: "군 수사·징계·인사·보훈 등 사건 단계 및 관할 절차 확인" },
      { step: "02", title: "기록·증거 확보", desc: "수사기록 열람·등사, 의무기록, 진술서, 지휘관 보고서 등 수집" },
      { step: "03", title: "방어·청구 전략 수립", desc: "양형·무죄·징계 감경·처분 취소 등 목표별 전략 설계" },
      { step: "04", title: "군 절차·재판 동행", desc: "군 수사·군사법원·항고심사위·행정법원 단계별 변호인 동행" },
    ],
  },
};

export default function PracticeDetailPage() {
  const { field } = useParams();
  const data = FIELDS[field];
  const ref = useReveal();

  if (!data) return <Navigate to="/practice" replace />;

  return (
    <div ref={ref}>
      <Seo
        path={`/practice/${field}`}
        title={`${data.title} — 법무법인 하이로`}
        description={data.metaDescription}
        jsonLd={buildBreadcrumbJsonLd([
          { name: "홈", path: "/" },
          { name: "업무분야", path: "/practice" },
          { name: data.title, path: `/practice/${field}` },
        ])}
      />

      <PublicHero
        eyebrow={data.eyebrow}
        title={data.headline}
        description={data.description}
        primaryAction={{ to: "/consultation", label: "상담 예약", icon: <Phone size={15} /> }}
        secondaryAction={{ href: "tel:02-XXX-XXXX", label: "02-XXX-XXXX" }}
      />

      {/* ━━━ 의뢰인 고민 ━━━ */}
      <section style={{ background: "#fff", padding: "var(--section-py) 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <SectionHeading eyebrow="PAIN POINTS" title="이런 상황이라면 지금 바로 상담하세요" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
            {data.painPoints.map((p, i) => (
              <SurfaceCard key={i} className="reveal flex items-start gap-3" style={{ padding: "20px 24px", background: "var(--bg-primary)", borderLeft: "3px solid var(--accent-gold)" }}>
                <AlertTriangle size={18} color="var(--accent-gold)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 14, color: "var(--gray-600)", lineHeight: 1.6, margin: 0 }}>{p}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 서비스 ━━━ */}
      <section style={{ background: "var(--bg-primary)", padding: "var(--section-py) 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <SectionHeading eyebrow="WHAT WE DO" title={`${data.title} 분야 주요 서비스`} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
            {data.services.map((s, i) => (
              <SurfaceCard key={i} className="reveal" style={{ padding: "32px 28px" }}>
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle2 size={20} color="var(--accent-gold)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{s.title}</h3>
                </div>
                <p style={{ fontSize: 13.5, color: "var(--gray-500)", lineHeight: 1.8, fontWeight: 300, marginLeft: 32 }}>{s.desc}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 절차 ━━━ */}
      <section style={{ background: "#fff", padding: "var(--section-py) 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <SectionHeading eyebrow="OUR PROCESS" title="사건 처리 절차" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger">
            {data.process.map((p, i) => (
              <SurfaceCard key={i} className="reveal" style={{ padding: "28px 22px" }}>
                <p className="font-en" style={{ fontSize: 24, fontWeight: 300, color: "var(--accent-gold)", marginBottom: 12 }}>{p.step}</p>
                <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{p.title}</h4>
                <p style={{ fontSize: 13, color: "var(--gray-500)", lineHeight: 1.7, fontWeight: 300, margin: 0 }}>{p.desc}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f1d32 100%)", padding: "80px 24px" }}>
        <div className="text-center reveal" style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="sep mx-auto" style={{ marginBottom: 32 }} />
          <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 300, color: "#fff", marginBottom: 16, lineHeight: 1.5 }}>
            {data.title} 사건, 시간이 결과를 바꿉니다
          </h2>
          <p style={{ fontSize: 15, color: "var(--white-60)", lineHeight: 1.8, fontWeight: 300, marginBottom: 36 }}>
            법무법인 하이로의 전문 변호사가 직접 상담합니다.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/consultation" className="inline-flex items-center gap-2 transition-all duration-300 hover:opacity-90" style={{ background: "var(--accent-gold)", color: "#fff", padding: "16px 40px", fontSize: 15, fontWeight: 600 }}>
              <Phone size={16} /> 지금 상담 예약 <ArrowRight size={14} />
            </Link>
            <a href="tel:02-XXX-XXXX" className="inline-flex items-center gap-2" style={{ border: "1px solid var(--white-15)", color: "var(--white-40)", padding: "16px 40px", fontSize: 15 }}>
              02-XXX-XXXX
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
