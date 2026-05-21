/**
 * Markdown Auto-Analyzer
 *
 * Analyzes markdown content to extract metadata:
 * - YAML frontmatter
 * - Title, subtitle, author, date
 * - Keywords / tags
 * - Document type classification
 * - Summary generation
 * - Structure analysis (headings, word count)
 */

/**
 * Parse YAML-like frontmatter from markdown
 * Supports --- delimited frontmatter
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);
  if (!match) return { frontmatter: {}, body: content };

  const raw = match[1];
  const frontmatter = {};
  const lines = raw.split("\n");

  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.substring(0, colonIdx).trim().toLowerCase();
    let value = line.substring(colonIdx + 1).trim();

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Handle arrays [a, b, c]
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map(s => s.trim().replace(/^["']|["']$/g, ""));
    }

    if (key && value) frontmatter[key] = value;
  }

  const body = content.substring(match[0].length);
  return { frontmatter, body };
}

/**
 * Extract title from markdown (first H1 heading)
 */
function extractTitle(body) {
  // Check for # Title
  const h1Match = body.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();

  // Check for first non-empty line as title
  const lines = body.split("\n").filter(l => l.trim());
  if (lines.length > 0) {
    const first = lines[0].trim();
    if (first.length > 0 && first.length < 200) return first;
  }
  return null;
}

/**
 * Extract all headings for structure analysis
 */
function extractHeadings(body) {
  const headings = [];
  const regex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(body)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].trim(),
    });
  }
  return headings;
}

/**
 * Extract date from various formats
 */
function extractDate(text) {
  // Try common date patterns
  const patterns = [
    /(\d{4})[-./](\d{1,2})[-./](\d{1,2})/,  // 2024-03-17
    /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/,     // 2024년 3월 17일
    /(\d{1,2})[-./](\d{1,2})[-./](\d{4})/,    // 17/03/2024
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Determine order
      if (pattern === patterns[0]) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
      if (pattern === patterns[1]) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
      if (pattern === patterns[2]) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    }
  }
  return null;
}

/**
 * Classify document type based on content analysis
 */
function classifyDocumentType(content, frontmatter) {
  const lower = content.toLowerCase();
  const fm = frontmatter || {};

  // Check frontmatter hints
  if (fm.type) {
    const typeMap = {
      "법률": "statute", "법령": "statute", "법": "statute", "statute": "statute", "law": "statute",
      "판례": "case_law", "판결": "case_law", "case": "case_law", "case_law": "case_law",
      "교과서": "textbook", "textbook": "textbook",
      "서적": "book", "책": "book", "book": "book",
      "논문": "paper", "paper": "paper", "article": "paper", "학술": "paper",
      "뉴스": "news", "news": "news", "기사": "news",
      "노트": "note", "note": "note", "메모": "note", "memo": "note",
    };
    const mapped = typeMap[fm.type.toLowerCase()];
    if (mapped) return mapped;
  }

  // Content-based classification
  const scores = {
    statute: 0, case_law: 0, textbook: 0, book: 0, paper: 0, news: 0, note: 0,
  };

  // Statute indicators
  if (/제\d+조/.test(content)) scores.statute += 3;
  if (/법률|법령|시행령|시행규칙|조례/.test(content)) scores.statute += 2;
  if (/항|호|목/.test(content) && /제\d+/.test(content)) scores.statute += 2;

  // Case law indicators
  if (/판결|판시|원고|피고|대법원|고등법원|지방법원/.test(content)) scores.case_law += 3;
  if (/\d{4}(다|나|가|마|카|타)\d+/.test(content)) scores.case_law += 4; // Case numbers
  if (/판례|선고|주문|이유/.test(content)) scores.case_law += 2;

  // Paper indicators
  if (/abstract|초록|참고문헌|references|bibliography/i.test(content)) scores.paper += 3;
  if (/연구|분석|고찰|서론|결론|방법론/i.test(content)) scores.paper += 2;
  if (/[A-Za-z]+,\s*[A-Z]\.\s*\(\d{4}\)/.test(content)) scores.paper += 2; // APA citation

  // News indicators
  if (/기자|취재|보도|속보|연합뉴스|한겨레|조선일보|동아일보|중앙일보/.test(content)) scores.news += 3;
  if (/\[.*기자\]/.test(content)) scores.news += 3;

  // Textbook indicators
  if (/학습목표|연습문제|예제|풀이|chapter|장/.test(lower)) scores.textbook += 2;

  // Book indicators
  if (/isbn|출판|발행|저자|역자/.test(lower)) scores.book += 2;

  // Note indicators (short content)
  if (content.length < 2000) scores.note += 2;
  if (/TODO|메모|기억|정리|요약/.test(content)) scores.note += 1;

  // Find highest score
  let maxType = "note";
  let maxScore = 0;
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxType = type;
    }
  }

  return maxType;
}

/**
 * Extract keywords from content
 */
function extractKeywords(content, maxKeywords = 10) {
  // Remove markdown syntax
  const plain = content
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\(.*?\)/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/[#*_~`>\-[\]()!|]/g, " ");

  // Korean keyword extraction — find nouns-like patterns
  const koreanWords = plain.match(/[가-힣]{2,}/g) || [];

  // Common stopwords
  const stopwords = new Set([
    "그리고", "하지만", "그러나", "또한", "따라서", "그래서", "때문에", "위해서",
    "대한", "통해", "있는", "없는", "되는", "하는", "것이", "것은", "것을",
    "수가", "수는", "수를", "이를", "에서", "으로", "에게", "부터", "까지",
    "있다", "없다", "이다", "한다", "된다", "되었", "하였", "있었", "에서는",
    "않는", "되며", "하며", "에는", "로서", "로써", "이며", "라고", "으며",
  ]);

  const freq = {};
  for (const word of koreanWords) {
    if (word.length < 2 || stopwords.has(word)) continue;
    freq[word] = (freq[word] || 0) + 1;
  }

  // Also extract English terms
  const engWords = plain.match(/[a-zA-Z]{3,}/g) || [];
  const engStopwords = new Set(["the", "and", "for", "are", "but", "not", "you", "all", "any", "can", "had",
    "her", "was", "one", "our", "out", "has", "his", "how", "its", "may", "new", "now", "old", "see",
    "way", "who", "did", "get", "let", "say", "she", "too", "use", "with", "this", "that", "from",
    "they", "been", "have", "many", "some", "them", "than", "each", "make", "like", "long", "look",
    "come", "could", "into", "over", "such", "take", "other", "which", "their", "will", "would",
    "about", "after", "could", "these", "those", "being", "between", "through", "before"]);

  for (const word of engWords) {
    const lower = word.toLowerCase();
    if (engStopwords.has(lower)) continue;
    freq[lower] = (freq[lower] || 0) + 1;
  }

  // Sort by frequency and return top keywords
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Extract author information
 */
function extractAuthor(content, frontmatter) {
  if (frontmatter.author) return typeof frontmatter.author === "string" ? frontmatter.author : JSON.stringify(frontmatter.author);
  if (frontmatter.authors) return typeof frontmatter.authors === "string" ? frontmatter.authors : JSON.stringify(frontmatter.authors);
  if (frontmatter["저자"]) return frontmatter["저자"];
  if (frontmatter["작성자"]) return frontmatter["작성자"];

  // Try to find author patterns in content
  const patterns = [
    /저자[:\s]+([^\n,]+)/,
    /작성자[:\s]+([^\n,]+)/,
    /Author[:\s]+([^\n,]+)/i,
    /Written by[:\s]+([^\n,]+)/i,
    /([가-힣]{2,4})\s+(교수|박사|연구원|변호사|판사|기자)/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) return match[1].trim();
  }

  return null;
}

/**
 * Generate auto-summary from content
 */
function generateSummary(body, maxLength = 300) {
  const plain = body
    .replace(/^---[\s\S]*?---\n/, "")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\(.*?\)/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/[>\-*_~|]/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();

  // Get first meaningful paragraph(s)
  const paragraphs = plain.split("\n").filter(p => p.trim().length > 20);
  let summary = "";
  for (const p of paragraphs) {
    if (summary.length + p.length > maxLength) break;
    summary += (summary ? " " : "") + p.trim();
  }

  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength - 3) + "...";
  }

  return summary || null;
}

/**
 * Extract source/URL information
 */
function extractSource(content, frontmatter) {
  if (frontmatter.source) return frontmatter.source;
  if (frontmatter.url) return frontmatter.url;
  if (frontmatter["출처"]) return frontmatter["출처"];

  // Find URL in content
  const urlMatch = content.match(/https?:\/\/[^\s)>\]]+/);
  if (urlMatch) return urlMatch[0];

  return null;
}

/**
 * Main analysis function
 */
function analyzeMarkdown(rawContent, filename = "") {
  const { frontmatter, body } = parseFrontmatter(rawContent);
  const headings = extractHeadings(body);

  // Title extraction priority: frontmatter > first H1 > filename
  const title = frontmatter.title || frontmatter["제목"] || extractTitle(body) ||
    (filename ? filename.replace(/\.(md|markdown)$/i, "").replace(/[-_]/g, " ") : "제목 없음");

  const subtitle = frontmatter.subtitle || frontmatter["부제"] || null;
  const author = extractAuthor(rawContent, frontmatter);
  const publishedDate = frontmatter.date || frontmatter["날짜"] || frontmatter.published || extractDate(rawContent);
  const documentType = classifyDocumentType(rawContent, frontmatter);
  const keywords = extractKeywords(body);
  const summary = frontmatter.summary || frontmatter["요약"] || frontmatter.description || generateSummary(body);
  const source = extractSource(rawContent, frontmatter);

  // Word count
  const plainText = body.replace(/[#*_~`>\-[\]()!|]/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const charCount = plainText.length;

  // Structure analysis
  const structure = {
    headingCount: headings.length,
    headings: headings.slice(0, 20), // First 20 headings
    wordCount,
    charCount,
    estimatedPages: Math.max(1, Math.ceil(charCount / 1800)),
    hasCodeBlocks: /```/.test(rawContent),
    hasImages: /!\[/.test(rawContent),
    hasTables: /\|.*\|.*\|/.test(rawContent),
    hasLinks: /\[.*\]\(.*\)/.test(rawContent),
    hasFrontmatter: Object.keys(frontmatter).length > 0,
  };

  // Merge frontmatter extras into metadata
  const extraMetadata = {};
  const knownKeys = new Set(["title", "subtitle", "author", "authors", "date", "published", "type",
    "summary", "description", "source", "url", "tags", "categories", "제목", "부제", "저자", "작성자",
    "날짜", "요약", "출처"]);

  for (const [key, value] of Object.entries(frontmatter)) {
    if (!knownKeys.has(key.toLowerCase())) {
      extraMetadata[key] = value;
    }
  }

  // Extract categories from frontmatter
  let suggestedCategories = [];
  if (frontmatter.categories) {
    suggestedCategories = Array.isArray(frontmatter.categories) ? frontmatter.categories : [frontmatter.categories];
  } else if (frontmatter.category) {
    suggestedCategories = [frontmatter.category];
  } else if (frontmatter["카테고리"]) {
    suggestedCategories = Array.isArray(frontmatter["카테고리"]) ? frontmatter["카테고리"] : [frontmatter["카테고리"]];
  }

  // Importance estimation
  let importance = frontmatter.importance ? parseInt(frontmatter.importance) : 3;
  if (frontmatter["중요도"]) importance = parseInt(frontmatter["중요도"]);
  if (isNaN(importance) || importance < 1 || importance > 5) importance = 3;

  return {
    title,
    subtitle,
    author,
    publishedDate,
    documentType,
    summary,
    source,
    importance,
    contentMarkdown: rawContent,
    contentPlain: plainText,
    keywords,
    suggestedCategories,
    structure,
    extraMetadata,
    frontmatter,
  };
}

module.exports = { analyzeMarkdown, parseFrontmatter, extractKeywords, classifyDocumentType };
