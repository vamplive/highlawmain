/**
 * 개인정보처리방침 본문.
 * 상담 신청 모달(PrivacyModal)과 전용 페이지(/privacy) 양쪽에서 재사용한다.
 * 「개인정보 보호법」 제30조 및 같은 법 시행령에 따라 작성되었으며,
 * 2026-05-06 PII 수집 지점 전수 감사 결과를 반영하여 갱신.
 */

// 표 셀 공통 스타일 — 굳이 styled-components 도입 없이 인라인으로 통일
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: 24,
  fontSize: 13,
};
const thStyle = {
  border: "1px solid var(--border-color)",
  padding: "8px 10px",
  background: "#f7f7f7",
  textAlign: "left",
  fontWeight: 600,
  verticalAlign: "top",
};
const tdStyle = {
  border: "1px solid var(--border-color)",
  padding: "8px 10px",
  verticalAlign: "top",
};
const articleTitleStyle = { fontWeight: 600, marginBottom: 12, marginTop: 8 };

export default function PrivacyContent() {
  return (
    <>
      <p style={{ marginBottom: 24 }}>
        법무법인 하이로(이하 "사무소")는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를
        보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 본 개인정보처리방침을
        수립·공개합니다. 본 처리방침은 사무소가 운영하는 홈페이지·의뢰인 포털·관리자 시스템에서
        제공하는 법무 서비스 자체의 개인정보 처리에 관한 사항을 정한 것이며, 개별 사건에 대한
        법률 자문은 별도의 위임계약 및 비밀유지 의무에 따릅니다.
      </p>

      {/* 제1조: 수집 항목 — 카테고리별로 정리 */}
      <p style={articleTitleStyle}>제1조 (수집하는 개인정보의 항목)</p>
      <p style={{ marginBottom: 12 }}>
        사무소는 「개인정보 보호법」 제15조 및 제22조에 따라 정보주체의 동의 또는 법령에 근거하여
        다음과 같이 개인정보를 수집합니다.
      </p>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>구분</th>
            <th style={thStyle}>수집 항목</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>회원·계정</td>
            <td style={tdStyle}>이메일, 비밀번호(단방향 해시), 이름, 휴대전화번호</td>
          </tr>
          <tr>
            <td style={tdStyle}>상담·예약 신청</td>
            <td style={tdStyle}>이름, 휴대전화번호, 이메일, 상담 내용, 희망 일시</td>
          </tr>
          <tr>
            <td style={tdStyle}>계약 체결·전자서명</td>
            <td style={tdStyle}>
              실명, 생년월일, 휴대전화번호, 이메일, 서명 이미지 및 필적 데이터(좌표·압력·속도),
              디바이스 메타정보(DPI, orientation), IP 주소, User-Agent
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>Q&amp;A·후기·챗봇</td>
            <td style={tdStyle}>닉네임 또는 실명(선택), 연락처(선택), 거주 지역(선택), 본문 내용</td>
          </tr>
          <tr>
            <td style={tdStyle}>마케팅·뉴스레터</td>
            <td style={tdStyle}>이메일, 이름, 수신 동의 이력</td>
          </tr>
          <tr>
            <td style={tdStyle}>메시지 발송 로그</td>
            <td style={tdStyle}>수신자명, 휴대전화번호 또는 이메일, 발송 본문, 이메일 열람 시각</td>
          </tr>
          <tr>
            <td style={tdStyle}>결제·청구</td>
            <td style={tdStyle}>
              의뢰인 이름·휴대전화번호·이메일·주소, 사업자등록번호, 대표자명,
              카드 끝 4자리·카드사명, 영수증 이미지 및 OCR 추출 텍스트
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>자동 수집</td>
            <td style={tdStyle}>
              IP 주소, User-Agent, 쿠키(세션·CSRF·분석동의), 페이지뷰(분석 동의 시), referrer,
              접속일시
            </td>
          </tr>
        </tbody>
      </table>

      {/* 제2조: 수집·이용 목적 */}
      <p style={articleTitleStyle}>제2조 (개인정보의 수집·이용 목적)</p>
      <p style={{ marginBottom: 12 }}>
        사무소는 다음의 목적을 위하여 개인정보를 처리하며, 처리하는 개인정보는 다음의 목적 이외의
        용도로는 이용되지 않습니다. 이용 목적이 변경되는 경우 「개인정보 보호법」 제18조에 따라
        별도의 동의를 받는 등 필요한 조치를 이행합니다.
      </p>
      <ul style={{ marginBottom: 24, paddingLeft: 20, listStyleType: "disc" }}>
        <li>법률 상담 접수, 사건 수임·대리 등 법무 서비스 제공</li>
        <li>위임계약·합의서 등 계약의 체결·이행 및 전자서명 진위 확인</li>
        <li>의뢰인 식별·인증, 본인확인(SMS 인증), 의뢰인 포털 운영</li>
        <li>수임료·실비 청구 및 영수증 처리</li>
        <li>홈페이지·서비스 운영, 품질 개선, 통계 분석</li>
        <li>마케팅·뉴스레터 발송(별도 동의 시)</li>
        <li>부정 이용 방지, 보안 사고 대응, 분쟁 처리 및 법적 의무 이행</li>
      </ul>

      {/* 제3조: 보유·이용 기간 */}
      <p style={articleTitleStyle}>제3조 (개인정보의 보유 및 이용 기간)</p>
      <p style={{ marginBottom: 12 }}>
        사무소는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 개인정보를 수집 시에
        동의받은 보유·이용 기간 내에서 개인정보를 처리·보유합니다. 구체적인 보유 기간은 다음과 같습니다.
      </p>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>구분</th>
            <th style={thStyle}>보유 기간</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>의뢰인 식별 정보(사건 수임 관련)</td>
            <td style={tdStyle}>
              「변호사법」 및 관계 법령에 따른 사건 종결 후 보관 의무 기간
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>계약·전자서명 데이터</td>
            <td style={tdStyle}>계약 효력 종료 후 10년 (「상법」 제64조 상사채권 소멸시효)</td>
          </tr>
          <tr>
            <td style={tdStyle}>회원·포털 계정 정보</td>
            <td style={tdStyle}>회원 탈퇴 시까지 (관계 법령상 보존 의무가 있는 경우 해당 기간)</td>
          </tr>
          <tr>
            <td style={tdStyle}>페이지뷰 분석 로그</td>
            <td style={tdStyle}>90일</td>
          </tr>
          <tr>
            <td style={tdStyle}>블로그 조회 이벤트</td>
            <td style={tdStyle}>180일</td>
          </tr>
          <tr>
            <td style={tdStyle}>챗봇 세션</td>
            <td style={tdStyle}>30일</td>
          </tr>
          <tr>
            <td style={tdStyle}>메시지 발송 로그</td>
            <td style={tdStyle}>1년 (이후 본문 익명화 처리)</td>
          </tr>
          <tr>
            <td style={tdStyle}>감사 로그(jsonl)</td>
            <td style={tdStyle}>운영 보관 (별도 logrotate 정책에 따름)</td>
          </tr>
          <tr>
            <td style={tdStyle}>마케팅 수신거부 이력</td>
            <td style={tdStyle}>영구 (재발송 방지 목적)</td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginBottom: 12 }}>
        그 밖에 관계 법령에 따라 보존할 필요가 있는 경우 해당 법령에서 정한 기간 동안 보관하며,
        대표적인 예는 다음과 같습니다.
      </p>
      <ul style={{ marginBottom: 24, paddingLeft: 20, listStyleType: "disc" }}>
        <li>「전자상거래 등에서의 소비자보호에 관한 법률」에 따른 계약·청약철회 기록: 5년</li>
        <li>「전자상거래 등에서의 소비자보호에 관한 법률」에 따른 표시·광고에 관한 기록: 6개월</li>
        <li>「통신비밀보호법」에 따른 통신사실확인자료: 3개월</li>
      </ul>

      {/* 제4조: 제3자 제공 */}
      <p style={articleTitleStyle}>제4조 (개인정보의 제3자 제공)</p>
      <p style={{ marginBottom: 24 }}>
        사무소는 정보주체의 개인정보를 제2조에서 명시한 목적 범위 내에서만 처리하며, 정보주체의
        사전 동의, 법령의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만
        개인정보를 제3자에게 제공합니다. 그 외에는 정보주체의 개인정보를 제3자에게 제공하지 않습니다.
      </p>

      {/* 제5조: 처리위탁 */}
      <p style={articleTitleStyle}>제5조 (개인정보 처리업무의 위탁)</p>
      <p style={{ marginBottom: 12 }}>
        사무소는 원활한 업무 처리를 위하여 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.
        위탁 시 「개인정보 보호법」 제26조에 따라 위탁 업무 수행 목적 외 개인정보 처리 금지,
        안전성 확보 조치, 재위탁 제한, 수탁자에 대한 관리·감독 등에 관한 사항을 계약서에 반영합니다.
      </p>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>수탁자</th>
            <th style={thStyle}>위탁 업무</th>
            <th style={thStyle}>위탁 항목</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>(주)알리고</td>
            <td style={tdStyle}>SMS·알림톡 발송</td>
            <td style={tdStyle}>휴대전화번호, 발송 본문</td>
          </tr>
          <tr>
            <td style={tdStyle}>Google LLC (Gmail SMTP)</td>
            <td style={tdStyle}>이메일 발송</td>
            <td style={tdStyle}>이메일 주소, 메일 본문</td>
          </tr>
          <tr>
            <td style={tdStyle}>Google LLC (Calendar API)</td>
            <td style={tdStyle}>화상상담 일정 관리</td>
            <td style={tdStyle}>이름, 휴대전화번호, 이메일, 상담 메시지</td>
          </tr>
          <tr>
            <td style={tdStyle}>Google LLC (Apps Script)</td>
            <td style={tdStyle}>상담 신청 이벤트 webhook 수신</td>
            <td style={tdStyle}>상담 신청 내역 전체</td>
          </tr>
          <tr>
            <td style={tdStyle}>Anthropic, PBC</td>
            <td style={tdStyle}>영수증 OCR 처리(AI)</td>
            <td style={tdStyle}>영수증 이미지, 추출 텍스트</td>
          </tr>
          <tr>
            <td style={tdStyle}>Functional Software, Inc. (Sentry)</td>
            <td style={tdStyle}>오류 모니터링 (운영 활성화 시)</td>
            <td style={tdStyle}>오류 발생 시 요청 메타데이터</td>
          </tr>
        </tbody>
      </table>

      {/* 제6조: 국외 이전 — 별도 동의 사항 */}
      <p style={articleTitleStyle}>제6조 (개인정보의 국외 이전)</p>
      <p style={{ marginBottom: 12 }}>
        사무소는 「개인정보 보호법」 제28조의8에 따라 정보주체의 별도 동의를 받아 다음과 같이
        개인정보를 국외로 이전합니다. 모든 이전은 TLS 1.2 이상의 HTTPS 채널을 통해 암호화되어
        전송되며, 수탁자는 자체 약관 및 사무소와의 위탁계약에 따라 안전성 확보 조치를 이행합니다.
      </p>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>이전 받는 자</th>
            <th style={thStyle}>이전 국가</th>
            <th style={thStyle}>이전 항목</th>
            <th style={thStyle}>이전 목적</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Anthropic, PBC</td>
            <td style={tdStyle}>미국</td>
            <td style={tdStyle}>영수증 이미지, 추출 텍스트</td>
            <td style={tdStyle}>영수증 OCR 처리 (모델 학습에 사용되지 않음)</td>
          </tr>
          <tr>
            <td style={tdStyle}>Google LLC</td>
            <td style={tdStyle}>미국·유럽 등</td>
            <td style={tdStyle}>이메일 주소·본문, 캘린더 일정 정보, 상담 신청 내역</td>
            <td style={tdStyle}>이메일·캘린더·Webhook 처리</td>
          </tr>
          <tr>
            <td style={tdStyle}>Functional Software, Inc. (Sentry)</td>
            <td style={tdStyle}>미국</td>
            <td style={tdStyle}>오류 메타데이터</td>
            <td style={tdStyle}>오류 모니터링 (운영 활성화 시)</td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginBottom: 24 }}>
        정보주체는 국외 이전에 동의하지 않을 권리가 있으며, 동의 거부 시 해당 기능(예: 화상상담
        예약, 영수증 자동 인식)의 이용이 제한될 수 있습니다.
      </p>

      {/* 제7조: 정보주체 권리 */}
      <p style={articleTitleStyle}>제7조 (정보주체와 법정대리인의 권리·의무 및 행사 방법)</p>
      <p style={{ marginBottom: 12 }}>
        정보주체는 사무소에 대해 언제든지 다음 각 호의 권리를 행사할 수 있습니다.
      </p>
      <ul style={{ marginBottom: 12, paddingLeft: 20, listStyleType: "disc" }}>
        <li>개인정보 열람 요구</li>
        <li>오류 등이 있을 경우 정정 요구</li>
        <li>삭제 요구</li>
        <li>처리 정지 요구</li>
        <li>수집·이용·제공 등에 대한 동의 철회</li>
      </ul>
      <p style={{ marginBottom: 12 }}>
        마케팅 수신거부는 <a href="/unsubscribe" style={{ color: "var(--accent-blue)" }}>/unsubscribe</a>{" "}
        페이지 또는 발송 메일 하단의 수신거부 링크를 통해 즉시 처리할 수 있습니다. 회원 탈퇴는
        의뢰인 포털 설정 또는 운영자 문의를 통해 신청하실 수 있습니다.
      </p>
      <p style={{ marginBottom: 12 }}>
        권리 행사는 법무법인 하이로 공식 연락처를 통해 하실 수 있으며,
        사무소는 「개인정보 보호법 시행령」 제41조 제1항에 따라 지체 없이 조치하겠습니다. 정보주체가
        개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 정정 또는 삭제를 완료할 때까지
        당해 개인정보를 이용하거나 제공하지 않습니다.
      </p>
      <p style={{ marginBottom: 24 }}>
        사무소는 만 14세 미만 아동의 개인정보를 수집하지 않습니다.
      </p>

      {/* 제8조: 쿠키 */}
      <p style={articleTitleStyle}>제8조 (쿠키의 운영)</p>
      <p style={{ marginBottom: 12 }}>
        사무소는 정보주체에게 맞춤형 서비스를 제공하고 서비스 운영의 안정성을 확보하기 위하여
        쿠키를 사용합니다. 쿠키는 다음과 같이 구분됩니다.
      </p>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>구분</th>
            <th style={thStyle}>쿠키명</th>
            <th style={thStyle}>용도</th>
            <th style={thStyle}>거부 가능 여부</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>필수</td>
            <td style={tdStyle}>
              admin_session, portal_session, sign_session, csrf-token
            </td>
            <td style={tdStyle}>관리자·포털·외부 서명 세션 유지 및 CSRF 방지</td>
            <td style={tdStyle}>거부 시 서비스 이용 불가</td>
          </tr>
          <tr>
            <td style={tdStyle}>선택</td>
            <td style={tdStyle}>privacy_analytics_consent</td>
            <td style={tdStyle}>페이지뷰 분석 동의 여부 저장</td>
            <td style={tdStyle}>거부 가능 (페이지뷰 분석 미수집)</td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginBottom: 24 }}>
        정보주체는 웹 브라우저의 옵션 설정을 통해 쿠키 저장을 거부할 수 있으나, 필수 쿠키를 거부하는
        경우 로그인·서명 등 일부 서비스 이용에 제한이 있을 수 있습니다.
      </p>

      {/* 제9조: 자동수집 */}
      <p style={articleTitleStyle}>제9조 (접속 정보의 자동 수집)</p>
      <p style={{ marginBottom: 24 }}>
        사무소는 부정 이용 방지, 통계 분석 및 보안 사고 대응을 위하여 정보주체의 IP 주소,
        User-Agent, referrer, 접속일시 등을 자동으로 수집할 수 있습니다. 자동 수집 정보는
        제3조의 보유 기간에 따라 관리됩니다.
      </p>

      {/* 제10조: 파기 */}
      <p style={articleTitleStyle}>제10조 (개인정보의 파기)</p>
      <p style={{ marginBottom: 12 }}>
        사무소는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는
        지체 없이 해당 개인정보를 파기합니다.
      </p>
      <ul style={{ marginBottom: 24, paddingLeft: 20, listStyleType: "disc" }}>
        <li>전자적 파일 형태: 복원이 불가능한 방법으로 영구 삭제</li>
        <li>종이 문서: 분쇄기로 분쇄하거나 소각하여 파기</li>
      </ul>

      {/* 제11조: 안전성 확보 조치 */}
      <p style={articleTitleStyle}>제11조 (개인정보의 안전성 확보 조치)</p>
      <p style={{ marginBottom: 12 }}>
        사무소는 「개인정보 보호법」 제29조 및 같은 법 시행령 제30조에 따라 다음과 같이 안전성
        확보에 필요한 기술적·관리적 및 물리적 조치를 하고 있습니다.
      </p>
      <ul style={{ marginBottom: 24, paddingLeft: 20, listStyleType: "disc" }}>
        <li>비밀번호의 단방향 해시 저장(scrypt 알고리즘)</li>
        <li>비밀번호 재설정 토큰의 SHA-256 해시 저장 및 1회용 사용</li>
        <li>세션 쿠키의 HttpOnly·Secure·SameSite=Lax 속성 적용</li>
        <li>전 구간 HTTPS(TLS 1.2 이상) 통신</li>
        <li>CSRF 더블 서브밋 쿠키 패턴 및 HMAC 서명 검증</li>
        <li>접근 권한 관리, 감사 로그 운영, IP 기반 요청 제한(rate-limiting)</li>
        <li>개인정보 취급 직원의 최소화 및 정기 교육</li>
        <li>접속 기록의 보관 및 위·변조 방지</li>
        <li>정기적인 의존성 보안 점검(npm audit) 및 CVE 패치 적용</li>
      </ul>

      {/* 제12조: 보호책임자 */}
      <p style={articleTitleStyle}>제12조 (개인정보 보호책임자)</p>
      <p style={{ marginBottom: 12 }}>
        사무소는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의
        불만 처리 및 피해 구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
      </p>
      <ul style={{ marginBottom: 24, paddingLeft: 20, listStyleType: "none" }}>
        <li>성명: <strong>조덕재 대표변호사</strong></li>
        <li>직책: 개인정보 보호책임자</li>
        <li>연락처: 준비 중</li>
        <li>이메일: 준비 중</li>
      </ul>
      <p style={{ marginBottom: 12 }}>
        그 밖에 개인정보 침해에 대한 신고나 상담이 필요한 경우 아래 기관에 문의하실 수 있습니다.
      </p>
      <ul style={{ marginBottom: 24, paddingLeft: 20, listStyleType: "disc" }}>
        <li>개인정보분쟁조정위원회: (국번없이) 1833-6972 / www.kopico.go.kr</li>
        <li>개인정보침해신고센터: (국번없이) 118 / privacy.kisa.or.kr</li>
        <li>대검찰청 사이버수사과: (국번없이) 1301 / www.spo.go.kr</li>
        <li>경찰청 사이버수사국: (국번없이) 182 / ecrm.cyber.go.kr</li>
      </ul>

      {/* 제13조: 변경 */}
      <p style={articleTitleStyle}>제13조 (개인정보 처리방침의 변경)</p>
      <p style={{ marginBottom: 12 }}>
        본 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가, 삭제
        및 정정이 있는 경우에는 변경 사항의 시행 7일 전부터 홈페이지 공지사항을 통하여 고지할
        것입니다.
      </p>
      <p style={{ fontWeight: 600, marginBottom: 8 }}>변경 이력</p>
      <ul style={{ marginBottom: 24, paddingLeft: 20, listStyleType: "disc" }}>
        <li>
          2026-05-06 (현행): PII 수집 지점 전수 감사 결과를 반영하여 수집 항목·보유 기간을
          카테고리별로 세분화하고, 처리위탁·국외 이전 내역(알리고, Google, Anthropic, Sentry)과
          쿠키 운영 기준을 신설.
        </li>
        <li>2026-01-01 (이전): 최초 시행.</li>
      </ul>

      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 16, marginTop: 8 }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>시행일: 2026년 5월 6일</p>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
          본 처리방침은 「개인정보 보호법」 제30조에 따라 작성되었습니다.
        </p>
      </div>
    </>
  );
}
