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
import InterviewConfigPage from './pages/interview/config/page';
import InterviewCustomPage from './pages/interview/custom/page';
import InterviewPreSessionPage from './pages/interview/pre-session/page';
import InterviewResultsPage from './pages/interview/results/page';

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
        <Route path="/interview/config" element={<ProtectedRoute><InterviewConfigPage /></ProtectedRoute>} />
        <Route path="/interview/custom" element={<ProtectedRoute><InterviewCustomPage /></ProtectedRoute>} />
        <Route path="/interview/pre-session" element={<ProtectedRoute><InterviewPreSessionPage /></ProtectedRoute>} />
        <Route path="/interview/results" element={<ProtectedRoute><InterviewResultsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </RealtimeSessionPrewarmProvider>
    </AvatarSessionProvider>
  );
}
