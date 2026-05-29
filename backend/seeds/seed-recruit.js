/**
 * 채용 공고 시드 데이터 작성 파일
 * - 신입변호사, 경력변호사, 군법무관, 직원 분야별 테스트용 고품격 채용 공고 삽입
 */
const crypto = require("crypto");

function seedRecruit(sqlite) {
  const check = sqlite.prepare("SELECT count(*) as c FROM recruit_posts").get();
  if (check.c > 0) return { inserted: false };

  const stmt = sqlite.prepare(`
    INSERT INTO recruit_posts (
      id, category, title, description, requirements, benefits,
      application_deadline, application_file_url, application_file_name,
      status, is_published, sort_order, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
    )
  `);

  const samplePosts = [
    {
      id: crypto.randomUUID(),
      category: "new_lawyer",
      title: "2026년도 신입 송무 변호사 채용 공고",
      description: `법무법인 하이로에서 열정적이고 패기 넘치는 신입 변호사를 모십니다. 
우리는 의뢰인과의 두터운 신뢰(Loyalty)와 품격(Dignity) 있는 법률 서비스를 최우선으로 지향합니다.
체계적인 송무 교육 프로그램과 실무 훈련을 통해 진정한 소송 전문가로 거듭날 인재들의 많은 지원을 바랍니다.

[담당 업무]
- 민·형사, 행정소송 서면 작성 및 서포트
- 법리 분석, 판례 리서치 및 송무 전략 수립
- 담당 파트너 변호사 협업 및 사건 관리 보조`,
      requirements: `- 사법연수원 수료자 또는 법학전문대학원 졸업자 (제15회 변호사시험 합격자 포함)
- 성실하고 긍정적인 마인드 소유자
- 뛰어난 논리적 서면 작성 능력 및 리서치 역량`,
      benefits: `- 급여: 법무법인 하이로 내규에 따름 (대형 로펌 수준의 경쟁력 있는 처우 및 성과급)
- 복리후생: 4대 보험, 퇴직금 별도, 최고급 업무 인프라 및 도서 구입비 전액 지원
- 연차 및 휴가: 근로기준법 기준 연차 제공 외 법률 연수 특별 휴가 지원`,
      applicationDeadline: "2026-06-30",
      applicationFileUrl: "https://highlaw.co.kr/files/recruit_application_new_lawyer.docx",
      applicationFileName: "법무법인_하이로_신입변호사_지원서.docx",
      status: "open",
      isPublished: 1,
      sortOrder: 10,
    },
    {
      id: crypto.randomUUID(),
      category: "experienced_lawyer",
      title: "민·형사 송무 및 중대재해 분야 경력 변호사 채용",
      description: `법무법인 하이로의 비약적인 성장과 함께할 유능한 경력 변호사를 채용합니다. 
특히 민·형사 송무 영역에서 주도적으로 사건을 처리해 본 경험이 있거나, 중대재해처벌법 관련 자문 및 대응 실무 경력을 가지신 분을 우대합니다.

[담당 업무]
- 민·형사, 가사, 행정 소송 직접 수행 및 변론
- 기업 법률 자문 및 중대재해 컴플라이언스 구축 자문
- 의뢰인 직접 상담 및 소송 전략 리딩`,
      requirements: `- 법조 경력 2년 이상 ~ 7년 이하
- 송무 단독 수행 가능자 우대
- 대형 로펌 또는 사법기관(검찰, 법원 등) 경력자 우대`,
      benefits: `- 급여: 경력 및 역량에 따른 개별 협의 (업계 최상위 수준 보장)
- 복리후생: 4대 보험, 개인 사무실 제공, 식대 지원, 차량 유지비 및 주차 지원
- 안식월 제도: 3년 근속 시 1개월 유급 리프레시 휴가 제공`,
      applicationDeadline: "2026-07-15",
      applicationFileUrl: "https://highlaw.co.kr/files/recruit_application_experienced.docx",
      applicationFileName: "법무법인_하이로_경력변호사_지원서.docx",
      status: "open",
      isPublished: 1,
      sortOrder: 20,
    },
    {
      id: crypto.randomUUID(),
      category: "military_lawyer",
      title: "군법무관 및 공익법무관 전역(예정) 변호사 특별 채용",
      description: `법무법인 하이로는 군 장병 및 군무원 사건, 방위사업 제재 대응, 군형사 특별법 등 특수 분야에서 압도적인 전문성을 발휘하고 있습니다.
2026년도 군법무관 또는 공익법무관 전역 예정자 및 전역하신 변호사님들을 당사의 전문 파트너로 초빙합니다.

[담당 업무]
- 군인, 군무원 관련 징계 처분 소송 및 소청 심사 대리
- 군사법원 형사 사건 대응 및 방산 기업 규제 자문
- 일반 민·형사 소송 및 행정 소송`,
      requirements: `- 군법무관 또는 공익법무관 전역(예정)자
- 성실성 및 투철한 사명감 보유자
- 군 징계 및 방위사업 관련 실무 유경험자 우대`,
      benefits: `- 급여: 경력 연차에 준하는 업계 상위급 고정급 + 성과 기여에 따른 인센티브
- 복리후생: 개인 집무실 제공, 학회 및 연수 참가비 지원, 의료비 지원
- 쾌적하고 수평적인 로펌 파트너십 문화 보장`,
      applicationDeadline: "2026-06-15",
      applicationFileUrl: "https://highlaw.co.kr/files/recruit_application_military.docx",
      applicationFileName: "법무법인_하이로_특별채용_지원서.docx",
      status: "open",
      isPublished: 1,
      sortOrder: 30,
    },
    {
      id: crypto.randomUUID(),
      category: "staff",
      title: "법무법인 하이로 송무 및 행정 직원 채용 (신입/경력)",
      description: `법무법인 하이로의 사무국에서 변호사 업무 지원 및 송무 행정 처리를 총괄할 유능하고 꼼꼼한 직원 분을 모십니다. 
따뜻하고 가족 같은 분위기 속에서 장기적인 커리어를 함께 성장시켜 나갈 분들의 많은 참여 바랍니다.

[담당 업무]
- 소송 서류 접수, 기일 관리, 송무 행정 사무
- 법원 및 검찰청 서류 접수 및 민원 대처
- 사무소 내방 고객 응대 및 일반 서무`,
      requirements: `- 초대졸 이상 학력 소유자
- 한글, 엑셀, 워드 등 오피스 프로그램 숙련자
- 법률사무원 양성 과정 이수자 또는 로펌 근무 경력자(1년 이상) 우대`,
      benefits: `- 급여: 신입/경력에 따른 내규 (경력 합리적 우대)
- 복리후생: 4대 보험, 중식대 전액 지원, 유니폼 및 교육비 지원, 명절 귀향비 지급
- 정시 퇴근 장려 및 주 5일제 철저 준수 (워라밸 보장)`,
      applicationDeadline: "2026-07-31",
      applicationFileUrl: "https://highlaw.co.kr/files/recruit_application_staff.docx",
      applicationFileName: "법무법인_하이로_행정직원_지원서.docx",
      status: "open",
      isPublished: 1,
      sortOrder: 40,
    },
  ];

  for (const post of samplePosts) {
    stmt.run(
      post.id,
      post.category,
      post.title,
      post.description,
      post.requirements,
      post.benefits,
      post.applicationDeadline,
      post.applicationFileUrl,
      post.applicationFileName,
      post.status,
      post.isPublished,
      post.sortOrder
    );
  }

  return { inserted: true, count: samplePosts.length };
}

module.exports = { seedRecruit };
