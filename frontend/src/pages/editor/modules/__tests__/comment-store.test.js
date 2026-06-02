/**
 * comment-store.js — 댓글 상태 reducer / 셀렉터 / localStorage 영속성 테스트
 * 순수 함수 위주라 외부 의존성 없이 결정적으로 검증한다.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  generateCommentId,
  createAuthor,
  createComment,
  createCommentStore,
  commentReducer,
  getAllThreads,
  getUnresolvedThreads,
  getResolvedThreads,
  getCommentCount,
  saveCommentsToLocal,
  loadCommentsFromLocal,
  clearCommentsFromLocal,
  formatCommentDate,
  loadAuthor,
  saveAuthor,
} from "../comment-store";

describe("generateCommentId", () => {
  it("cmt_ 접두사를 붙이고 각 호출마다 고유하다", () => {
    const a = generateCommentId();
    const b = generateCommentId();
    expect(a).toMatch(/^cmt_[a-z0-9]+_[a-z0-9]+$/);
    expect(a).not.toBe(b);
  });
});

describe("createAuthor", () => {
  it("이름과 이니셜, 색상을 가진 저자 객체를 만든다", () => {
    const author = createAuthor("홍길동", "홍");
    expect(author.name).toBe("홍길동");
    expect(author.initials).toBe("홍");
    expect(author.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(author.id).toMatch(/^author_/);
  });

  it("initials가 생략되면 이름 첫 글자를 쓴다", () => {
    expect(createAuthor("Alice").initials).toBe("A");
  });
});

describe("createComment", () => {
  it("id/타임스탬프/기본 빈 replies와 미해결 상태를 갖는다", () => {
    const author = createAuthor("A");
    const c = createComment(author, "안녕");
    expect(c.id).toMatch(/^cmt_/);
    expect(c.content).toBe("안녕");
    expect(c.replies).toEqual([]);
    expect(c.resolved).toBe(false);
    expect(c.parentId).toBeNull();
    expect(c.createdAt).toBe(c.modifiedAt);
  });
});

describe("commentReducer — ADD/EDIT/DELETE 기본 동작", () => {
  let state, author;
  beforeEach(() => {
    state = createCommentStore();
    author = createAuthor("홍길동");
  });

  it("ADD_COMMENT: comments에 추가되고 active로 설정된다", () => {
    const comment = createComment(author, "첫 댓글");
    const next = commentReducer(state, { type: "ADD_COMMENT", comment });
    expect(next.comments[comment.id]).toBe(comment);
    expect(next.activeCommentId).toBe(comment.id);
    expect(next.showCommentsPanel).toBe(true);
  });

  it("ADD_COMMENT: markupMode가 'none'이면 'all'로 전환한다", () => {
    const s = { ...state, markupMode: "none" };
    const comment = createComment(author, "x");
    expect(commentReducer(s, { type: "ADD_COMMENT", comment }).markupMode).toBe("all");
  });

  it("ADD_COMMENT: markupMode가 'simple'이면 그대로 둔다", () => {
    const s = { ...state, markupMode: "simple" };
    const comment = createComment(author, "x");
    expect(commentReducer(s, { type: "ADD_COMMENT", comment }).markupMode).toBe("simple");
  });

  it("ADD_REPLY: 존재하지 않는 parent는 state를 그대로 둔다", () => {
    const next = commentReducer(state, { type: "ADD_REPLY", parentId: "nope", reply: {} });
    expect(next).toBe(state);
  });

  it("ADD_REPLY: parent의 replies에 추가한다", () => {
    const c = createComment(author, "부모");
    let s = commentReducer(state, { type: "ADD_COMMENT", comment: c });
    const reply = { id: "r1", content: "답" };
    s = commentReducer(s, { type: "ADD_REPLY", parentId: c.id, reply });
    expect(s.comments[c.id].replies).toEqual([reply]);
  });

  it("EDIT_COMMENT: content를 바꾸고 modifiedAt을 갱신한다", () => {
    const c = createComment(author, "원본");
    let s = commentReducer(state, { type: "ADD_COMMENT", comment: c });
    const before = s.comments[c.id].modifiedAt;
    s = commentReducer(s, { type: "EDIT_COMMENT", id: c.id, content: "수정" });
    expect(s.comments[c.id].content).toBe("수정");
    expect(typeof s.comments[c.id].modifiedAt).toBe("string");
    // 시각 문자열이 유효한지만 확인 (같은 틱이면 같을 수 있음)
    expect(Date.parse(s.comments[c.id].modifiedAt)).not.toBeNaN();
    expect(Date.parse(s.comments[c.id].modifiedAt)).toBeGreaterThanOrEqual(Date.parse(before));
  });

  it("EDIT_REPLY: 특정 인덱스의 reply를 갱신한다", () => {
    const c = createComment(author, "p");
    let s = commentReducer(state, { type: "ADD_COMMENT", comment: c });
    s = commentReducer(s, { type: "ADD_REPLY", parentId: c.id, reply: { content: "old" } });
    s = commentReducer(s, { type: "EDIT_REPLY", parentId: c.id, replyIndex: 0, content: "new" });
    expect(s.comments[c.id].replies[0].content).toBe("new");
  });

  it("DELETE_COMMENT: 삭제하고 activeCommentId가 그 ID면 null로 해제한다", () => {
    const c = createComment(author, "x");
    let s = commentReducer(state, { type: "ADD_COMMENT", comment: c });
    s = commentReducer(s, { type: "DELETE_COMMENT", id: c.id });
    expect(s.comments[c.id]).toBeUndefined();
    expect(s.activeCommentId).toBeNull();
  });

  it("DELETE_REPLY: 해당 인덱스 reply만 제거한다", () => {
    const c = createComment(author, "p");
    let s = commentReducer(state, { type: "ADD_COMMENT", comment: c });
    s = commentReducer(s, { type: "ADD_REPLY", parentId: c.id, reply: { content: "a" } });
    s = commentReducer(s, { type: "ADD_REPLY", parentId: c.id, reply: { content: "b" } });
    s = commentReducer(s, { type: "DELETE_REPLY", parentId: c.id, replyIndex: 0 });
    expect(s.comments[c.id].replies).toEqual([{ content: "b" }]);
  });

  it("DELETE_ALL: 전체 초기화 + active 해제", () => {
    const c = createComment(author, "x");
    let s = commentReducer(state, { type: "ADD_COMMENT", comment: c });
    s = commentReducer(s, { type: "DELETE_ALL" });
    expect(s.comments).toEqual({});
    expect(s.activeCommentId).toBeNull();
  });
});

describe("commentReducer — RESOLVE / REOPEN / RESOLVE_ALL", () => {
  it("RESOLVE_COMMENT: resolved=true + resolvedBy 세팅", () => {
    const author = createAuthor("A");
    const c = createComment(author, "x");
    let s = commentReducer(createCommentStore(), { type: "ADD_COMMENT", comment: c });
    s = commentReducer(s, { type: "RESOLVE_COMMENT", id: c.id, author });
    expect(s.comments[c.id].resolved).toBe(true);
    expect(s.comments[c.id].resolvedBy).toBe(author);
  });

  it("REOPEN_COMMENT: resolved=false로 되돌리고 resolvedBy/At 초기화", () => {
    const author = createAuthor("A");
    const c = createComment(author, "x");
    let s = commentReducer(createCommentStore(), { type: "ADD_COMMENT", comment: c });
    s = commentReducer(s, { type: "RESOLVE_COMMENT", id: c.id, author });
    s = commentReducer(s, { type: "REOPEN_COMMENT", id: c.id });
    expect(s.comments[c.id].resolved).toBe(false);
    expect(s.comments[c.id].resolvedBy).toBeNull();
    expect(s.comments[c.id].resolvedAt).toBeNull();
  });

  it("RESOLVE_ALL: 모든 댓글을 해결 처리한다", () => {
    const author = createAuthor("A");
    let s = createCommentStore();
    s = commentReducer(s, { type: "ADD_COMMENT", comment: createComment(author, "1") });
    s = commentReducer(s, { type: "ADD_COMMENT", comment: createComment(author, "2") });
    s = commentReducer(s, { type: "RESOLVE_ALL", author });
    expect(Object.values(s.comments).every((c) => c.resolved)).toBe(true);
  });

  it("RESOLVE/REOPEN: 존재하지 않는 id는 state를 그대로 둔다", () => {
    const s = createCommentStore();
    expect(commentReducer(s, { type: "RESOLVE_COMMENT", id: "no", author: {} })).toBe(s);
    expect(commentReducer(s, { type: "REOPEN_COMMENT", id: "no" })).toBe(s);
  });
});

describe("commentReducer — UI 상태 액션", () => {
  it("SET_ACTIVE / SET_MARKUP_MODE / SET_PANEL_VISIBLE / SET_REVIEWING_PANE", () => {
    let s = createCommentStore();
    s = commentReducer(s, { type: "SET_ACTIVE", id: "abc" });
    expect(s.activeCommentId).toBe("abc");
    s = commentReducer(s, { type: "SET_MARKUP_MODE", mode: "simple" });
    expect(s.markupMode).toBe("simple");
    s = commentReducer(s, { type: "SET_PANEL_VISIBLE", visible: false });
    expect(s.showCommentsPanel).toBe(false);
    s = commentReducer(s, { type: "SET_REVIEWING_PANE", mode: "vertical" });
    expect(s.showReviewingPane).toBe("vertical");
  });

  it("LOAD_COMMENTS: 전체 comments 맵을 교체한다", () => {
    const s = commentReducer(createCommentStore(), {
      type: "LOAD_COMMENTS",
      comments: { x: { id: "x" } },
    });
    expect(s.comments).toEqual({ x: { id: "x" } });
  });

  it("LOAD_COMMENTS: null/undefined면 빈 객체로 복구한다", () => {
    const s = commentReducer(createCommentStore(), { type: "LOAD_COMMENTS", comments: null });
    expect(s.comments).toEqual({});
  });

  it("알 수 없는 액션은 state를 그대로 반환한다", () => {
    const s = createCommentStore();
    expect(commentReducer(s, { type: "NOPE" })).toBe(s);
  });
});

describe("셀렉터 — getAllThreads / getUnresolvedThreads / getResolvedThreads / getCommentCount", () => {
  it("parentId가 없는 것만 스레드로 본다 + 생성일 오름차순", () => {
    const store = {
      comments: {
        a: { id: "a", parentId: null, createdAt: "2025-01-01T00:00:00Z", resolved: false, replies: [] },
        b: { id: "b", parentId: null, createdAt: "2025-01-02T00:00:00Z", resolved: true, replies: [] },
        c: { id: "c", parentId: "a", createdAt: "2025-01-03T00:00:00Z", resolved: false, replies: [] },
      },
    };
    const threads = getAllThreads(store);
    expect(threads.map((t) => t.id)).toEqual(["a", "b"]);
    expect(getUnresolvedThreads(store).map((t) => t.id)).toEqual(["a"]);
    expect(getResolvedThreads(store).map((t) => t.id)).toEqual(["b"]);
    expect(getCommentCount(store)).toBe(3);
  });
});

describe("localStorage 영속성", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saveCommentsToLocal / loadCommentsFromLocal 왕복 (docId별 키 분리)", () => {
    saveCommentsToLocal("doc-1", { x: { id: "x" } });
    expect(loadCommentsFromLocal("doc-1")).toEqual({ x: { id: "x" } });
    expect(loadCommentsFromLocal("doc-2")).toBeNull();
  });

  it("docId 없이도 작동한다", () => {
    saveCommentsToLocal(null, { y: {} });
    expect(loadCommentsFromLocal(null)).toEqual({ y: {} });
  });

  it("clearCommentsFromLocal로 지우면 null이 돌아온다", () => {
    saveCommentsToLocal("doc-1", { x: {} });
    clearCommentsFromLocal("doc-1");
    expect(loadCommentsFromLocal("doc-1")).toBeNull();
  });

  it("loadAuthor는 저장값이 없으면 null을 반환한다", () => {
    expect(loadAuthor()).toBeNull();
    saveAuthor({ name: "A" });
    expect(loadAuthor()).toEqual({ name: "A" });
  });

  it("잘못된 JSON이 들어있으면 null", () => {
    localStorage.setItem("comment_author", "not-json{");
    expect(loadAuthor()).toBeNull();
  });
});

describe("formatCommentDate", () => {
  it("빈 값은 빈 문자열", () => {
    expect(formatCommentDate(null)).toBe("");
    expect(formatCommentDate("")).toBe("");
  });

  it("오늘 날짜면 '오늘 HH:MM' 형식", () => {
    const now = new Date();
    now.setHours(14, 5);
    expect(formatCommentDate(now.toISOString())).toMatch(/^오늘 \d{1,2}:05$/);
  });

  it("다른 날이면 'M월 D일 HH:MM' 형식", () => {
    // 확실히 오늘이 아닌 과거 날짜
    const past = new Date("2020-03-15T10:30:00");
    const out = formatCommentDate(past.toISOString());
    expect(out).toMatch(/^\d+월 \d+일 \d+:\d{2}$/);
  });
});
