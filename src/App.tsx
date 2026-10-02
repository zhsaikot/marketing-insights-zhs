import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthScreen } from './components/auth/AuthScreen';
import { AppLayout } from './components/layout/AppLayout';
import { useAuth } from './hooks/useAuth';
import type { Page } from './types';
import './styles.css';

// Code-split route pages with React.lazy
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Performance = lazy(() => import('./pages/Performance').then((m) => ({ default: m.Performance })));
const Clients = lazy(() => import('./pages/Clients').then((m) => ({ default: m.Clients })));
const Integrations = lazy(() => import('./pages/Integrations').then((m) => ({ default: m.Integrations })));
const Reports = lazy(() => import('./pages/Reports').then((m) => ({ default: m.Reports })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));

function PageLoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        width: '100%',
        gap: '12px',
      }}
    >
      <div
        className="spinning"
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e2e8f0',
          borderTopColor: 'var(--brand)',
          borderRadius: '50%',
        }}
      />
      <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
        Loading workspace view...
      </span>
    </div>
  );
}

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
  const validPages: Page[] = ['dashboard', 'performance', 'clients', 'integrations', 'reports', 'profile'];
  const currentPage: Page = validPages.includes(path as Page) ? (path as Page) : 'dashboard';

  const handleNavigate = (target: Page) => {
    navigate(target === 'dashboard' ? '/' : `/${target}`);
  };

  return (
    <AppLayout
      page={currentPage}
      onNavigate={handleNavigate}
      user={auth.user}
      onLogout={auth.logout}
    >
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/performance" element={<Performance />} />
          <Route
            path="/clients"
            element={<Clients user={auth.user} onRoleSwitch={auth.switchRole} />}
          />
          <Route
            path="/integrations"
            element={<Integrations user={auth.user} />}
          />
          <Route path="/reports" element={<Reports user={auth.user} />} />
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
      </Suspense>
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
