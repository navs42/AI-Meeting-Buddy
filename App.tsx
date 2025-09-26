
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';

import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import NotesPage from './pages/NotesPage';
import CreateMeetingPage from './pages/CreateMeetingPage';
import ProfilePage from './pages/ProfilePage';
import LiveMeetingPage from './pages/LiveMeetingPage';
import NewLiveMeetingPage from './pages/NewLiveMeetingPage';
import MainLayout from './components/MainLayout';
import AuthLayout from './components/AuthLayout';
import ConnectionsPage from './pages/ConnectionsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAppContext();
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Route>
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="connections" element={<ConnectionsPage />} />
          <Route path="meeting/new" element={<CreateMeetingPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        
        <Route path="/meeting/live/:meetingId" element={
          <ProtectedRoute>
            <NewLiveMeetingPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
};

export default App;