import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthScreen } from './components/auth/AuthScreen';
import { AppLayout } from './components/layout/AppLayout';
import { useAuth } from './hooks/useAuth';
import { Clients } from './pages/Clients';
import { Dashboard } from './pages/Dashboard';
import { Integrations } from './pages/Integrations';
import { Profile } from './pages/Profile';
import { Reports } from './pages/Reports';
import type { Page } from './types';
import './styles.css';

function AppRoutes() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!auth.user) {
    return (
      <AuthScreen
        onLogin={auth.login}
        onGoogleLogin={auth.loginWithGoogle}
        onSignup={auth.signup}
      />
    );
  }

  if (!auth.user.verified) {
    return (
      <AuthScreen
        onLogin={auth.login}
        onGoogleLogin={auth.loginWithGoogle}
        onSignup={auth.signup}
        verificationRequired
        onVerify={auth.verifyEmail}
      />
    );
  }

  // Derive current page identifier from pathname
  const path = location.pathname.replace(/^\//, '') || 'dashboard';
  const validPages: Page[] = ['dashboard', 'clients', 'integrations', 'reports', 'profile'];
  const currentPage: Page = validPages.includes(path as Page) ? (path as Page) : 'dashboard';

  const handleNavigate = (target: Page) => {
    if (auth.user?.role === 'client' && (target === 'clients' || target === 'integrations')) {
      return;
    }
    navigate(target === 'dashboard' ? '/' : `/${target}`);
  };

  return (
    <AppLayout
      page={currentPage}
      onNavigate={handleNavigate}
      user={auth.user}
      onLogout={auth.logout}
    >
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route
          path="/clients"
          element={
            auth.user.role === 'agency' ? <Clients /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/integrations"
          element={
            auth.user.role === 'agency' ? <Integrations /> : <Navigate to="/" replace />
          }
        />
        <Route path="/reports" element={<Reports />} />
        <Route
          path="/profile"
          element={
            <Profile
              user={auth.user}
              onSave={auth.updateProfile}
              onVerify={auth.verifyEmail}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
