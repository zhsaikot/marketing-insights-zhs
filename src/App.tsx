import { useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { Clients } from './pages/Clients';
import { Dashboard } from './pages/Dashboard';
import { Integrations } from './pages/Integrations';
import { Reports } from './pages/Reports';
import type { Page } from './types';
import './styles.css';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const content = { dashboard: <Dashboard />, clients: <Clients />, integrations: <Integrations />, reports: <Reports /> }[page];
  return <AppLayout page={page} onNavigate={setPage}>{content}</AppLayout>;
}
