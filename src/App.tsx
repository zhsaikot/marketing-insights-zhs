import { useState } from 'react';
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

export default function App() {
  const auth = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  if (!auth.user) return <AuthScreen onLogin={auth.login} onGoogleLogin={auth.loginWithGoogle} onSignup={auth.signup} />;
  if (!auth.user.verified) return <AuthScreen onLogin={auth.login} onGoogleLogin={auth.loginWithGoogle} onSignup={auth.signup} verificationRequired onVerify={auth.verifyEmail} />;
  const safeNavigate = (nextPage: Page) => {
    if (auth.user?.role === 'client' && (nextPage === 'clients' || nextPage === 'integrations')) return;
    setPage(nextPage);
  };
  const content = { dashboard: <Dashboard />, clients: <Clients />, integrations: <Integrations />, reports: <Reports />, profile: <Profile user={auth.user} onSave={auth.updateProfile} onVerify={auth.verifyEmail} /> }[page];
  return <AppLayout page={page} onNavigate={safeNavigate} user={auth.user} onLogout={auth.logout}>{content}</AppLayout>;
}
