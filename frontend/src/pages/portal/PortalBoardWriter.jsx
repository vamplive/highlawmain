import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PortalBoardWriter() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#64748b" }}>
        <ArrowLeft size={16} /> 돌아가기
      </button>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>게시글 작성 기능이 준비 중입니다.</p>
    </div>
  );
}
