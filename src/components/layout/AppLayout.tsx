import type { ReactNode } from 'react';
import type { AuthUser, Page } from '../../types';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout({ page, onNavigate, user, onLogout, children }: { page: Page; onNavigate: (page: Page) => void; user: AuthUser; onLogout: () => void; children: ReactNode }) {
  const titles: Record<Page, string> = { dashboard: 'Performance overview', clients: 'Clients', integrations: 'Integrations', reports: 'Reports', profile: 'Profile settings' };
  return <div className="app-shell"><Sidebar page={page} onNavigate={onNavigate} role={user.role} /><main className="main-content"><Topbar title={titles[page]} user={user} onProfile={() => onNavigate('profile')} onLogout={onLogout} />{children}</main></div>;
}
