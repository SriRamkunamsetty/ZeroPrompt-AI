import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Layout } from './components/Layout';
import { DocumentAnalyzer } from './pages/DocumentAnalyzer';
import { CsvAnalyzer } from './pages/CsvAnalyzer';
import { CodeAnalyzer } from './pages/CodeAnalyzer';
import { GuidedWizard } from './pages/GuidedWizard';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/document" element={<DocumentAnalyzer />} />
        <Route path="/csv" element={<CsvAnalyzer />} />
        <Route path="/code" element={<CodeAnalyzer />} />
        <Route path="/wizard" element={<GuidedWizard />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
