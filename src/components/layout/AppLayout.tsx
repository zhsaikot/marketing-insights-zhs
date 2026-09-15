import type { ReactNode } from 'react';
import type { Page } from '../../types';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout({ page, onNavigate, children }: { page: Page; onNavigate: (page: Page) => void; children: ReactNode }) {
  const titles: Record<Page, string> = { dashboard: 'Performance overview', clients: 'Clients', integrations: 'Integrations', reports: 'Reports' };
  return <div className="app-shell"><Sidebar page={page} onNavigate={onNavigate} /><main className="main-content"><Topbar title={titles[page]} />{children}</main></div>;
}
