import { Routes, Route, Navigate } from 'react-router-dom';
import { AvatarSessionProvider } from './contexts/AvatarSessionContext';
import { RealtimeSessionPrewarmProvider } from './contexts/RealtimeSessionPrewarmContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import HomePage from './pages/home/page';
import LoginPage from './pages/auth/login';
import RegisterPage from './pages/auth/register';
import DashboardPage from './pages/dashboard/page';
import PracticePage from './pages/practice/page';
import IntentEntryPage from './pages/practice/intent-entry/page';
import CustomScenarioPage from './pages/practice/custom-scenario/page';
import ExplorePage from './pages/practice/explore/page';
import PresentationPage from './pages/practice/presentation/page';
import PresentationAvatarSelectPage from './pages/practice/presentation/avatar-select-page';
import AvatarSelectPage from './pages/practice/avatar-select/page';
import PreSessionPage from './pages/practice/pre-session/page';
import ScenarioDetailsPage from './pages/practice/scenario-details/page';
import SessionPage from './pages/practice/session/page';
import PresentationSessionPage from './pages/practice/presentation/session-page';
import PresentationResultsPage from './pages/practice/presentation/results-page';
import ResultsPage from './pages/results/page';
import AssessmentRoleplaySessionPage from './pages/assessment-session/assessment-roleplay-session-page';
import SessionAnalysisPage from './pages/session-analysis/session-analysis-page';
import MicroAssessmentSessionAnalysisPage from './pages/assessment-session/micro-assessment-session-analysis-page';
import DatabaseAdminPage from './pages/admin/database-admin';
import AdminDashboard from './pages/admin/admin-dashboard';
import UserDetailPage from './pages/admin/user-detail-page';
import InterviewPracticePage from './pages/interview/page';
import InterviewRoleDetailPage from './pages/interview/role-detail-page';
import InterviewConfigPage from './pages/interview/config/page';
import InterviewModeSetupPage from './pages/interview/mode-setup/page';
import InterviewCustomPage from './pages/interview/custom/page';
import InterviewPreSessionPage from './pages/interview/pre-session/page';
import InterviewContinuousSessionPage from './pages/interview/continuous-session/page';
import InterviewResultsPage from './pages/interview/results/page';
import ExerciseModePage from './pages/exercise-mode/page';
import CaseStudyPage from './pages/exercise-mode/case-study/page';
import CaseStudyAvatarSelectPage from './pages/exercise-mode/case-study/avatar-select-page';
import CaseStudySessionPage from './pages/exercise-mode/case-study/session-page';
import CaseStudyResultsPage from './pages/exercise-mode/case-study/results-page';
import CodingLabPage from './pages/exercise-mode/coding-lab/page';
import CodingLabAvatarSelectPage from './pages/exercise-mode/coding-lab/avatar-select-page';
import CodingLabSessionPage from './pages/exercise-mode/coding-lab/session-page';
import CodingLabResultsPage from './pages/exercise-mode/coding-lab/results-page';
import ProfilePage from './pages/profile/page';
import JobsPage from './pages/jobs/page';
import JobDetailPage from './pages/jobs/detail-page';
import PublicSharePage from './pages/share/page';
import ApplyPage from './pages/apply/page';
import ReadycheckPage from './pages/readycheck/page';
import CompanyDashboard from './pages/company/page';
import CompanyLoginPage from './pages/company/login';

export default function App() {
  return (
    <AvatarSessionProvider>
      <RealtimeSessionPrewarmProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/avatar/dashboard" element={<DashboardPage />} />
        <Route path="/avatar/start" element={<ProtectedRoute><IntentEntryPage /></ProtectedRoute>} />
        <Route path="/avatar/practice" element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
        <Route path="/avatar/practice/custom-scenario" element={<ProtectedRoute><CustomScenarioPage /></ProtectedRoute>} />
        <Route path="/avatar/practice/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
        <Route path="/avatar/practice/presentation" element={<ProtectedRoute><PresentationPage /></ProtectedRoute>} />
        <Route path="/avatar/practice/presentation/avatar-select" element={<ProtectedRoute><PresentationAvatarSelectPage /></ProtectedRoute>} />
        <Route path="/avatar/practice/presentation/session" element={<ProtectedRoute><PresentationSessionPage /></ProtectedRoute>} />
        <Route path="/avatar/practice/presentation/results" element={<ProtectedRoute><PresentationResultsPage /></ProtectedRoute>} />
        <Route path="/avatar/practice/avatar-select" element={<ProtectedRoute><AvatarSelectPage /></ProtectedRoute>} />
        <Route path="/avatar/practice/pre-session" element={<ProtectedRoute><PreSessionPage /></ProtectedRoute>} />
        <Route path="/avatar/practice/scenario-details" element={<ProtectedRoute><ScenarioDetailsPage /></ProtectedRoute>} />
        <Route path="/avatar/practice/session" element={<ProtectedRoute><SessionPage /></ProtectedRoute>} />
        <Route path="/avatar/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
        <Route path="/avatar/assessment-session/roleplay" element={<ProtectedRoute><AssessmentRoleplaySessionPage /></ProtectedRoute>} />
        <Route path="/avatar/session-analysis" element={<ProtectedRoute><SessionAnalysisPage /></ProtectedRoute>} />
        <Route path="/micro-assessment-session-analysis" element={<ProtectedRoute><MicroAssessmentSessionAnalysisPage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users/:userId" element={<UserDetailPage />} />
        <Route path="/admin/database" element={<DatabaseAdminPage />} />
        <Route path="/interview" element={<ProtectedRoute><InterviewPracticePage /></ProtectedRoute>} />
        <Route path="/interview/role/:roleId" element={<ProtectedRoute><InterviewRoleDetailPage /></ProtectedRoute>} />
        <Route path="/interview/config" element={<ProtectedRoute><InterviewConfigPage /></ProtectedRoute>} />
        <Route path="/interview/mode-setup" element={<ProtectedRoute><InterviewModeSetupPage /></ProtectedRoute>} />
        <Route path="/interview/custom" element={<ProtectedRoute><InterviewCustomPage /></ProtectedRoute>} />
        <Route path="/interview/pre-session" element={<ProtectedRoute><InterviewPreSessionPage /></ProtectedRoute>} />
        <Route path="/interview/session" element={<ProtectedRoute><InterviewContinuousSessionPage /></ProtectedRoute>} />
        <Route path="/interview/results" element={<ProtectedRoute><InterviewResultsPage /></ProtectedRoute>} />
        <Route path="/exercise-mode" element={<ProtectedRoute><ExerciseModePage /></ProtectedRoute>} />
        <Route path="/exercise-mode/case-study" element={<ProtectedRoute><CaseStudyPage /></ProtectedRoute>} />
        <Route path="/exercise-mode/case-study/avatar-select" element={<ProtectedRoute><CaseStudyAvatarSelectPage /></ProtectedRoute>} />
        <Route path="/exercise-mode/case-study/session" element={<ProtectedRoute><CaseStudySessionPage /></ProtectedRoute>} />
        <Route path="/exercise-mode/case-study/results" element={<ProtectedRoute><CaseStudyResultsPage /></ProtectedRoute>} />
        <Route path="/exercise-mode/coding-lab" element={<ProtectedRoute><CodingLabPage /></ProtectedRoute>} />
        <Route path="/exercise-mode/coding-lab/avatar-select" element={<ProtectedRoute><CodingLabAvatarSelectPage /></ProtectedRoute>} />
        <Route path="/exercise-mode/coding-lab/session" element={<ProtectedRoute><CodingLabSessionPage /></ProtectedRoute>} />
        <Route path="/exercise-mode/coding-lab/results" element={<ProtectedRoute><CodingLabResultsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
        <Route path="/jobs/:jobId" element={<ProtectedRoute><JobDetailPage /></ProtectedRoute>} />
        <Route path="/share/:shareToken" element={<PublicSharePage />} />
        <Route path="/apply/:slug" element={<ApplyPage />} />
        <Route path="/readycheck" element={<ReadycheckPage />} />
        <Route path="/company/login" element={<CompanyLoginPage />} />
        <Route path="/company/dashboard" element={<CompanyDashboard />} />
        <Route path="/company" element={<Navigate to="/company/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </RealtimeSessionPrewarmProvider>
    </AvatarSessionProvider>
  );
}
