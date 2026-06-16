import { useState, useEffect, useRef } from "react";
import { portalApi } from "../../utils/api";
import { T, fieldStyle, labelStyle } from "./portalStyles";
import { Receipt, Upload, Trash2, AlertCircle, X, FileText, CheckCircle } from "lucide-react";

const PAGE_HEADER = {
  background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
  borderRadius: 16,
  padding: "28px 32px",
  marginBottom: 28,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  gap: 18,
  boxShadow: "0 8px 32px rgba(14,165,233,0.22)",
};

const OCR_STATUS_LABEL = {
  pending: "검토 대기",
  processing: "처리 중",
  done: "완료",
  failed: "실패",
};

export default function PortalReceipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, []);

  async function fetchReceipts() {
    setLoading(true);
    setError("");
    try {
      const res = await portalApi.get("/receipts");
      setReceipts(res.data || []);
    } catch (e) {
      setError(e.message || "영수증 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("이 영수증을 삭제하시겠습니까?")) return;
    try {
      await portalApi.delete(`/receipts/${id}`);
      setReceipts((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert(e.message || "삭제에 실패했습니다.");
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      <div style={PAGE_HEADER}>
        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Receipt size={28} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>영수증 제출</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, opacity: 0.85 }}>비용 처리를 위한 영수증을 업로드해주세요</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button
          onClick={() => setShowUpload(true)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", background: T.accent, color: "#fff",
            border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Upload size={16} />
          영수증 업로드
        </button>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, marginBottom: 20, color: "#991b1b", fontSize: 14 }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: T.textMuted, fontSize: 14 }}>불러오는 중...</div>
      ) : receipts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>
          <FileText size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 15 }}>제출한 영수증이 없습니다.</p>
          <p style={{ fontSize: 13 }}>위 버튼을 눌러 영수증을 업로드해주세요.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {receipts.map((r) => (
            <ReceiptCard key={r.id} receipt={r} onDelete={() => handleDelete(r.id)} />
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={(newReceipt) => {
            setReceipts((prev) => [newReceipt, ...prev]);
            setShowUpload(false);
          }}
        />
      )}
    </div>
  );
}

function ReceiptCard({ receipt, onDelete }) {
  const statusColor = receipt.ocr_status === "done" ? "#16a34a" : receipt.ocr_status === "failed" ? "#dc2626" : T.textMuted;
  const paidAt = receipt.paid_at ? new Date(receipt.paid_at).toLocaleDateString("ko-KR") : null;

  return (
    <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ background: T.accentDim, borderRadius: 10, padding: 10, flexShrink: 0, display: "flex", alignItems: "center" }}>
        <FileText size={22} color={T.accent} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
            {receipt.vendor || "판매처 미입력"}
          </span>
          {receipt.amount != null && (
            <span style={{ fontSize: 13, color: T.accent, fontWeight: 700 }}>
              {Number(receipt.amount).toLocaleString("ko-KR")}원
            </span>
          )}
          <span style={{ fontSize: 11, color: statusColor, background: `${statusColor}18`, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
            {OCR_STATUS_LABEL[receipt.ocr_status] || receipt.ocr_status}
          </span>
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {receipt.file_name && <span>{receipt.file_name}</span>}
          {paidAt && <span>결제일: {paidAt}</span>}
          {receipt.notes && <span>{receipt.notes}</span>}
          <span>제출일: {new Date(receipt.created_at).toLocaleDateString("ko-KR")}</span>
        </div>
      </div>
      <button
        onClick={onDelete}
        title="삭제"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: "#dc2626", opacity: 0.7, flexShrink: 0 }}
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

function UploadModal({ onClose, onSuccess }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) { setError("파일을 선택해주세요."); return; }
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (vendor) fd.append("vendor", vendor);
      if (amount) fd.append("amount", amount);
      if (paidAt) fd.append("paid_at", paidAt);
      if (notes) fd.append("notes", notes);
      const res = await portalApi.upload("/receipts", fd);
      setSuccess(true);
      setTimeout(() => onSuccess(res.data), 900);
    } catch (e) {
      setError(e.message || "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>영수증 업로드</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}>
            <X size={22} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <CheckCircle size={48} color="#16a34a" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 15, color: "#16a34a", fontWeight: 600 }}>업로드 완료!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={labelStyle}>영수증 파일 *</label>
              <div
                style={{ border: `2px dashed ${file ? T.accent : T.border}`, borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: "pointer", background: file ? T.accentDim : "#f8fafc" }}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  style={{ display: "none" }}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <span style={{ fontSize: 13, color: T.accent, fontWeight: 600 }}>{file.name}</span>
                ) : (
                  <>
                    <Upload size={24} color={T.textMuted} style={{ marginBottom: 8 }} />
                    <p style={{ margin: 0, fontSize: 13, color: T.textMuted }}>클릭하여 파일 선택</p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: T.textMuted }}>JPG, PNG, WebP, PDF (최대 10MB)</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <label style={labelStyle}>판매처 / 상호명</label>
              <input style={fieldStyle} value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="예: 스타벅스, 마트 등" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>결제 금액 (원)</label>
                <input style={fieldStyle} type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label style={labelStyle}>결제일</label>
                <input style={fieldStyle} type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>메모</label>
              <textarea
                style={{ ...fieldStyle, resize: "vertical", minHeight: 72 }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="사용 용도, 참석자 등 메모 (선택)"
              />
            </div>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#dc2626", fontSize: 13, background: "#fef2f2", padding: "10px 14px", borderRadius: 8 }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 4 }}>
              <button type="button" onClick={onClose} style={{ padding: "10px 20px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", color: T.textSec }}>
                취소
              </button>
              <button
                type="submit"
                disabled={uploading}
                style={{ padding: "10px 24px", background: T.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}
              >
                {uploading ? "업로드 중..." : "제출하기"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
