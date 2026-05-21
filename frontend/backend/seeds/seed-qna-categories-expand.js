/**
 * Q&A 카테고리 확장 시드 — 기존 건설/부동산 유지 + 새 대분류 추가
 * 기존 카테고리와 질문은 건드리지 않고, 없는 것만 추가한다.
 */
require("dotenv").config();
const { sqlite } = require("../db");
const crypto = require("crypto");

const NEW_CATEGORIES = [
  {
    name: "민사",
    slug: "민사",
    description: "손해배상, 채권추심, 계약분쟁 등 민사 일반",
    children: [
      { name: "손해배상", slug: "손해배상", children: [
        { name: "교통사고", slug: "교통사고" },
        { name: "의료사고", slug: "의료사고" },
        { name: "제조물 책임", slug: "제조물책임" },
        { name: "명예훼손·인격권", slug: "명예훼손-인격권" },
        { name: "기타 손해배상", slug: "기타-손해배상" },
      ]},
      { name: "채권·채무", slug: "채권채무", children: [
        { name: "대여금 반환", slug: "대여금반환" },
        { name: "매매대금", slug: "매매대금" },
        { name: "용역·도급 대금", slug: "용역도급대금" },
        { name: "보증·담보", slug: "보증담보" },
        { name: "채권추심·강제집행", slug: "채권추심-강제집행" },
      ]},
      { name: "계약분쟁", slug: "계약분쟁", children: [
        { name: "계약 해제·해지", slug: "계약해제-해지" },
        { name: "위약금·손해배상 예정", slug: "위약금-손해배상예정" },
        { name: "사기·착오에 의한 계약", slug: "사기-착오-계약" },
        { name: "프랜차이즈 분쟁", slug: "프랜차이즈분쟁" },
        { name: "전자상거래 분쟁", slug: "전자상거래분쟁" },
      ]},
      { name: "소송절차", slug: "소송절차", children: [
        { name: "소장 작성·제출", slug: "소장작성" },
        { name: "가압류·가처분", slug: "가압류-가처분" },
        { name: "조정·화해·중재", slug: "조정-화해-중재" },
        { name: "항소·상고", slug: "항소-상고" },
        { name: "소액사건·독촉절차", slug: "소액사건-독촉" },
      ]},
    ],
  },
  {
    name: "형사",
    slug: "형사",
    description: "고소·고발, 형사변호, 피해자 보호 등",
    children: [
      { name: "재산범죄", slug: "재산범죄", children: [
        { name: "사기·횡령·배임", slug: "사기-횡령-배임" },
        { name: "절도·손괴", slug: "절도-손괴" },
        { name: "문서위조", slug: "문서위조" },
        { name: "컴퓨터 범죄", slug: "컴퓨터범죄" },
      ]},
      { name: "폭력·성범죄", slug: "폭력-성범죄", children: [
        { name: "폭행·상해·협박", slug: "폭행-상해-협박" },
        { name: "성범죄", slug: "성범죄" },
        { name: "스토킹·가정폭력", slug: "스토킹-가정폭력" },
        { name: "디지털 성범죄", slug: "디지털성범죄" },
      ]},
      { name: "형사절차", slug: "형사절차", children: [
        { name: "고소·고발 방법", slug: "고소-고발방법" },
        { name: "수사·기소 절차", slug: "수사-기소절차" },
        { name: "보석·구속적부심", slug: "보석-구속적부심" },
        { name: "합의·형사조정", slug: "합의-형사조정" },
        { name: "전과 기록·사면", slug: "전과기록-사면" },
      ]},
    ],
  },
  {
    name: "가사",
    slug: "가사",
    description: "이혼, 상속, 양육권, 가사소송 등",
    children: [
      { name: "이혼", slug: "이혼", children: [
        { name: "협의이혼", slug: "협의이혼" },
        { name: "재판이혼", slug: "재판이혼" },
        { name: "재산분할", slug: "재산분할" },
        { name: "위자료", slug: "위자료" },
        { name: "양육권·면접교섭", slug: "양육권-면접교섭" },
      ]},
      { name: "상속", slug: "상속", children: [
        { name: "유언·유증", slug: "유언-유증" },
        { name: "상속분쟁·유류분", slug: "상속분쟁-유류분" },
        { name: "상속포기·한정승인", slug: "상속포기-한정승인" },
        { name: "상속세", slug: "상속세" },
      ]},
      { name: "가족관계", slug: "가족관계", children: [
        { name: "친자·인지", slug: "친자-인지" },
        { name: "입양", slug: "입양" },
        { name: "성년후견·한정후견", slug: "성년후견-한정후견" },
        { name: "가족관계등록", slug: "가족관계등록" },
      ]},
    ],
  },
  {
    name: "노동·근로",
    slug: "노동-근로",
    description: "해고, 임금체불, 산재, 직장 내 괴롭힘 등",
    children: [
      { name: "근로계약·임금", slug: "근로계약-임금", children: [
        { name: "임금체불·퇴직금", slug: "임금체불-퇴직금" },
        { name: "근로계약 해석", slug: "근로계약해석" },
        { name: "비정규직·파견", slug: "비정규직-파견" },
        { name: "최저임금·수당", slug: "최저임금-수당" },
      ]},
      { name: "해고·징계", slug: "해고-징계", children: [
        { name: "부당해고", slug: "부당해고" },
        { name: "부당징계", slug: "부당징계" },
        { name: "권고사직·명예퇴직", slug: "권고사직-명예퇴직" },
        { name: "해고예고·수당", slug: "해고예고-수당" },
      ]},
      { name: "직장 내 문제", slug: "직장내문제", children: [
        { name: "직장 내 괴롭힘", slug: "직장내괴롭힘" },
        { name: "직장 내 성희롱", slug: "직장내성희롱" },
        { name: "산업재해", slug: "산업재해" },
        { name: "영업비밀·경업금지", slug: "영업비밀-경업금지" },
      ]},
    ],
  },
  {
    name: "행정",
    slug: "행정",
    description: "인허가, 행정처분, 행정소송 등",
    children: [
      { name: "행정처분·소송", slug: "행정처분-소송", children: [
        { name: "인허가 취소·정지", slug: "인허가-취소-정지" },
        { name: "과징금·과태료", slug: "과징금-과태료" },
        { name: "행정심판", slug: "행정심판" },
        { name: "행정소송", slug: "행정소송" },
        { name: "국가배상", slug: "국가배상" },
      ]},
      { name: "도시계획·토지", slug: "도시계획-토지", children: [
        { name: "토지수용·보상", slug: "토지수용-보상" },
        { name: "개발행위 허가", slug: "개발행위허가" },
        { name: "용도변경·지목변경", slug: "용도변경-지목변경" },
        { name: "도시정비·재개발", slug: "도시정비-재개발" },
      ]},
    ],
  },
  {
    name: "기업·상사",
    slug: "기업-상사",
    description: "회사법, 주주분쟁, 투자, M&A 등",
    children: [
      { name: "회사법", slug: "회사법", children: [
        { name: "법인 설립·등기", slug: "법인설립-등기" },
        { name: "주주총회·이사회", slug: "주주총회-이사회" },
        { name: "주주간 분쟁", slug: "주주간분쟁" },
        { name: "이사 책임·배임", slug: "이사책임-배임" },
      ]},
      { name: "투자·M&A", slug: "투자-MA", children: [
        { name: "투자계약", slug: "투자계약" },
        { name: "합병·분할", slug: "합병-분할" },
        { name: "실사(Due Diligence)", slug: "실사-DD" },
        { name: "공정거래·독점", slug: "공정거래-독점" },
      ]},
    ],
  },
  {
    name: "IT·개인정보",
    slug: "IT-개인정보",
    description: "개인정보 보호, 저작권, 인터넷 분쟁 등",
    children: [
      { name: "개인정보·데이터", slug: "개인정보-데이터", children: [
        { name: "개인정보 유출", slug: "개인정보유출" },
        { name: "정보주체 권리", slug: "정보주체권리" },
        { name: "CCTV·위치정보", slug: "CCTV-위치정보" },
      ]},
      { name: "지식재산권", slug: "지식재산권", children: [
        { name: "저작권 침해", slug: "저작권침해" },
        { name: "상표·특허", slug: "상표-특허" },
        { name: "인터넷 명예훼손", slug: "인터넷명예훼손" },
        { name: "게임·콘텐츠 분쟁", slug: "게임-콘텐츠분쟁" },
      ]},
    ],
  },
  {
    name: "세금·조세",
    slug: "세금-조세",
    description: "양도세, 종합소득세, 세무조사, 조세불복 등",
    children: [
      { name: "부동산 세금", slug: "부동산세금", children: [
        { name: "양도소득세", slug: "양도소득세" },
        { name: "취득세·등록세", slug: "취득세-등록세" },
        { name: "종합부동산세", slug: "종합부동산세" },
        { name: "재산세", slug: "재산세" },
      ]},
      { name: "조세불복·세무", slug: "조세불복-세무", children: [
        { name: "세무조사 대응", slug: "세무조사대응" },
        { name: "조세심판·행정소송", slug: "조세심판-행정소송" },
        { name: "법인세·부가세", slug: "법인세-부가세" },
        { name: "증여세", slug: "증여세" },
      ]},
    ],
  },
];

function insertTree(categories, parentId, depth, sortStart) {
  let sort = sortStart;
  for (const cat of categories) {
    // 이미 존재하면 스킵
    const exists = sqlite.prepare("SELECT id FROM qna_categories WHERE slug = ?").get(cat.slug);
    if (exists) {
      // 자식만 처리
      if (cat.children) {
        insertTree(cat.children, exists.id, depth + 1, 0);
      }
      sort++;
      continue;
    }

    const id = crypto.randomUUID();
    sqlite.prepare(
      "INSERT INTO qna_categories (id, name, slug, parent_id, depth, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)"
    ).run(id, cat.name, cat.slug, parentId, depth, cat.description || null, sort);
    console.log(`  ${"  ".repeat(depth)}[depth=${depth}] ${cat.name}`);

    if (cat.children) {
      insertTree(cat.children, id, depth + 1, 0);
    }
    sort++;
  }
}

console.log("[seed] Q&A 카테고리 확장 시작");
insertTree(NEW_CATEGORIES, null, 0, 10); // sort_order 10부터 (기존 건설/부동산 뒤)
const total = sqlite.prepare("SELECT count(*) as c FROM qna_categories").get();
console.log(`[seed] 완료 — 전체 카테고리 ${total.c}개`);
