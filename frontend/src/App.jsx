import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MyFilesPage from './pages/MyFilesPage';
import SharedFilesPage from './pages/SharedFilesPage';
import RecentFilesPage from './pages/RecentFilesPage';
import StarredPage from './pages/StarredPage';
import TrashPage from './pages/TrashPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import HelpSupportPage from './pages/HelpSupportPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/files"
            element={
              <ProtectedRoute>
                <MyFilesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shared"
            element={
              <ProtectedRoute>
                <SharedFilesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shared-with-me"
            element={
              <ProtectedRoute>
                <SharedFilesPage initialTab="received" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shared-by-me"
            element={
              <ProtectedRoute>
                <SharedFilesPage initialTab="sent" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recent"
            element={
              <ProtectedRoute>
                <RecentFilesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/starred"
            element={
              <ProtectedRoute>
                <StarredPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trash"
            element={
              <ProtectedRoute>
                <TrashPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <HelpSupportPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
