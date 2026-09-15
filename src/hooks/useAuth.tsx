import { useState } from 'react';
import type { AuthUser, UserRole } from '../types';

const storageKey = 'marketing-insights-session';
const demoUser: AuthUser = { name: 'Ziaul Hasan', email: 'zhsaikot@gmail.com', role: 'agency', company: 'Northstar agency', verified: true };

function readSession(): AuthUser | null {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) as AuthUser : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(readSession);

  const startSession = (nextUser: AuthUser) => {
    localStorage.setItem(storageKey, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  return {
    user,
    login: (email: string) => startSession({ ...demoUser, email, name: email.split('@')[0] || demoUser.name }),
    loginWithGoogle: () => startSession(demoUser),
    signup: (name: string, email: string, role: UserRole, company: string) => startSession({ name, email, role, company, verified: false }),
    verifyEmail: () => {
      if (!user) return;
      startSession({ ...user, verified: true });
    },
    updateProfile: (updates: Pick<AuthUser, 'name' | 'company'>) => {
      if (!user) return;
      startSession({ ...user, ...updates });
    },
    logout: () => {
      localStorage.removeItem(storageKey);
      setUser(null);
    },
  };
}
