/**
 * 필드 노드 확장 모듈
 * PageNumberField, DateField 등
 * 문서 내 동적 값을 표시하는 인라인 필드 노드를 정의한다.
 */
import { Node } from "@tiptap/core";

/**
 * 페이지 번호 필드 노드
 * 문서 내에 동적 페이지 번호를 표시하는 인라인 노드이다.
 * Word의 {PAGE}, {NUMPAGES} 필드 코드에 해당한다.
 */
export const PageNumberField = Node.create({
  name: "pageNumberField",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      fieldType: {
        default: "page",
        parseHTML: (el) => el.getAttribute("data-field-type") || "page",
        renderHTML: (attrs) => ({ "data-field-type": attrs.fieldType }),
      },
      format: {
        default: "decimal",
        parseHTML: (el) => el.getAttribute("data-format") || "decimal",
        renderHTML: (attrs) => ({ "data-format": attrs.format }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span.page-number-field" }];
  },

  renderHTML({ HTMLAttributes }) {
    const fieldType = HTMLAttributes["data-field-type"] || "page";
    const displayText = fieldType === "page" ? "#" : "##";
    return ["span", {
      ...HTMLAttributes,
      class: "page-number-field",
      contenteditable: "false",
      style: "background:#e8f0fe;padding:1px 4px;border-radius:2px;font-size:inherit;color:#444;cursor:default;",
    }, displayText];
  },

  addCommands() {
    return {
      /** 현재 페이지 번호 필드를 삽입한다 */
      insertPageNumber:
        (format = "decimal") =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { fieldType: "page", format },
          }),

      /** 전체 페이지 수 필드를 삽입한다 */
      insertTotalPages:
        (format = "decimal") =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { fieldType: "totalPages", format },
          }),
    };
  },
});

/**
 * 날짜/시간 필드 노드
 * 현재 날짜를 자동으로 삽입하는 인라인 노드이다.
 */
export const DateField = Node.create({
  name: "dateField",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      format: {
        default: "korean",
        parseHTML: (el) => el.getAttribute("data-date-format") || "korean",
        renderHTML: (attrs) => ({ "data-date-format": attrs.format }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span.date-field" }];
  },

  renderHTML({ HTMLAttributes }) {
    const now = new Date();
    const format = HTMLAttributes["data-date-format"] || "korean";
    let display;
    switch (format) {
      case "iso": display = now.toISOString().split("T")[0]; break;
      case "us": display = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`; break;
      default: display = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
    }
    return ["span", {
      ...HTMLAttributes,
      class: "date-field",
      contenteditable: "false",
      style: "background:#e8f0fe;padding:1px 4px;border-radius:2px;font-size:inherit;color:#444;cursor:default;",
    }, display];
  },

  addCommands() {
    return {
      insertDateField:
        (format = "korean") =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { format },
          }),
    };
  },
});
