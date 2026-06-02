/**
 * TipTap 서명 필드(Node) 확장
 * - 관리자가 계약서 본문에 삽입하는 "서명 위치" 마커
 * - 에디터 모드: 점선 박스 + 라벨 표시 (편집 가능)
 * - 읽기전용 모드(서명 페이지): 클릭 가능한 "여기에 서명" 버튼으로 변환
 *
 * 속성:
 *   fieldKey: 고유 식별자 (자동 생성 가능)
 *   role: 'our_client' | 'lawyer' | 'counterparty' | 'counterparty_rep' | 'witness'
 *   label: 표시명 ("의뢰인 서명")
 *   required: 필수 여부 (1/0)
 *   signedImageUrl: 서명 완료 시 표시할 이미지 URL
 */
import { Node, mergeAttributes } from "@tiptap/core";

const ROLE_DEFAULT_LABELS = {
  our_client: "의뢰인 서명",
  lawyer: "변호사 서명",
  counterparty: "상대방 서명",
  counterparty_rep: "상대방 대리인 서명",
  witness: "증인 서명",
};

export const SignatureField = Node.create({
  name: "signatureField",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      fieldKey: { default: null },
      role: { default: "our_client" },
      label: { default: "" },
      required: { default: true },
      signedImageUrl: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "signature-field" }];
  },

  renderHTML({ HTMLAttributes }) {
    const role = HTMLAttributes.role || "our_client";
    const label = HTMLAttributes.label || ROLE_DEFAULT_LABELS[role] || "서명";
    return ["signature-field", mergeAttributes(HTMLAttributes, {
      "data-role": role,
      "data-label": label,
      "data-required": HTMLAttributes.required ? "1" : "0",
      "data-field-key": HTMLAttributes.fieldKey || "",
      "data-signed-image-url": HTMLAttributes.signedImageUrl || "",
      class: "yj-signature-field",
    }), label];
  },

  addCommands() {
    return {
      insertSignatureField:
        (attrs = {}) =>
        ({ chain }) => {
          const fieldKey = attrs.fieldKey || `sig-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          return chain().focus().insertContent({
            type: this.name,
            attrs: { ...attrs, fieldKey },
          }).run();
        },
    };
  },
});

export default SignatureField;
