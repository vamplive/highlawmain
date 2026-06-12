/**
 * 문서 로드/저장/생성 훅
 * — EditorPage에서 분리된 문서 CRUD 로직
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { marked } from "marked";
import { api } from "../../../utils/api";
import { EMPTY_DOC } from "../modules/constants";
import { isMarkdown, htmlToMarkdown, autoSaveToLocal, clearAutoSave } from "../modules/fileUtils";
import {
  buildEditorMetadata,
  extractBlogFootnotes,
  extractFootnoteStateFromMetadata,
  normalizeFootnotes,
  stripBlogFootnotes,
  withBlogFootnotes,
} from "../modules/footnote-utils";
import { AUTOSAVE_SERVER_DELAY_MS } from "../../../utils/timing";
import { tagsToInputValue } from "../../blog/blogContent";
import { showEditorAlert } from "../modules/editorToast";

function htmlToPlainText(html) {
  if (!html) return "";
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = html;
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }
  return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * 본문에서 미리보기용 excerpt 를 만든다.
 *  — 절대 단어/문장 중간에서 자르지 않는다.
 *  — 종결부호(. ? !) 단위로 누적하여 maxLen 직전까지의 완전한 문장을 반환.
 *  — 첫 문장이 maxLen 보다 길면 그 문장 전체를 그대로 반환(잘림 방지).
 */
function buildExcerpt(plainText, maxLen = 240) {
  const text = String(plainText || "").trim();
  if (!text) return null;
  if (text.length <= maxLen) return text;

  const parts = text.split(/(?<=[.?!])\s+/);
  let out = "";
  for (const part of parts) {
    const candidate = out ? `${out} ${part}` : part;
    if (candidate.length > maxLen && out.length > 0) break;
    out = candidate;
    if (out.length >= maxLen) break;
  }
  return (out || text).trim();
}

function getSaveErrorMessage(error, fallback = "저장 중 오류가 발생했습니다") {
  if (!error) return fallback;
  if (error.status === 401) return "관리자 로그인이 만료되었습니다";
  if (error.status === 403) return "저장 권한이 없습니다";
  return error.message || fallback;
}

function isEmptyEditorHtml(html) {
  return !html || html === "<p></p>" || htmlToPlainText(html).length === 0;
}

function isFutureSchedule(value) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

function toDatetimeLocal(value) {
  if (!value) return "";
  const normalized = String(value).replace(" ", "T");
  return normalized.slice(0, 16);
}

function blogStatusFromPost(post) {
  if (post.isPublished) return "published";
  if (isFutureSchedule(post.scheduledPublishAt)) return "scheduled";
  return "draft";
}

/**
 * 문서 CRUD 상태 관리 훅 — 목록 조회, 로드, 저장, 생성, 자동저장을 처리한다.
 * @param {import("@tiptap/react").Editor|null} editor - TipTap 에디터 인스턴스
 * @returns {{ doc: object, setDoc: Function, docId: string|null, setDocId: Function, documents: Array, loading: boolean, saveStatus: string, loadDocument: Function, handleSave: Function, handleNew: Function, refreshList: Function, scheduleAutoSave: Function }}
 */
export default function useDocumentManager(editor, footnoteState = {}) {
  const [doc, setDoc] = useState({ ...EMPTY_DOC });
  const [docId, setDocId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const autoSaveTimer = useRef(null);
  const serverAutoSaveTimer = useRef(null);
  const publishingRef = useRef(false);
  const docRef = useRef(doc);
  const docIdRef = useRef(docId);
  useEffect(() => { docRef.current = doc; }, [doc]);
  useEffect(() => { docIdRef.current = docId; }, [docId]);
  const footnoteStateRef = useRef(footnoteState);
  useEffect(() => { footnoteStateRef.current = footnoteState; }, [footnoteState]);

  const cancelPendingAutoSave = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    if (serverAutoSaveTimer.current) {
      clearTimeout(serverAutoSaveTimer.current);
      serverAutoSaveTimer.current = null;
    }
  }, []);

  useEffect(() => cancelPendingAutoSave, [cancelPendingAutoSave]);

  /**
   * 블로그 게시글을 사이드바 트리에 표시할 가상 문서 레코드로 변환한다.
   * - 합성 id `blog:<uuid>` 로 일반 문서와 분리
   * - documentType "blog"로 표시되며 _source 플래그로 저장 시 라우팅 결정
   */
  const blogToVirtualDoc = (b) => ({
    id: `blog:${b.id}`,
    title: b.title || "",
    documentType: "blog",
    blogCategory: b.category || "construction_realestate",
    practiceArea: b.practiceArea || null,
    status: blogStatusFromPost(b),
    _source: "blog",
    _blogId: b.id,
    _blogSlug: b.slug,
    _blogCategory: b.category,
    _blogPracticeArea: b.practiceArea,
    _blogContent: b.content,
    _blogExcerpt: b.excerpt,
    _blogAuthor: b.author,
    _blogThumbnailUrl: b.thumbnailUrl,
    _blogSeoTitle: b.seoTitle,
    _blogSeoDescription: b.seoDescription,
    _blogCanonicalUrl: b.canonicalUrl,
    _blogOgImageUrl: b.ogImageUrl,
    _blogGeoSummary: b.geoSummary,
    _blogGeoFaq: b.geoFaq,
    _blogGeoKeywords: b.geoKeywords,
    _blogFootnotes: b.footnotes,
    _blogIsPublished: b.isPublished,
    _blogPublishedAt: b.publishedAt,
    _blogScheduledPublishAt: b.scheduledPublishAt,
    _blogTags: b.tags,
  });

  const fetchAllBlogDocs = async () => {
    const first = await api.get("/blog?all=true&limit=200&page=1").catch(() => ({ data: [], meta: null }));
    const items = [...(first.data || [])];
    const totalPages = first.meta?.totalPages || 1;
    for (let page = 2; page <= totalPages; page += 1) {
      const res = await api.get(`/blog?all=true&limit=200&page=${page}`).catch(() => ({ data: [] }));
      items.push(...(res.data || []));
    }
    return items;
  };

  /** 문서 목록 새로고침 — 일반 문서 + 블로그 게시글 병합 */
  const refreshList = useCallback(async () => {
    try {
      const [docsRes, blogRes] = await Promise.all([
        api.get("/documents?limit=200").catch(() => ({ data: [] })),
        fetchAllBlogDocs(),
      ]);
      const docs = docsRes.data || [];
      const blogs = (blogRes || []).map(blogToVirtualDoc);
      setDocuments([...blogs, ...docs]);
    } catch (e) {
      setSaveStatus(`오류: ${getSaveErrorMessage(e, "문서 목록을 불러오지 못했습니다")}`);
      setDocuments([]);
    }
  }, []);

  /** 문서 로드 — id가 `blog:` 접두사면 블로그 API로 분기 */
  const loadDocument = useCallback(async (id) => {
    try {
      cancelPendingAutoSave();
      setLoading(true);

      if (typeof id === "string" && id.startsWith("blog:")) {
        const realId = id.slice(5);
        // 목록 응답에 이미 content가 포함되므로 캐시에서 찾고, 없으면 fallback 으로 slug 조회
        let b = documents.find((d) => d.id === id);
        if (b) {
          b = {
            id: b._blogId, slug: b._blogSlug, title: b.title,
            category: b._blogCategory, content: b._blogContent, excerpt: b._blogExcerpt,
            author: b._blogAuthor, isPublished: b._blogIsPublished,
            thumbnailUrl: b._blogThumbnailUrl, seoTitle: b._blogSeoTitle,
            seoDescription: b._blogSeoDescription, canonicalUrl: b._blogCanonicalUrl,
            ogImageUrl: b._blogOgImageUrl,
            geoSummary: b._blogGeoSummary,
            geoFaq: b._blogGeoFaq,
            geoKeywords: b._blogGeoKeywords,
            footnotes: b._blogFootnotes,
            publishedAt: b._blogPublishedAt,
            scheduledPublishAt: b._blogScheduledPublishAt,
            tags: b._blogTags,
          };
        } else {
          // 캐시 미스: slug 검색을 위해 목록을 다시 받아 매칭
          const list = await fetchAllBlogDocs();
          b = list.find((x) => x.id === realId);
          if (!b) throw new Error("블로그 게시글을 찾을 수 없습니다");
        }
        setDocId(id);
        setDoc({
          title: b.title || "",
          documentType: "blog",
          blogCategory: b.category || "construction_realestate",
          subtitle: "",
          author: b.author || "",
          source: "",
          publishedDate: b.publishedAt ? String(b.publishedAt).slice(0, 10) : "",
          contentMarkdown: "",
          summary: b.excerpt || "",
          tags: tagsToInputValue(b.tags),
          slug: b.slug || "",
          thumbnailUrl: b.thumbnailUrl || "",
          seoTitle: b.seoTitle || "",
          seoDescription: b.seoDescription || "",
          canonicalUrl: b.canonicalUrl || "",
          ogImageUrl: b.ogImageUrl || "",
          geoSummary: b.geoSummary || "",
          geoFaq: b.geoFaq || "",
          geoKeywords: tagsToInputValue(b.geoKeywords),
          status: blogStatusFromPost(b),
          scheduledPublishAt: toDatetimeLocal(b.scheduledPublishAt),
          importance: 3,
          _source: "blog",
          _blogId: b.id,
          _blogSlug: b.slug,
        });
        const blogFootnotes = normalizeFootnotes(b.footnotes);
        const legacyBlogFootnotes = blogFootnotes.length ? blogFootnotes : extractBlogFootnotes(b.content || "");
        footnoteStateRef.current.hydrateFootnotes?.({
          footnotes: legacyBlogFootnotes,
          endnotes: [],
          footnoteNumberFormat: "decimal",
        });
        footnoteStateRef.current.hydrateDrawings?.([]);
        footnoteStateRef.current.hydrateHeaderFooter?.({});
        if (editor) editor.commands.setContent(stripBlogFootnotes(b.content || ""));
        setSaveStatus("저장됨");
        return;
      }

      const j = await api.get("/documents/" + id);
      const d = j.data;
      setDocId(id);
      setDoc({
        title: d.title || "",
        documentType: d.documentType || "article",
        subtitle: d.subtitle || "",
        author: d.author || "",
        source: d.source || "",
        publishedDate: d.publishedDate ? d.publishedDate.slice(0, 10) : "",
        contentMarkdown: d.contentMarkdown || "",
        contentHtml: d.contentHtml || "",
        summary: d.summary || "",
        status: d.status || "draft",
        importance: d.importance ?? 3,
        tags: d.tags || "",
        slug: d.slug || "",
        scheduledPublishAt: d.scheduledPublishAt ? toDatetimeLocal(d.scheduledPublishAt) : "",
        metadata: d.metadata || null,
      });
      const editorState = extractFootnoteStateFromMetadata(d.metadata);
      footnoteStateRef.current.hydrateFootnotes?.(editorState);
      footnoteStateRef.current.hydrateDrawings?.(editorState.drawings || []);
      footnoteStateRef.current.hydrateHeaderFooter?.(editorState);
      if (editor) {
        let html = d.contentHtml || "";
        if (!html && d.contentMarkdown) {
          html = isMarkdown(d.contentMarkdown)
            ? marked(d.contentMarkdown)
            : "<p>" + d.contentMarkdown.replace(/\n/g, "</p><p>") + "</p>";
        }
        editor.commands.setContent(html || "");
      }
      setSaveStatus("저장됨");
    } catch (e) {
      setSaveStatus(`오류: ${getSaveErrorMessage(e, "문서를 불러오지 못했습니다")}`);
    } finally {
      setLoading(false);
    }
  }, [editor, documents, cancelPendingAutoSave]);

  /** 문서 저장 — 블로그 소스면 /api/blog/:id, 일반 문서면 /api/documents */
  const handleSave = useCallback(async (_auto = false, snapshot = null) => {
    if (!editor) return;
    if (_auto && publishingRef.current) return;
    setSaveStatus("저장 중...");
    const targetDoc = snapshot?.doc || doc;
    const targetDocId = snapshot?.docId ?? docId;
    const rawHtml = snapshot?.html ?? editor.getHTML();
    const isSnapshot = Boolean(snapshot);
    const isBlogDoc = targetDoc.documentType === "blog" || targetDoc._source === "blog";
    const targetFootnotes = snapshot?.footnotes || footnoteStateRef.current || {};
    const html = isBlogDoc
      ? withBlogFootnotes(rawHtml, targetFootnotes.footnotes || [], targetFootnotes.footnoteNumberFormat || "decimal")
      : rawHtml;
    const hasScheduledPublish = isFutureSchedule(targetDoc.scheduledPublishAt);
    const hasInvalidSchedule = targetDoc.status === "scheduled" && !hasScheduledPublish;
    const blogPayload = {
      title: targetDoc.title || "제목 없음",
      category: targetDoc.blogCategory || "construction_realestate",
      content: html,
      excerpt: targetDoc.summary || buildExcerpt(htmlToPlainText(html)) || null,
      author: targetDoc.author || null,
      thumbnailUrl: targetDoc.thumbnailUrl || null,
      slug: targetDoc.slug || undefined,
      tags: targetDoc.tags || null,
      seoTitle: targetDoc.seoTitle || null,
      seoDescription: targetDoc.seoDescription || null,
      canonicalUrl: targetDoc.canonicalUrl || null,
      ogImageUrl: targetDoc.ogImageUrl || targetDoc.thumbnailUrl || null,
      geoSummary: targetDoc.geoSummary || null,
      geoFaq: targetDoc.geoFaq || null,
      geoKeywords: targetDoc.geoKeywords || null,
      footnotes: JSON.stringify(targetFootnotes.footnotes || []),
      scheduledPublishAt: hasScheduledPublish ? targetDoc.scheduledPublishAt : null,
      isPublished: targetDoc.status === "published" && !hasScheduledPublish,
    };

    try {
      // 블로그 게시글 저장 분기
      if (isBlogDoc) {
        if (isEmptyEditorHtml(blogPayload.content)) {
          if (_auto) {
            setSaveStatus("로컬 저장됨");
            return;
          }
          throw new Error("블로그 본문을 입력해 주세요");
        }
        if (!targetDoc.title?.trim()) {
          if (_auto) {
            setSaveStatus("로컬 저장됨");
            return;
          }
          throw new Error("블로그 제목을 입력해 주세요");
        }
        if (hasInvalidSchedule) {
          if (_auto) {
            setSaveStatus("로컬 저장됨");
            return;
          }
          throw new Error("예약 발행에는 미래 예약 일시가 필요합니다");
        }

        if (!targetDoc._blogId) {
          if (_auto) {
            setSaveStatus("로컬 저장됨");
            return;
          }
          const created = await api.post("/blog", blogPayload);
          const post = created.data;
          if (post?.id) {
            if (!isSnapshot) {
              setDocId(`blog:${post.id}`);
              setDoc((d) => ({
                ...d,
                _source: "blog",
                _blogId: post.id,
                _blogSlug: post.slug,
                _blogCategory: post.category,
                slug: post.slug || d.slug,
                tags: tagsToInputValue(post.tags || d.tags),
                status: blogStatusFromPost(post),
                thumbnailUrl: post.thumbnailUrl || d.thumbnailUrl,
                seoTitle: post.seoTitle || d.seoTitle,
                seoDescription: post.seoDescription || d.seoDescription,
                canonicalUrl: post.canonicalUrl || d.canonicalUrl,
                ogImageUrl: post.ogImageUrl || d.ogImageUrl,
                geoSummary: post.geoSummary || d.geoSummary,
                geoFaq: post.geoFaq || d.geoFaq,
                geoKeywords: tagsToInputValue(post.geoKeywords || d.geoKeywords),
                publishedDate: post.publishedAt ? String(post.publishedAt).slice(0, 10) : d.publishedDate,
                scheduledPublishAt: toDatetimeLocal(post.scheduledPublishAt),
              }));
            }
          }
          await refreshList();
          clearAutoSave();
          setSaveStatus("저장됨");
          return;
        }

        const updatedRes = await api.patch("/blog/" + targetDoc._blogId, blogPayload);
        const updated = updatedRes.data;
        if (updated && !isSnapshot) {
          setDoc((d) => ({
            ...d,
            _blogSlug: updated.slug || d._blogSlug,
            _blogCategory: updated.category || d._blogCategory,
            slug: updated.slug || d.slug,
            tags: tagsToInputValue(updated.tags || d.tags),
            status: blogStatusFromPost(updated),
            thumbnailUrl: updated.thumbnailUrl || "",
            seoTitle: updated.seoTitle || "",
            seoDescription: updated.seoDescription || "",
            canonicalUrl: updated.canonicalUrl || "",
            ogImageUrl: updated.ogImageUrl || "",
            geoSummary: updated.geoSummary || "",
            geoFaq: updated.geoFaq || "",
            geoKeywords: tagsToInputValue(updated.geoKeywords),
            publishedDate: updated.publishedAt ? String(updated.publishedAt).slice(0, 10) : "",
            scheduledPublishAt: toDatetimeLocal(updated.scheduledPublishAt),
          }));
        }
        await refreshList();
        if (!isSnapshot) clearAutoSave();
        setSaveStatus("저장됨");
        return;
      }

      const md = htmlToMarkdown(html);
      const payload = {
        title: targetDoc.title || "제목 없음",
        documentType: targetDoc.documentType,
        subtitle: targetDoc.subtitle,
        author: targetDoc.author,
        source: targetDoc.source,
        publishedDate: targetDoc.publishedDate || null,
        contentHtml: html,
        contentMarkdown: md,
        contentPlain: htmlToPlainText(html),
        summary: targetDoc.summary,
        status: targetDoc.status,
        importance: targetDoc.importance,
        metadata: buildEditorMetadata(targetDoc, targetFootnotes),
      };
      if (targetDocId) {
        await api.patch("/documents/" + targetDocId, payload);
      } else {
        if (_auto) {
          setSaveStatus("로컬 저장됨");
          return;
        }
        const j = await api.post("/documents", payload);
        const newId = j.data?.id;
        if (newId && !isSnapshot) {
          setDocId(newId);
          refreshList();
        }
      }
      if (!isSnapshot) clearAutoSave();
      setSaveStatus("저장됨");
    } catch (e) {
      setSaveStatus(`오류: ${getSaveErrorMessage(e)}`);
    }
  }, [editor, doc, docId, refreshList]);

  /** 현재 에디터 내용을 블로그 게시글로 발행 */
  const handlePublishBlog = useCallback(async () => {
    if (!editor) return;
    if (publishingRef.current) return;
    cancelPendingAutoSave();
    publishingRef.current = true;
    setIsPublishing(true);
    const rawHtml = editor.getHTML();
    const currentFootnotes = footnoteStateRef.current || {};
    const html = withBlogFootnotes(rawHtml, currentFootnotes.footnotes || [], currentFootnotes.footnoteNumberFormat || "decimal");
    const currentDoc = docRef.current;
    const currentDocId = docIdRef.current;

    if (isEmptyEditorHtml(rawHtml)) {
      setSaveStatus("오류: 블로그 본문을 입력해 주세요");
      publishingRef.current = false;
      setIsPublishing(false);
      return;
    }
    if (!currentDoc.title?.trim()) {
      setSaveStatus("오류: 블로그 제목을 입력해 주세요");
      publishingRef.current = false;
      setIsPublishing(false);
      return;
    }

    const hasScheduledPublish = isFutureSchedule(currentDoc.scheduledPublishAt);
    if (currentDoc.status === "scheduled" && !hasScheduledPublish) {
      setSaveStatus("오류: 예약 발행에는 미래 예약 일시가 필요합니다");
      publishingRef.current = false;
      setIsPublishing(false);
      return;
    }
    setSaveStatus(hasScheduledPublish ? "예약 중..." : "발행 중...");
    const payload = {
      title: currentDoc.title.trim(),
      category: currentDoc.blogCategory || "construction_realestate",
      practiceArea: currentDoc.practiceArea || null,
      content: html,
      excerpt: currentDoc.summary || buildExcerpt(htmlToPlainText(html)) || null,
      author: currentDoc.author || null,
      thumbnailUrl: currentDoc.thumbnailUrl || null,
      slug: currentDoc.slug || undefined,
      tags: currentDoc.tags || null,
      seoTitle: currentDoc.seoTitle || null,
      seoDescription: currentDoc.seoDescription || null,
      canonicalUrl: currentDoc.canonicalUrl || null,
      ogImageUrl: currentDoc.ogImageUrl || currentDoc.thumbnailUrl || null,
      geoSummary: currentDoc.geoSummary || null,
      geoFaq: currentDoc.geoFaq || null,
      geoKeywords: currentDoc.geoKeywords || null,
      footnotes: JSON.stringify(currentFootnotes.footnotes || []),
      scheduledPublishAt: hasScheduledPublish ? currentDoc.scheduledPublishAt : null,
      isPublished: !hasScheduledPublish,
    };

    try {
      const existingBlogId = currentDoc._blogId || (typeof currentDocId === "string" && currentDocId.startsWith("blog:") ? currentDocId.slice(5) : null);
      const res = existingBlogId
        ? await api.patch("/blog/" + existingBlogId, payload)
        : await api.post("/blog", payload);
      const post = res.data;
      const wasPublished = Boolean(post?.isPublished) && !post?.scheduledPublishAt;
      const wasScheduled = Boolean(post?.scheduledPublishAt);
      if (post?.id) {
        setDocId(`blog:${post.id}`);
        setDoc((d) => ({
          ...d,
          documentType: "blog",
          blogCategory: post.category || payload.category,
          status: blogStatusFromPost(post),
          summary: post.excerpt || d.summary,
          slug: post.slug || d.slug,
          tags: tagsToInputValue(post.tags || d.tags),
          thumbnailUrl: post.thumbnailUrl || d.thumbnailUrl || "",
          seoTitle: post.seoTitle || d.seoTitle || "",
          seoDescription: post.seoDescription || d.seoDescription || "",
          canonicalUrl: post.canonicalUrl || d.canonicalUrl || "",
          ogImageUrl: post.ogImageUrl || d.ogImageUrl || "",
          geoSummary: post.geoSummary || d.geoSummary || "",
          geoFaq: post.geoFaq || d.geoFaq || "",
          geoKeywords: tagsToInputValue(post.geoKeywords || d.geoKeywords),
          publishedDate: post.publishedAt ? String(post.publishedAt).slice(0, 10) : d.publishedDate,
          scheduledPublishAt: toDatetimeLocal(post.scheduledPublishAt),
          _source: "blog",
          _blogId: post.id,
          _blogSlug: post.slug,
          _blogCategory: post.category,
          _blogPracticeArea: post.practiceArea,
          practiceArea: post.practiceArea || null,
        }));
      }
      clearAutoSave();
      await refreshList();
      setSaveStatus(wasScheduled ? "예약됨" : wasPublished ? "발행됨" : "저장됨");
      if (wasPublished) {
        showEditorAlert("블로그 게시글이 발행되었습니다.");
      } else if (wasScheduled) {
        showEditorAlert("블로그 게시글이 예약되었습니다.");
      }
    } catch (e) {
      setSaveStatus(`오류: ${getSaveErrorMessage(e, "블로그 발행 중 오류가 발생했습니다")}`);
    } finally {
      publishingRef.current = false;
      setIsPublishing(false);
    }
  }, [editor, refreshList, cancelPendingAutoSave]);

  /** 새 문서 */
  const handleNew = useCallback(() => {
    cancelPendingAutoSave();
    setDocId(null);
    setDoc({ ...EMPTY_DOC });
    footnoteStateRef.current.resetFootnotes?.();
    footnoteStateRef.current.resetDrawings?.();
    footnoteStateRef.current.resetHeaderFooter?.();
    if (editor) editor.commands.setContent("");
    setSaveStatus("");
  }, [editor, cancelPendingAutoSave]);

  /** 새 블로그 게시글 */
  const handleNewBlog = useCallback(() => {
    cancelPendingAutoSave();
    setDocId(null);
    setDoc({
      ...EMPTY_DOC,
      documentType: "blog",
      author: "법무법인 하이로",
      status: "draft",
    });
    footnoteStateRef.current.resetFootnotes?.();
    footnoteStateRef.current.resetDrawings?.();
    footnoteStateRef.current.resetHeaderFooter?.();
    if (editor) editor.commands.setContent("");
    setSaveStatus("");
  }, [editor, cancelPendingAutoSave]);

  /** 문서/블로그 삭제 */
  const handleDeleteDocument = useCallback(async (target) => {
    const targetId = typeof target === "string" ? target : target?.id;
    if (!targetId) return;

    try {
      cancelPendingAutoSave();
      setSaveStatus("삭제 중...");
      if (targetId.startsWith("blog:")) {
        await api.delete(`/blog/${targetId.slice(5)}`);
      } else {
        await api.delete(`/documents/${targetId}`);
      }

      if (docIdRef.current === targetId) {
        setDocId(null);
        setDoc({ ...EMPTY_DOC });
        footnoteStateRef.current.resetFootnotes?.();
        footnoteStateRef.current.resetDrawings?.();
        footnoteStateRef.current.resetHeaderFooter?.();
        if (editor) editor.commands.setContent("");
        clearAutoSave();
      }
      await refreshList();
      setSaveStatus("삭제됨");
    } catch (e) {
      setSaveStatus(`오류: ${getSaveErrorMessage(e, "삭제 중 오류가 발생했습니다")}`);
    }
  }, [editor, refreshList, cancelPendingAutoSave]);

  /** 에디터 업데이트 시 자동저장 스케줄링 (docRef로 최신 doc 참조) */
  const scheduleAutoSave = useCallback(() => {
    if (publishingRef.current) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (serverAutoSaveTimer.current) clearTimeout(serverAutoSaveTimer.current);
    setSaveStatus("수정됨");
    autoSaveTimer.current = setTimeout(() => {
      if (editor && !editor.isDestroyed) {
        const html = editor.getHTML();
        const snapshot = {
          html,
          doc: { ...docRef.current },
          docId: docIdRef.current,
          footnotes: { ...footnoteStateRef.current },
        };
        autoSaveToLocal(html, snapshot.doc, { footnotes: snapshot.footnotes });
        setSaveStatus("로컬 저장됨");
        serverAutoSaveTimer.current = setTimeout(() => handleSave(true, snapshot), AUTOSAVE_SERVER_DELAY_MS);
      }
    }, 1000);
  }, [editor, handleSave]);

  return {
    doc, setDoc, docId, setDocId,
    documents, setDocuments,
    loading, saveStatus, setSaveStatus,
    isPublishing,
    loadDocument, handleSave, handleNew, handleNewBlog, handleDeleteDocument, refreshList,
    handlePublishBlog,
    scheduleAutoSave,
  };
}
