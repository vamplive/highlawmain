/** 앱 라우터 설정 — 공개/에디터/관리자 경로 분기, 코드 스플리팅 적용 */
import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ErrorBoundary from "./components/ErrorBoundary";
import { api } from "./utils/api";

/* ── 로딩 폴백: 지연 로딩 중 표시할 스피너 (전역 Spinner 컴포넌트 재사용) ── */
import Spinner from "./components/ui/Spinner";
function LoadingFallback() {
  return <Spinner size={40} label="로딩 중" />;
}

/* ── 메인 청크: Layout과 HomePage만 정적 — 첫 페이지 빠른 LCP가 최우선 ── */
import Layout from "./components/Layout";
import HomePage from "./pages/home/HomePage";

/* ── 그 외 모든 공개 페이지는 lazy로 분리해 메인 entry를 가볍게 유지 ──
 *   사용자가 두 번째 페이지로 이동할 때 100~200ms 추가 페치는 허용 가능한 트레이드오프.
 *   대신 첫 방문 LCP/FCP가 크게 개선된다.
 */
const AboutPage = lazy(() => import("./pages/public/AboutPage"));
const LawyersPage = lazy(() => import("./pages/lawyers/LawyersPage"));
const LawyerDetailPage = lazy(() => import("./pages/lawyers/LawyerDetailPage"));
const PracticePage = lazy(() => import("./pages/practice/PracticePage"));
const PracticeDetailPage = lazy(() => import("./pages/practice/PracticeDetailPage"));
const LectureDetailPage = lazy(() => import("./pages/lawyers/LectureDetailPage"));
const ConsultationPage = lazy(() => import("./pages/consultation"));
const NotFoundPage = lazy(() => import("./pages/public/NotFoundPage"));
const RecruitPage = lazy(() => import("./pages/recruit/RecruitPage"));
const RecruitApplyPage = lazy(() => import("./pages/recruit/RecruitApplyPage"));
const PrivacyPage = lazy(() => import("./pages/public/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/public/TermsPage"));

/* ── 블로그 청크: 지연 로딩 ── */
const BlogPage = lazy(() => import("./pages/blog/BlogPage"));
const BlogDetailPage = lazy(() => import("./pages/blog/BlogDetailPage"));

/* ── 사례/후기 청크: 지연 로딩 ── */
const ReviewsPage = lazy(() => import("./pages/public/ReviewsPage"));
const UnsubscribePage = lazy(() => import("./pages/public/UnsubscribePage"));

/* ── 법률 Q&A 청크: 지연 로딩 ── */
const QnaHubPage = lazy(() => import("./pages/qna/QnaHubPage"));
const QnaDetailPage = lazy(() => import("./pages/qna/QnaDetailPage"));
const QnaAskPage = lazy(() => import("./pages/qna/QnaAskPage"));
const KakaoCallbackPage = lazy(() => import("./pages/qna/KakaoCallbackPage"));

/* ── 에디터 청크: 가장 큰 번들, 지연 로딩 ── */
const EditorPage = lazy(() => import("./pages/editor/EditorPage"));

/* ── 관리자 청크: 지연 로딩 (각 도메인 폴더의 index.jsx) ── */
const AdminLogin = lazy(() => import("./pages/admin/auth/Login"));
const AdminResetPassword = lazy(() => import("./pages/admin/auth/ResetPassword"));
const AdminLayout = lazy(() => import("./pages/admin/layout"));
const AdminDashboard = lazy(() => import("./pages/admin/dashboard"));
const AdminDocuments = lazy(() => import("./pages/admin/documents"));
const AdminBlog = lazy(() => import("./pages/admin/blog"));
const AdminLawyers = lazy(() => import("./pages/admin/lawyers"));
const AdminClients = lazy(() => import("./pages/admin/clients"));
const AdminClientDetail = lazy(() => import("./pages/admin/clients/ClientDetail"));
const AdminMessages = lazy(() => import("./pages/admin/messages"));
const AdminSiteManager = lazy(() => import("./pages/admin/site-manager"));
const AdminMedia = lazy(() => import("./pages/admin/media"));
const AdminAnalytics = lazy(() => import("./pages/admin/analytics"));
const AdminSettings = lazy(() => import("./pages/admin/settings"));
const AdminReviews = lazy(() => import("./pages/admin/reviews"));
const AdminBookings = lazy(() => import("./pages/admin/bookings"));
const AdminCases = lazy(() => import("./pages/admin/cases"));
const AdminQna = lazy(() => import("./pages/admin/qna"));
const AdminLectures = lazy(() => import("./pages/admin/lectures"));
const AdminInvitations = lazy(() => import("./pages/admin/invitations"));
const AdminContractTemplates = lazy(() => import("./pages/admin/contracts/ContractTemplates"));
const AdminContracts = lazy(() => import("./pages/admin/contracts"));
const AdminSettlementNew = lazy(() => import("./pages/admin/contracts/SettlementNew"));
const AdminEngagementNew = lazy(() => import("./pages/admin/contracts/EngagementNew"));
const AdminContractDetail = lazy(() => import("./pages/admin/contracts/ContractDetail"));
const AdminReceipts = lazy(() => import("./pages/admin/receipts"));
const PortalReceipts = lazy(() => import("./pages/portal/PortalReceipts"));
const AdminAuditLogs = lazy(() => import("./pages/admin/audit-logs"));
const AdminTimeEntries = lazy(() => import("./pages/admin/time-entries"));
const AdminTasks = lazy(() => import("./pages/admin/tasks"));
const AdminCourtDates = lazy(() => import("./pages/admin/court-dates"));
const AdminTrustAccounts = lazy(() => import("./pages/admin/trust-accounts"));
const AdminLawyerRevenue = lazy(() => import("./pages/admin/lawyer-revenue"));
const AdminArAging = lazy(() => import("./pages/admin/ar-aging"));
const AdminRecruit = lazy(() => import("./pages/admin/recruit"));
const AdminPortalUsers = lazy(() => import("./pages/admin/portal-users"));
const AdminPortalMembers = lazy(() => import("./pages/admin/portal-members"));
const AdminPortalBoardAdmin = lazy(() => import("./pages/admin/portal-board-admin"));
const AdminPortalTimeOverview = lazy(() => import("./pages/admin/portal-time-overview"));
const AdminChatbot = lazy(() => import("./pages/admin/chatbot"));

/* ── 로그인/포털 진입 청크: 지연 로딩 ── */
const LoginPage = lazy(() => import("./pages/public/LoginPage"));
const PortalResetPassword = lazy(() => import("./pages/public/PortalResetPassword"));
const PortalForgotPassword = lazy(() => import("./pages/portal/PortalForgotPassword"));

/* ── 공개 초대/서명 청크: 지연 로딩 ── */
const InviteEntryPage = lazy(() => import("./pages/public/InviteEntryPage"));
const InvitedConsultationPage = lazy(() => import("./pages/public/InvitedConsultationPage"));
const ExternalSignPage = lazy(() => import("./pages/public/ExternalSignPage"));
const MilitaryLandingPage = lazy(() => import("./pages/military"));

/* ── 포털 청크: 지연 로딩 ── */
const PortalLayout = lazy(() => import("./pages/portal/PortalLayout"));
const PortalLogin = lazy(() => import("./pages/portal/PortalLogin"));
const PortalRegister = lazy(() => import("./pages/portal/PortalRegister"));
const PortalDashboard = lazy(() => import("./pages/portal/PortalDashboard"));
const PortalCaseDetail = lazy(() => import("./pages/portal/PortalCaseDetail"));
const PortalCaseRecords = lazy(() => import("./pages/portal/PortalCaseRecords"));
const PortalCaseRegister = lazy(() => import("./pages/portal/PortalCaseRegister"));
const PortalTimeTracking = lazy(() => import("./pages/portal/PortalTimeTracking"));
const PortalContracts = lazy(() => import("./pages/portal/PortalContracts"));
const PortalContractSign = lazy(() => import("./pages/portal/PortalContractSign"));
const PortalReviews = lazy(() => import("./pages/portal/PortalReviews"));
const PortalBoard = lazy(() => import("./pages/portal/PortalBoard"));
const PortalBoardWriter = lazy(() => import("./pages/portal/PortalBoardWriter"));
const PortalCalendar = lazy(() => import("./pages/portal/PortalCalendar"));
const PortalProfile = lazy(() => import("./pages/portal/PortalProfile"));
const PortalMessenger = lazy(() => import("./pages/portal/PortalMessenger"));
const PortalApprovals = lazy(() => import("./pages/portal/PortalApprovals"));
const PortalAiSettings = lazy(() => import("./pages/portal/PortalAiSettings"));
const PortalBookings = lazy(() => import("./pages/portal/PortalBookings"));
const PortalClients = lazy(() => import("./pages/portal/PortalClients"));
const PortalBlog = lazy(() => import("./pages/portal/PortalBlog"));
const AdminOrganization = lazy(() => import("./pages/admin/organization/AdminOrganization"));

/** 지연 로딩 컴포넌트를 Suspense로 감싸는 헬퍼 */
function LazyRoute({ children }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  );
}

/** /editor/:id → /admin/editor/:id 리다이렉트 */
function EditorRedirect() {
  const { id } = useParams();
  return <Navigate to={`/admin/editor/${id}`} replace />;
}

/** /lawyers/:id → /partners/:id 리다이렉트 */
function NavigateToPartnerDetail() {
  const { id } = useParams();
  return <Navigate to={`/partners/${id}`} replace />;
}

/** /qna/category/:slug → /inquiry/category/:slug 리다이렉트 */
function QnaCategoryRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/inquiry/category/${slug}`} replace />;
}

/** /qna/question/:slug → /inquiry/question/:slug 리다이렉트 */
function QnaQuestionRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/inquiry/question/${slug}`} replace />;
}

function AdminArea() {
  const [auth, setAuth] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  // 마운트 시 /me로 세션 유효성 검증.
  // 토큰은 HttpOnly 쿠키에 있으므로 자바스크립트로 직접 확인할 수 없고,
  // 서버 응답으로만 인증 여부를 판단한다.
  // - 200: 인증된 세션
  // - 401/403: 비인증 (만료/없음) → 로그인 화면
  // - 5xx/네트워크 오류: 일시 장애 → 비인증으로 처리하고 사용자가 재시도
  useEffect(() => {
    let cancelled = false;
    // HttpOnly 쿠키 기반 — api 래퍼가 credentials:include를 자동 포함한다.
    api.get("/admin-users/me")
      .then(() => { if (!cancelled) setAuth(true); })
      .catch(() => {
        if (cancelled) return;
        // 401/403: 비인증 (만료/없음). 기타(네트워크·5xx): 일시 장애 → 비인증으로 처리.
        setAuth(false);
      })
      .catch(() => { if (!cancelled) setAuth(false); })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, []);

  // 로그인 성공 시 /admin/login에서 대시보드로 이동
  const login = () => {
    setAuth(true);
    navigate("/admin", { replace: true });
  };
  const logout = () => {
    // 쿠키 삭제는 서버 측 Set-Cookie로 처리되므로 별도 작업 불필요.
    // api.post 래퍼가 credentials:include + CSRF 헤더를 자동 처리한다.
    api.post("/admin-users/logout").catch(() => {});
    setAuth(false);
  };

  if (checking) return <LoadingFallback />;
  if (!auth) return <LazyRoute><AdminLogin onLogin={login} /></LazyRoute>;

  return (
    <LazyRoute>
      <AdminLayout onLogout={logout}>
        <Routes>
          <Route index element={<LazyRoute><AdminDashboard /></LazyRoute>} />
          <Route path="documents" element={<LazyRoute><AdminDocuments /></LazyRoute>} />
          <Route path="blog" element={<LazyRoute><AdminBlog /></LazyRoute>} />
          {/* 기존 /admin/hero-videos 경로는 사이트 관리자 히어로 영상 탭으로 통합 (북마크 호환) */}
          <Route path="hero-videos" element={<Navigate to="/admin/site-manager?tab=hero-videos" replace />} />
          <Route path="lawyers" element={<LazyRoute><AdminLawyers /></LazyRoute>} />
          <Route path="clients" element={<LazyRoute><AdminClients /></LazyRoute>} />
          <Route path="clients/:id" element={<LazyRoute><AdminClientDetail /></LazyRoute>} />
          <Route path="messages" element={<LazyRoute><AdminMessages /></LazyRoute>} />
          <Route path="site-manager" element={<LazyRoute><AdminSiteManager /></LazyRoute>} />
          <Route path="media" element={<LazyRoute><AdminMedia /></LazyRoute>} />
          <Route path="analytics" element={<LazyRoute><AdminAnalytics /></LazyRoute>} />
          <Route path="settings" element={<LazyRoute><AdminSettings /></LazyRoute>} />
          <Route path="reviews" element={<LazyRoute><AdminReviews /></LazyRoute>} />
          <Route path="bookings" element={<LazyRoute><AdminBookings /></LazyRoute>} />
          <Route path="cases" element={<LazyRoute><AdminCases /></LazyRoute>} />
          <Route path="inquiry" element={<LazyRoute><AdminQna /></LazyRoute>} />
          {/* 구버전 /admin/qna 경로 호환 */}
          <Route path="qna" element={<Navigate to="/admin/inquiry" replace />} />
          <Route path="chatbot" element={<LazyRoute><AdminChatbot /></LazyRoute>} />
          <Route path="lectures" element={<LazyRoute><AdminLectures /></LazyRoute>} />
          <Route path="editor" element={<LazyRoute><EditorPage /></LazyRoute>} />
          <Route path="editor/:id" element={<LazyRoute><EditorPage /></LazyRoute>} />
          <Route path="invitations" element={<LazyRoute><AdminInvitations /></LazyRoute>} />
          <Route path="contract-templates" element={<LazyRoute><AdminContractTemplates /></LazyRoute>} />
          <Route path="contracts" element={<LazyRoute><AdminContracts /></LazyRoute>} />
          <Route path="contracts/new-settlement" element={<LazyRoute><AdminSettlementNew /></LazyRoute>} />
          <Route path="contracts/new-engagement" element={<LazyRoute><AdminEngagementNew /></LazyRoute>} />
          <Route path="contracts/:id" element={<LazyRoute><AdminContractDetail /></LazyRoute>} />
          <Route path="receipts" element={<LazyRoute><AdminReceipts /></LazyRoute>} />
          <Route path="audit-logs" element={<LazyRoute><AdminAuditLogs /></LazyRoute>} />
          {/* ERP — 시간기록 / 업무 / 법정 일정 / 의뢰인 예치금 */}
          <Route path="time-entries" element={<LazyRoute><AdminTimeEntries /></LazyRoute>} />
          <Route path="tasks" element={<LazyRoute><AdminTasks /></LazyRoute>} />
          <Route path="court-dates" element={<LazyRoute><AdminCourtDates /></LazyRoute>} />
          <Route path="trust-accounts" element={<LazyRoute><AdminTrustAccounts /></LazyRoute>} />
          <Route path="lawyer-revenue" element={<LazyRoute><AdminLawyerRevenue /></LazyRoute>} />
          <Route path="ar-aging" element={<LazyRoute><AdminArAging /></LazyRoute>} />
          <Route path="recruit" element={<LazyRoute><AdminRecruit /></LazyRoute>} />
          <Route path="portal-users" element={<LazyRoute><AdminPortalUsers /></LazyRoute>} />
          <Route path="portal-members" element={<LazyRoute><AdminPortalMembers /></LazyRoute>} />
          <Route path="portal-board-admin" element={<LazyRoute><AdminPortalBoardAdmin /></LazyRoute>} />
          <Route path="portal-time-overview" element={<LazyRoute><AdminPortalTimeOverview /></LazyRoute>} />
          <Route path="organization" element={<LazyRoute><AdminOrganization /></LazyRoute>} />
        </Routes>
      </AdminLayout>
    </LazyRoute>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
        {/* 공개 페이지 — 홈만 정적, 그 외는 lazy */}
        <Route element={<Layout />}>
          <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
          <Route path="/about" element={<ErrorBoundary><LazyRoute><AboutPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/about/greetings" element={<ErrorBoundary><LazyRoute><AboutPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/about/values" element={<ErrorBoundary><LazyRoute><AboutPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/about/directions" element={<ErrorBoundary><LazyRoute><AboutPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/about/probono" element={<ErrorBoundary><LazyRoute><AboutPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/about/history" element={<ErrorBoundary><LazyRoute><AboutPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/practice" element={<ErrorBoundary><LazyRoute><PracticePage /></LazyRoute></ErrorBoundary>} />
          {/* 구버전 경로 호환 — 신규 분야로 리다이렉트 (구체 경로가 동적 라우트보다 우선) */}
          <Route path="/practice/construction" element={<Navigate to="/practice/illegal-dispatch" replace />} />
          <Route path="/practice/realestate" element={<Navigate to="/practice/game-fraud" replace />} />
          <Route path="/practice/:field" element={<ErrorBoundary><LazyRoute><PracticeDetailPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/partners" element={<ErrorBoundary><LazyRoute><LawyersPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/partners/:id" element={<ErrorBoundary><LazyRoute><LawyerDetailPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/lawyers" element={<Navigate to="/partners" replace />} />
          <Route path="/lawyers/:id" element={<NavigateToPartnerDetail />} />
          <Route path="/lectures/:id" element={<ErrorBoundary><LazyRoute><LectureDetailPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/consultation" element={<ErrorBoundary><LazyRoute><ConsultationPage /></LazyRoute></ErrorBoundary>} />

          {/* 블로그 — 지연 로딩 */}
          <Route path="/blog" element={<ErrorBoundary><LazyRoute><BlogPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/blog/:slug" element={<ErrorBoundary><LazyRoute><BlogDetailPage /></LazyRoute></ErrorBoundary>} />

          {/* 사례/후기 — 지연 로딩 */}
          {/* 구버전 경로 호환 리다이렉트 */}
          <Route path="/cases" element={<Navigate to="/inquiry" replace />} />
          <Route path="/qna" element={<Navigate to="/inquiry" replace />} />
          <Route path="/qna/category/:slug" element={<QnaCategoryRedirect />} />
          <Route path="/qna/question/:slug" element={<QnaQuestionRedirect />} />
          <Route path="/qna/ask" element={<Navigate to="/inquiry/ask" replace />} />
          <Route path="/reviews" element={<ErrorBoundary><LazyRoute><ReviewsPage /></LazyRoute></ErrorBoundary>} />

          {/* 법률 문의 (구 Q&A) — 지연 로딩 */}
          <Route path="/inquiry" element={<ErrorBoundary><LazyRoute><QnaHubPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/inquiry/category/:slug" element={<ErrorBoundary><LazyRoute><QnaHubPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/inquiry/question/:slug" element={<ErrorBoundary><LazyRoute><QnaDetailPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/inquiry/ask" element={<ErrorBoundary><LazyRoute><QnaAskPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/auth/kakao/callback" element={<ErrorBoundary><LazyRoute><KakaoCallbackPage /></LazyRoute></ErrorBoundary>} />

          {/* 공개 수신거부 — 토큰 쿼리로 접근 */}
          <Route path="/unsubscribe" element={<ErrorBoundary><LazyRoute><UnsubscribePage /></LazyRoute></ErrorBoundary>} />

          {/* 약관/개인정보 — 지연 로딩 */}
          <Route path="/privacy" element={<ErrorBoundary><LazyRoute><PrivacyPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/terms" element={<ErrorBoundary><LazyRoute><TermsPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/recruit" element={<ErrorBoundary><LazyRoute><RecruitPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/recruit/apply-form" element={<ErrorBoundary><LazyRoute><RecruitApplyPage /></LazyRoute></ErrorBoundary>} />

          {/* 404 — 공개 레이아웃 내부에서 처리, lazy */}
          <Route path="*" element={<LazyRoute><NotFoundPage /></LazyRoute>} />
        </Route>

        {/* /military — 군형사·징계 전문 독립 랜딩 페이지 (Layout 없이 풀스크린) */}
        <Route path="/military" element={<ErrorBoundary><LazyRoute><MilitaryLandingPage /></LazyRoute></ErrorBoundary>} />

        {/* /login — 통합 로그인/회원가입 페이지 (Layout 없이 풀스크린) */}
        <Route path="/login" element={<ErrorBoundary><LazyRoute><LoginPage /></LazyRoute></ErrorBoundary>} />

        {/* /reset-password?token=xxx — 포털 비밀번호 재설정 (인증 없이 접근, 토큰 검증으로 보호) */}
        <Route path="/reset-password" element={<ErrorBoundary><LazyRoute><PortalResetPassword /></LazyRoute></ErrorBoundary>} />

        {/* /forgot-password — 포털 비밀번호 찾기 (전화번호 입력 → 문자 발송) */}
        <Route path="/forgot-password" element={<ErrorBoundary><LazyRoute><PortalForgotPassword /></LazyRoute></ErrorBoundary>} />

        {/* 포털 — 지연 로딩 */}
        <Route path="/portal" element={<ErrorBoundary><LazyRoute><PortalLayout /></LazyRoute></ErrorBoundary>}>
          {/* 포털 홈 → 일정 캘린더 */}
          <Route index element={<Navigate to="/portal/calendar" replace />} />
          {/* /portal/login → /login 으로 통합 (기존 링크 북마크 호환) */}
          <Route path="login" element={<Navigate to="/login" replace />} />
          <Route path="register" element={<Navigate to="/login" replace />} />
          <Route path="dashboard" element={<LazyRoute><PortalDashboard /></LazyRoute>} />
          <Route path="cases/register" element={<LazyRoute><PortalCaseRegister /></LazyRoute>} />
          <Route path="cases/:id" element={<LazyRoute><PortalCaseDetail /></LazyRoute>} />
          <Route path="cases/:id/records" element={<LazyRoute><PortalCaseRecords /></LazyRoute>} />
          <Route path="time-tracking" element={<LazyRoute><PortalTimeTracking /></LazyRoute>} />
          <Route path="board" element={<LazyRoute><PortalBoard /></LazyRoute>} />
          <Route path="board/write" element={<LazyRoute><PortalBoardWriter /></LazyRoute>} />
          <Route path="board/write/:postId" element={<LazyRoute><PortalBoardWriter /></LazyRoute>} />
          <Route path="calendar" element={<LazyRoute><PortalCalendar /></LazyRoute>} />
          <Route path="profile" element={<LazyRoute><PortalProfile /></LazyRoute>} />
          <Route path="messenger" element={<LazyRoute><PortalMessenger /></LazyRoute>} />
          <Route path="approvals" element={<LazyRoute><PortalApprovals /></LazyRoute>} />
          <Route path="contracts" element={<LazyRoute><PortalContracts /></LazyRoute>} />
          <Route path="contracts/:id" element={<LazyRoute><PortalContractSign /></LazyRoute>} />
          <Route path="blog" element={<LazyRoute><PortalBlog /></LazyRoute>} />
          <Route path="qna" element={<Navigate to="/admin/inquiry" replace />} />
          <Route path="messages" element={<LazyRoute><AdminMessages /></LazyRoute>} />
          <Route path="reviews" element={<LazyRoute><PortalReviews /></LazyRoute>} />
          <Route path="editor" element={<LazyRoute><EditorPage /></LazyRoute>} />
          <Route path="editor/:id" element={<LazyRoute><EditorPage /></LazyRoute>} />
          <Route path="ai-settings" element={<LazyRoute><PortalAiSettings /></LazyRoute>} />
          <Route path="bookings" element={<LazyRoute><PortalBookings /></LazyRoute>} />
          <Route path="clients" element={<LazyRoute><PortalClients /></LazyRoute>} />
          {/* 계약서 관리 (직원/변호사용) — 포털로 이전 */}
          <Route path="contract-admin" element={<LazyRoute><AdminContracts /></LazyRoute>} />
          <Route path="contract-admin/new-settlement" element={<LazyRoute><AdminSettlementNew /></LazyRoute>} />
          <Route path="contract-admin/new-engagement" element={<LazyRoute><AdminEngagementNew /></LazyRoute>} />
          <Route path="contract-admin/:id" element={<LazyRoute><AdminContractDetail /></LazyRoute>} />
          {/* 영수증 관리 — 의뢰인 포털 전용 페이지 */}
          <Route path="receipts" element={<LazyRoute><PortalReceipts /></LazyRoute>} />
          {/* 홍보·콘텐츠 — admin 전용 */}
          <Route path="lectures" element={<LazyRoute><AdminLectures /></LazyRoute>} />
          <Route path="site-manager" element={<Navigate to="/admin/site-manager" replace />} />
          <Route path="media" element={<Navigate to="/admin/media" replace />} />
        </Route>

        {/* 초대/서명 — 공개 (Layout 없음, 집중 모드) */}
        <Route path="/invite/:token" element={<ErrorBoundary><LazyRoute><InviteEntryPage /></LazyRoute></ErrorBoundary>} />
        <Route path="/invite/:token/consultation" element={<ErrorBoundary><LazyRoute><InvitedConsultationPage /></LazyRoute></ErrorBoundary>} />
        <Route path="/sign/:token" element={<ErrorBoundary><LazyRoute><ExternalSignPage /></LazyRoute></ErrorBoundary>} />

        {/* 에디터 — 관리자 인증 필요 (AdminArea로 리다이렉트) */}
        <Route path="/editor" element={<Navigate to="/admin/editor" replace />} />
        <Route path="/editor/:id" element={<EditorRedirect />} />

        {/* 비밀번호 재설정 — 인증 없이 접근 (토큰 검증으로 보호). /admin/* 보호 영역 외부에 두어야 한다. */}
        <Route path="/admin/reset-password" element={<ErrorBoundary><LazyRoute><AdminResetPassword /></LazyRoute></ErrorBoundary>} />

        {/* 관리자 — 지연 로딩 */}
        <Route path="/admin/*" element={<ErrorBoundary><AdminArea /></ErrorBoundary>} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}
