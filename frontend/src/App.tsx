import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Spinner, Center } from '@chakra-ui/react';
import DemoLayout from './layouts/DemoLayout';
import LoginPage from './pages/LoginPage';
import GradingCenterPage from './pages/GradingCenterPage';
import SubmissionReviewPage from './pages/SubmissionReviewPage';
import GradebookPage from './pages/GradebookPage';
import MyGradesPage from './pages/MyGradesPage';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Center h="100vh"><Spinner size="lg" color="ai.500" /></Center>;
  }

  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;

  return <>{children}</>;
}

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Center h="100vh"><Spinner size="lg" color="ai.500" /></Center>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />

      {/* Teacher routes */}
      <Route path="/teacher" element={<ProtectedRoute role="teacher"><DemoLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="grading" />} />
        <Route path="grading" element={<GradingCenterPage />} />
        <Route path="grading/review/:submissionId" element={<SubmissionReviewPage />} />
        <Route path="gradebook" element={<GradebookPage />} />
      </Route>

      {/* Student routes */}
      <Route path="/student" element={<ProtectedRoute role="student"><DemoLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="grades" />} />
        <Route path="grades" element={<MyGradesPage />} />
      </Route>

      {/* Root redirect based on role */}
      <Route path="/" element={
        user?.role === 'teacher' ? <Navigate to="/teacher/grading" /> :
        user?.role === 'student' ? <Navigate to="/student/grades" /> :
        <Navigate to="/login" />
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
