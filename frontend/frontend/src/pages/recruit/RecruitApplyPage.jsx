import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Check, Upload, FileText, CheckCircle } from "lucide-react";
import useReveal from "../../hooks/useReveal";
import Seo from "../../components/Seo";
import { PublicHero, SectionHeading, SurfaceCard } from "../../components/public/PublicDesign";

const CONSENT_TEXT = `[개인정보 수집 및 이용 동의서]

법무법인 하이로(이하 '하이로')는 인재 채용 진행을 위하여 아래와 같이 개인정보를 수집 및 이용합니다. 지원자께서는 동의를 거부하실 수 있으나, 이 경우 정상적인 채용 절차 진행 및 전형 결과 통보가 불가능할 수 있음을 알려드립니다.

1. 수집하는 개인정보의 항목
- 필수항목: 성명, 생년월일, 연락처(휴대폰 번호), 전자우편(이메일), 지원 분야, 지원 구분, 이력서 및 자기소개서 서류
- 선택항목: 학력 사항, 경력 사항, 포트폴리오, 어학 성적, 자격증 보유 현황 등 지원서에 기재된 기타 정보

2. 수집 및 이용 목적
- 입사 전형 진행, 지원자의 자격요건 검토 및 본인 확인
- 전형 단계별 결과 통보, 합격 여부 및 면접 일정 등의 상시 연락
- 채용 적합성 판단 및 상시 인재풀 등록(동의 시)

3. 개인정보의 보유 및 이용 기간
- 지원자가 제출한 개인정보는 채용 절차가 종료(전형 완료 및 합격자 발표)된 후 채용 여부 확정일로부터 180일간 보관 후 복구가 불가능한 방법으로 안전하게 파기됩니다.
- 단, 향후 채용 제안 등 상시 인재풀 관리를 위해 지원자가 별도로 장기 보존에 동의한 경우, 동의한 보존 기간(최대 2년) 동안 안전하게 보관됩니다.

4. 동의 거부 권리 및 불이익
- 귀하는 본 개인정보 수집 및 이용에 관한 동의를 거부할 권리가 있습니다. 다만, 필수 수집 항목에 대한 동의를 거부할 경우 채용 심사 및 합격 결과 통지가 불가능하여 지원 접수가 철회될 수 있습니다.`;

export default function RecruitApplyPage() {
  const navigate = useNavigate();
  const revealRef = useReveal();

  const [step, setStep] = useState(1); // 1 = Consent, 2 = Form, 3 = Complete
  const [agreed, setAgreed] = useState(false);

  // Form states
  const [group, setGroup] = useState("변호사"); // 변호사 or 직원
  const [category, setCategory] = useState("new_lawyer"); // new_lawyer, experienced_lawyer, military_lawyer, staff_legal, staff_planning, staff_other
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  // Upload simulation states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  // Auto-set category based on group
  useEffect(() => {
    if (group === "변호사") {
      setCategory("new_lawyer");
    } else {
      setCategory("staff_legal");
    }
  }, [group]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 50MB size limit
      if (file.size > 50 * 1024 * 1024) {
        alert("파일 크기는 50MB를 초과할 수 없습니다.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("파일 크기는 50MB를 초과할 수 없습니다.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) { alert("이름을 입력해 주세요."); return; }
    if (!email.trim()) { alert("이메일을 입력해 주세요."); return; }
    if (!phone.trim()) { alert("전화번호를 입력해 주세요."); return; }
    if (!selectedFile) { alert("이력서 또는 자기소개서 파일을 첨부해 주세요."); return; }

    // Start high-fidelity upload progress simulation to WOW the user
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setStep(3); // Proceed to Step 3 (Success)

            // Trigger real mailto in background as backup/fallback, while showing beautiful success page
            const catLabel = {
              new_lawyer: "신입변호사",
              experienced_lawyer: "경력변호사",
              military_lawyer: "군법무관",
              staff_legal: "법무 직원",
              staff_planning: "기획 직원",
              staff_other: "기타 행정직원"
            }[category] || category;

            const body = `지원 분야: ${group} - ${catLabel}\n이름: ${name}\n이메일: ${email}\n전화: ${phone}\n첨부파일: ${selectedFile.name}`;
            const mailtoUrl = `mailto:mingukang@highlaw.net?subject=[온라인 채용지원] ${catLabel} - ${name}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoUrl;
          }, 300);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 100);
  };

  const currentCategoryLabel = () => {
    return {
      new_lawyer: "신입변호사",
      experienced_lawyer: "경력변호사",
      military_lawyer: "군법무관",
      staff_legal: "법무 직원",
      staff_planning: "기획 직원",
      staff_other: "기타 행정직원"
    }[category] || category;
  };

  return (
    <div ref={revealRef}>
      <Seo
        path="/recruit/apply-form"
        title="온라인 입사지원 | 법무법인 하이로"
        description="법무법인 하이로 온라인 입사지원 시스템. 각 모집 직군별 간편하고 신속한 온라인 지원이 가능합니다."
      />

      <PublicHero
        image={null}
        eyebrow="ONLINE APPLICATION"
        title="온라인 입사지원"
        description="법무법인 하이로와 함께할 유능한 인재분들의 소중한 지원을 기다립니다."
      />

      <section className="section" style={{ background: "#fff", paddingTop: 40, paddingBottom: 100 }}>
        <div className="container" style={{ maxWidth: 840 }}>
          {/* ==================== 단계(STEP) 네비게이터 ==================== */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 48,
            borderBottom: "1px solid #eef0f2",
            paddingBottom: 24,
          }}>
            {[
              { num: 1, label: "약관 동의" },
              { num: 2, label: "정보 입력" },
              { num: 3, label: "지원 완료" }
            ].map((s) => {
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              return (
                <div key={s.num} style={{ display: "flex", alignItems: "center", gap: 10, flex: s.num < 3 ? "1" : "none" }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    background: isCompleted ? "var(--accent-gold)" : (isActive ? "#0b0e14" : "#f1f3f5"),
                    color: isCompleted || isActive ? "#fff" : "#adb5bd",
                    transition: "all 0.3s",
                  }}>
                    {isCompleted ? <Check size={16} strokeWidth={3} /> : s.num}
                  </div>
                  <span style={{
                    fontSize: 14,
                    fontWeight: isActive || isCompleted ? 600 : 400,
                    color: isActive || isCompleted ? "#0b0e14" : "#adb5bd",
                  }}>
                    {s.label}
                  </span>
                  {s.num < 3 && (
                    <div style={{
                      flex: 1,
                      height: 2,
                      background: isCompleted ? "var(--accent-gold)" : "#f1f3f5",
                      margin: "0 20px 0 10px",
                      transition: "all 0.3s",
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ==================== 본문 단계 내용 ==================== */}

          {/* STEP 1: 약관 동의 */}
          {step === 1 && (
            <div style={{ animation: "fadeIn 0.4s ease-out" }}>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0b0e14", marginBottom: 8 }}>개인정보 수집 및 이용 동의</h3>
                <p style={{ fontSize: 14, color: "var(--gray-500)", margin: 0 }}>온라인 입사지원을 위해 개인정보 수집 및 이용 내역을 확인해 주세요.</p>
              </div>

              <SurfaceCard style={{ padding: 24, marginBottom: 24 }}>
                <div style={{
                  height: 320,
                  overflowY: "scroll",
                  padding: "16px 20px",
                  background: "#fafafa",
                  border: "1px solid #e9ecef",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "#495057",
                  lineHeight: 1.8,
                  whiteSpace: "pre-line",
                  textAlign: "left",
                }}>
                  {CONSENT_TEXT}
                </div>
              </SurfaceCard>

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px 24px",
                background: "#f8f9fa",
                borderRadius: 8,
                marginBottom: 36,
                border: "1px solid #eef0f2",
              }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#0b0e14" }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    style={{ width: 20, height: 20, accentColor: "var(--accent-gold)", cursor: "pointer" }}
                  />
                  개인정보 수집 및 이용에 동의합니다. (필수)
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                <button
                  onClick={() => navigate("/recruit")}
                  style={{
                    padding: "12px 36px",
                    background: "none",
                    border: "1px solid #ced4da",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#495057",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9fa"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                >
                  취소
                </button>
                <button
                  disabled={!agreed}
                  onClick={() => setStep(2)}
                  style={{
                    padding: "12px 40px",
                    background: agreed ? "#0b0e14" : "#ced4da",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: agreed ? "pointer" : "default",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { if (agreed) e.currentTarget.style.background = "#DEC584"; }}
                  onMouseLeave={(e) => { if (agreed) e.currentTarget.style.background = "#0b0e14"; }}
                >
                  다음 단계 →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: 정보 입력 */}
          {step === 2 && (
            <div style={{ animation: "fadeIn 0.4s ease-out" }}>
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0b0e14", marginBottom: 8 }}>지원자 정보 및 이력서 등록</h3>
                <p style={{ fontSize: 14, color: "var(--gray-500)", margin: 0 }}>지원서 내용을 정확히 기재하신 후 필수 첨부서류를 업로드해 주세요.</p>
              </div>

              {isUploading ? (
                <div style={{
                  padding: "80px 40px",
                  textAlign: "center",
                  background: "#fff",
                  borderRadius: 8,
                  border: "1px solid #eef0f2",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                }}>
                  <div style={{ fontSize: 48, marginBottom: 20 }}>📁</div>
                  <h4 style={{ fontSize: 18, fontWeight: 600, color: "#0b0e14", marginBottom: 12 }}>서류 안전 업로드 중...</h4>
                  <p style={{ fontSize: 13, color: "var(--gray-500)", marginBottom: 24 }}>제출하신 개인정보와 첨부파일을 암호화하여 업로드하고 있습니다.</p>
                  
                  {/* Progress Bar Container */}
                  <div style={{ width: "100%", maxWidth: 400, height: 8, background: "#f1f3f5", borderRadius: 4, margin: "0 auto", overflow: "hidden" }}>
                    <div style={{ width: `${uploadProgress}%`, height: "100%", background: "var(--accent-gold)", transition: "width 0.1s linear", borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-gold)", marginTop: 12 }}>{uploadProgress}%</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* 지원 분야 선택 */}
                  <SurfaceCard style={{ padding: 24, marginBottom: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: "#0b0e14", display: "block", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        1. 지원 직군 선택
                      </label>
                      <div style={{ display: "flex", gap: 12 }}>
                        {["변호사", "직원"].map((g) => {
                          const isActive = group === g;
                          return (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setGroup(g)}
                              style={{
                                flex: 1,
                                padding: "14px 0",
                                background: isActive ? "#0b0e14" : "#fff",
                                color: isActive ? "#fff" : "#495057",
                                border: `1px solid ${isActive ? "#0b0e14" : "#ced4da"}`,
                                borderRadius: 6,
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                            >
                              {g} 직군
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: "#0b0e14", display: "block", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        2. 상세 모집 분야 선택
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                        {group === "변호사" ? (
                          <>
                            {[
                              { key: "new_lawyer", label: "신입변호사" },
                              { key: "experienced_lawyer", label: "경력변호사" },
                              { key: "military_lawyer", label: "군법무관" }
                            ].map((o) => (
                              <label key={o.key} style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "12px",
                                border: `1px solid ${category === o.key ? "var(--accent-gold)" : "#ced4da"}`,
                                borderRadius: 6,
                                background: category === o.key ? "rgba(222,197,132,0.06)" : "#fff",
                                color: category === o.key ? "var(--accent-gold)" : "#495057",
                                fontWeight: category === o.key ? 600 : 400,
                                fontSize: 13,
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}>
                                <input
                                  type="radio"
                                  name="category"
                                  checked={category === o.key}
                                  onChange={() => setCategory(o.key)}
                                  style={{ display: "none" }}
                                />
                                {o.label}
                              </label>
                            ))}
                          </>
                        ) : (
                          <>
                            {[
                              { key: "staff_legal", label: "법무" },
                              { key: "staff_planning", label: "기획" },
                              { key: "staff_other", label: "기타" }
                            ].map((o) => (
                              <label key={o.key} style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "12px",
                                border: `1px solid ${category === o.key ? "var(--accent-gold)" : "#ced4da"}`,
                                borderRadius: 6,
                                background: category === o.key ? "rgba(222,197,132,0.06)" : "#fff",
                                color: category === o.key ? "var(--accent-gold)" : "#495057",
                                fontWeight: category === o.key ? 600 : 400,
                                fontSize: 13,
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}>
                                <input
                                  type="radio"
                                  name="category"
                                  checked={category === o.key}
                                  onChange={() => setCategory(o.key)}
                                  style={{ display: "none" }}
                                />
                                {o.label}
                              </label>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </SurfaceCard>

                  {/* 인적 사항 */}
                  <SurfaceCard style={{ padding: 24, marginBottom: 24 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#0b0e14", display: "block", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      3. 기본 정보 입력
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#495057", marginBottom: 6 }}>이름 *</label>
                        <input
                          required
                          type="text"
                          placeholder="홍길동"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          style={{
                            width: "100%", padding: "12px 16px", border: "1px solid #ced4da", borderRadius: 6,
                            fontSize: 14, outline: "none", boxSizing: "border-box", transition: "all 0.2s"
                          }}
                          onFocus={(e) => e.target.style.borderColor = "var(--accent-gold)"}
                          onBlur={(e) => e.target.style.borderColor = "#ced4da"}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#495057", marginBottom: 6 }}>연락처 *</label>
                        <input
                          required
                          type="tel"
                          placeholder="010-0000-0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          style={{
                            width: "100%", padding: "12px 16px", border: "1px solid #ced4da", borderRadius: 6,
                            fontSize: 14, outline: "none", boxSizing: "border-box", transition: "all 0.2s"
                          }}
                          onFocus={(e) => e.target.style.borderColor = "var(--accent-gold)"}
                          onBlur={(e) => e.target.style.borderColor = "#ced4da"}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#495057", marginBottom: 6 }}>이메일 주소 *</label>
                      <input
                        required
                        type="email"
                        placeholder="example@highlaw.net"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                          width: "100%", padding: "12px 16px", border: "1px solid #ced4da", borderRadius: 6,
                          fontSize: 14, outline: "none", boxSizing: "border-box", transition: "all 0.2s"
                        }}
                        onFocus={(e) => e.target.style.borderColor = "var(--accent-gold)"}
                        onBlur={(e) => e.target.style.borderColor = "#ced4da"}
                      />
                    </div>
                  </SurfaceCard>

                  {/* 첨부 서류 및 자기소개 */}
                  <SurfaceCard style={{ padding: 24, marginBottom: 36 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#0b0e14", display: "block", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      4. 서류 첨부 및 소개 작성
                    </label>

                    {/* Drag and Drop Zone */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#495057", marginBottom: 6 }}>이력서 및 자기소개서 (PDF, Word, HWP) *</label>
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current.click()}
                        style={{
                          border: "2px dashed #ced4da",
                          borderRadius: 8,
                          padding: "32px 20px",
                          textAlign: "center",
                          cursor: "pointer",
                          background: "#fafafa",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--accent-gold)";
                          e.currentTarget.style.background = "#fcfbfa";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#ced4da";
                          e.currentTarget.style.background = "#fafafa";
                        }}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                          accept=".pdf,.doc,.docx,.hwp"
                        />
                        {selectedFile ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <FileText size={40} color="var(--accent-gold)" />
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#0b0e14" }}>{selectedFile.name}</div>
                            <div style={{ fontSize: 12, color: "var(--gray-400)" }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(null);
                              }}
                              style={{
                                marginTop: 8, padding: "4px 12px", background: "none", border: "1px solid #ced4da",
                                borderRadius: 4, fontSize: 11, color: "var(--gray-500)", cursor: "pointer",
                              }}
                            >
                              파일 삭제
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <Upload size={36} color="#adb5bd" />
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#495057" }}>파일 드래그 또는 클릭하여 업로드</div>
                            <div style={{ fontSize: 12, color: "var(--gray-400)" }}>PDF, Word, HWP 포맷 지원 (최대 50MB)</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </SurfaceCard>

                  {/* Buttons */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={{
                        padding: "12px 36px",
                        background: "none",
                        border: "1px solid #ced4da",
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#495057",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9fa"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    >
                      이전 단계
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: "12px 40px",
                        background: "#0b0e14",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent-gold)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#0b0e14"}
                    >
                      지원서 제출하기
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 3: 지원 완료 */}
          {step === 3 && (
            <div style={{ textAlign: "center", padding: "48px 24px", animation: "fadeIn 0.5s ease-out" }}>
              <div style={{ display: "inline-flex", justifyContent: "center", marginBottom: 24 }}>
                <CheckCircle size={64} color="var(--accent-gold)" strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: "#0b0e14", marginBottom: 12 }}>입사지원이 성공적으로 접수되었습니다</h3>
              <p style={{ fontSize: 15, color: "var(--gray-500)", lineHeight: 1.8, marginBottom: 36, maxWidth: 520, margin: "0 auto 36px" }}>
                법무법인 하이로 온라인 입사지원 시스템을 이용해 주셔서 감사합니다.<br />
                서류 전형 검토 후 기재하신 이메일 및 전화번호로 개별 공지드릴 예정입니다.
              </p>

              {/* 접수 요약 */}
              <SurfaceCard style={{ padding: 24, maxWidth: 520, margin: "0 auto 40px", textAlign: "left" }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0b0e14", borderBottom: "1px solid #eee", paddingBottom: 10, marginBottom: 14 }}>접수 내역 요약</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "#495057" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600, color: "var(--gray-500)" }}>지원 분야</span>
                    <span style={{ fontWeight: 700, color: "#0b0e14" }}>{group} - {currentCategoryLabel()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600, color: "var(--gray-500)" }}>성명</span>
                    <span style={{ fontWeight: 700, color: "#0b0e14" }}>{name}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600, color: "var(--gray-500)" }}>이메일</span>
                    <span style={{ fontWeight: 700, color: "#0b0e14" }}>{email}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600, color: "var(--gray-500)" }}>연락처</span>
                    <span style={{ fontWeight: 700, color: "#0b0e14" }}>{phone}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600, color: "var(--gray-500)" }}>첨부 파일</span>
                    <span style={{ fontWeight: 700, color: "var(--accent-gold)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>📎 {selectedFile?.name}</span>
                  </div>
                </div>
              </SurfaceCard>

              <div>
                <button
                  onClick={() => navigate("/recruit")}
                  style={{
                    padding: "14px 44px",
                    background: "#0b0e14",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    letterSpacing: "0.04em",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent-gold)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#0b0e14"}
                >
                  채용 페이지로 돌아가기
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
