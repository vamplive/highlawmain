/**
 * SignatureDisplay — 저장된 서명 이미지를 표시하는 뷰어
 * - base64 data URI 또는 서버에 저장된 url 모두 지원
 * - 관리자/의뢰인이 완료된 계약서에서 서명을 볼 때 사용
 */
export default function SignatureDisplay({ imageData, imageUrl, width = 240, height = 80, label, meta }) {
  const src = imageUrl || imageData;
  if (!src) {
    return (
      <div
        className="flex items-center justify-center rounded border border-dashed border-gray-300 text-xs text-gray-400"
        style={{ width, height }}
      >
        (미서명)
      </div>
    );
  }
  return (
    <div className="inline-flex flex-col items-start">
      <div
        className="rounded border border-gray-200 bg-white p-1"
        style={{ width, height }}
      >
        <img
          src={src}
          alt={label || "전자서명"}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          draggable={false}
        />
      </div>
      {label && <span className="mt-1 text-[11px] font-medium text-gray-700">{label}</span>}
      {meta && <span className="text-[10px] text-gray-500">{meta}</span>}
    </div>
  );
}
