import { useState, useEffect, type ReactNode } from 'react';
import type { AuthUser, Page } from '../../types';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const SIDEBAR_COLLAPSED_KEY = 'marketing-insights-sidebar-collapsed';

export function AppLayout({
  page,
  onNavigate,
  user,
  onLogout,
  children,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
  user: AuthUser;
  onLogout: () => void;
  children: ReactNode;
}) {
  const titles: Record<Page, string> = {
    dashboard: 'Performance overview',
    performance: 'PageSpeed & Performance',
    clients: 'Clients',
    integrations: 'Integrations',
    reports: 'Reports',
    profile: 'Profile settings',
  };

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored !== null) return stored === 'true';
      return typeof window !== 'undefined' && window.innerWidth < 1280;
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
        } catch {}
        return next;
      });
    }
  };

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile drawer on route navigation
  const handleNavigateWithMobileClose = (target: Page) => {
    setMobileOpen(false);
    onNavigate(target);
  };

  return (
    <div
      className={`app-shell ${isCollapsed ? 'sidebar-is-collapsed' : 'sidebar-is-expanded'} ${
        mobileOpen ? 'mobile-sidebar-open' : ''
      }`}
    >
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Fixed & Collapsible Sidebar */}
      <Sidebar
        page={page}
        onNavigate={handleNavigateWithMobileClose}
        role={user.role}
        collapsed={isCollapsed}
        onToggleCollapse={toggleSidebar}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Page Area */}
      <main className="main-content">
        <Topbar
          title={titles[page]}
          user={user}
          onProfile={() => handleNavigateWithMobileClose('profile')}
          onLogout={onLogout}
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isCollapsed}
        />
        {children}
      </main>
    </div>
  );
}
