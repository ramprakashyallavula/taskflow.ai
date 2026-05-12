import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { AIPlannerPage } from './pages/AIPlannerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { RegisterPage } from './pages/RegisterPage';
import { TasksPage } from './pages/TasksPage';

function NotFound() {
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/ai-planner" element={<AIPlannerPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
