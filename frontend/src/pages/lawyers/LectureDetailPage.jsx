/** 강의 상세 페이지 — /lectures/:id (DB) 또는 /lectures/career?title=... (경력 기반) */
import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { BookOpen, ArrowLeft, Calendar, MapPin, Building2, FileText, Download } from "lucide-react";
import { api } from "../../utils/api";

export default function LectureDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);

  // 경력 기반 강의인지 확인 (쿼리 파라미터로 전달된 경우)
  const isCareerBased = id === "career";
  const careerTitle = searchParams.get("title");
  const careerLawyerName = searchParams.get("lawyer");
  const careerLawyerId = searchParams.get("lawyerId");

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (isCareerBased) {
        // 경력 기반: 쿼리 파라미터에서 정보 구성
        setLecture({
          title: careerTitle || "강의",
          description: null,
          date: null,
          venue: null,
          organizer: null,
          thumbnailUrl: null,
          materialUrl: null,
          lawyer: careerLawyerName ? {
            name: careerLawyerName,
            slug: careerLawyerId,
          } : null,
        });
        setLoading(false);
        return;
      }

      // DB 기반: API에서 조회
      setLoading(true);
      api.get(`/lectures/${id}`)
        .then((json) => { if (!cancelled) setLecture(json.data); })
        .catch(() => { if (!cancelled) setLecture(null); })
        .finally(() => { if (!cancelled) setLoading(false); });
    });
    return () => { cancelled = true; };
  }, [id, isCareerBased, careerTitle, careerLawyerName, careerLawyerId]);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "2px solid rgba(0,0,0,0.08)", borderTopColor: "var(--accent-gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!lecture) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <BookOpen size={48} strokeWidth={0.6} color="rgba(0,0,0,0.1)" />
        <p style={{ fontSize: 18, color: "var(--text-muted)" }}>강의 정보를 찾을 수 없습니다</p>
        <Link to="/lawyers" style={{ fontSize: 14, color: "var(--accent-gold)", textDecoration: "none" }}>← 변호사 목록으로</Link>
      </div>
    );
  }

  const lawyer = lecture.lawyer;
  const lawyerLink = lawyer ? `/lawyers/${lawyer.slug || lawyer.id}` : "/lawyers";

  return (
    <div>
      {/* 히어로 */}
      <section style={{
        background: "linear-gradient(135deg, #0a1628 0%, #0f1d32 50%, #0a1628 100%)",
        position: "relative", overflow: "hidden",
      }}>
        {/* 배경 이미지 (썸네일이 있는 경우) */}
        {lecture.thumbnailUrl && (
          <>
            <div className="absolute inset-0" style={{
              backgroundImage: `url(${lecture.thumbnailUrl})`,
              backgroundSize: "cover", backgroundPosition: "center",
              opacity: 0.15,
            }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0a1628 0%, rgba(10,22,40,0.7) 50%, rgba(10,22,40,0.85) 100%)" }} />
          </>
        )}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 80%, rgba(26,58,107,0.06) 0%, transparent 60%)" }} />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "120px 24px 80px", position: "relative", zIndex: 2 }}>
          {/* 뒤로가기 */}
          <Link
            to={lawyer ? lawyerLink : "/lawyers"}
            className="flex items-center gap-2"
            style={{ fontSize: 12, color: "var(--white-40)", textDecoration: "none", marginBottom: 40, letterSpacing: "0.15em", textTransform: "uppercase" }}
          >
            <ArrowLeft size={14} /> {lawyer ? `${lawyer.name} 변호사 프로필` : "변호사 소개"}
          </Link>

          <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(26,58,107,0.15)", borderRadius: 8,
            }}>
              <BookOpen size={24} strokeWidth={1.3} color="#fff" />
            </div>
            <p className="font-en" style={{ fontSize: 11, color: "#fff", letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 500 }}>
              LECTURE
            </p>
          </div>

          <h1 className="font-serif" style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 300, color: "#fff",
            lineHeight: 1.3, marginBottom: 20, wordBreak: "keep-all",
          }}>
            {lecture.title}
          </h1>

          {/* 메타 정보 */}
          {(lecture.date || lecture.organizer || lecture.venue) && (
            <div className="flex flex-wrap gap-6" style={{ marginTop: 24 }}>
              {lecture.date && (
                <div className="flex items-center gap-2" style={{ fontSize: 14, color: "var(--white-50)" }}>
                  <Calendar size={16} strokeWidth={1.3} color="var(--accent-gold)" />
                  {lecture.date}
                </div>
              )}
              {lecture.organizer && (
                <div className="flex items-center gap-2" style={{ fontSize: 14, color: "var(--white-50)" }}>
                  <Building2 size={16} strokeWidth={1.3} color="var(--accent-gold)" />
                  {lecture.organizer}
                </div>
              )}
              {lecture.venue && (
                <div className="flex items-center gap-2" style={{ fontSize: 14, color: "var(--white-50)" }}>
                  <MapPin size={16} strokeWidth={1.3} color="var(--accent-gold)" />
                  {lecture.venue}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ==================== 브레드크럼 ==================== */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 24px 0" }}>
        <nav style={{ fontSize: 13, color: "var(--text-muted)" }}>
          <Link to="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>홈</Link>
          <span style={{ margin: "0 8px" }}>&rsaquo;</span>
          <Link to={lawyer ? lawyerLink : "/lawyers"} style={{ color: "var(--text-muted)", textDecoration: "none" }}>
            {lawyer ? lawyer.name + " 변호사" : "변호사 소개"}
          </Link>
          <span style={{ margin: "0 8px" }}>&rsaquo;</span>
          <span style={{ color: "var(--text-primary)" }}>{lecture.title}</span>
        </nav>
      </div>

      {/* 본문 */}
      <section style={{ background: "#fff" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px" }}>
          {/* 강사 정보 */}
          {lawyer && lawyer.photoUrl && (
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "20px 24px", marginBottom: 48,
              background: "var(--bg-primary)", border: "1px solid var(--border-subtle)",
            }}>
              <img
                src={lawyer.photoUrl} alt={lawyer.name}
                style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }}
              />
              <div>
                <Link
                  to={lawyerLink}
                  style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}
                >
                  {lawyer.name}
                </Link>
                <p style={{ fontSize: 13, color: "var(--accent-gold)", marginTop: 2 }}>{lawyer.position}</p>
              </div>
            </div>
          )}

          {/* 강의 썸네일 이미지 */}
          {lecture.thumbnailUrl && (
            <div style={{ marginBottom: 40, overflow: "hidden" }}>
              <img
                src={lecture.thumbnailUrl}
                alt={lecture.title}
                style={{ width: "100%", maxHeight: 400, objectFit: "cover", display: "block" }}
              />
            </div>
          )}

          {/* 강의 설명 */}
          {lecture.description ? (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>강의 소개</h2>
              <p style={{
                fontSize: 16, color: "var(--text-secondary)",
                lineHeight: 2, fontWeight: 300, whiteSpace: "pre-wrap", wordBreak: "keep-all",
              }}>
                {lecture.description}
              </p>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <BookOpen size={40} strokeWidth={0.6} color="rgba(0,0,0,0.08)" style={{ margin: "0 auto 16px" }} />
              <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.8 }}>
                강의 상세 내용이 곧 업데이트됩니다.
              </p>
            </div>
          )}

          {/* 강의안 다운로드 */}
          {lecture.materialUrl && (
            <div style={{
              marginTop: 48, padding: "24px 28px",
              background: "linear-gradient(135deg, #f8f6f3 0%, #f5f1ec 100%)",
              border: "1px solid rgba(26,58,107,0.15)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 16,
            }}>
              <div className="flex items-center gap-3">
                <FileText size={24} strokeWidth={1.3} color="var(--accent-gold)" />
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>강의안</p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{lecture.materialName || "첨부 파일"}</p>
                </div>
              </div>
              <a
                href={lecture.materialUrl}
                download
                className="flex items-center gap-2"
                style={{
                  fontSize: 13, fontWeight: 500, color: "#fff",
                  background: "var(--accent-gold)", padding: "10px 24px",
                  textDecoration: "none", letterSpacing: "0.05em",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <Download size={16} strokeWidth={1.5} /> 다운로드
              </a>
            </div>
          )}

          {/* 변호사 프로필로 */}
          {lawyer && (
            <div style={{ textAlign: "center", marginTop: 60 }}>
              <Link
                to={lawyerLink}
                className="view-more"
                style={{
                  display: "inline-block",
                  color: "var(--text-primary)", borderColor: "var(--border-subtle)",
                  padding: "12px 36px", fontSize: 13, letterSpacing: "0.1em",
                  textDecoration: "none", transition: "all 0.3s",
                }}
              >
                {lawyer.name} 변호사 프로필 보기
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ===== 상담 안내 ===== */}
      <section style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f1d32 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "80px 24px" }}>
          <div className="reveal">
            <div className="sep mx-auto" style={{ marginBottom: 28 }} />
            <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 300, color: "#fff", marginBottom: 12, letterSpacing: "0.05em" }}>
              법률 문제, 전문가와 상담하세요
            </h2>
            <p style={{ fontSize: 14, color: "var(--white-40)", marginBottom: 36, lineHeight: 1.8, fontWeight: 300 }}>
              사건의 초기 단계부터 전문 변호사의 정확한 분석과 전략을 확인하세요
            </p>
            <Link
              to="/consultation"
              style={{
                display: "inline-block", padding: "14px 48px", fontSize: 13,
                letterSpacing: "0.15em", color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                background: "transparent", textDecoration: "none",
                transition: "all 0.3s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#0a1628"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#fff"; }}
            >
              상담 신청하기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
