import { useState } from 'react';
import type { AuthUser, UserRole } from '../types';

const storageKey = 'marketing-insights-session';
const defaultAdminUser: AuthUser = {
  name: 'Ziaul Hasan',
  email: 'zhsaikot@gmail.com',
  role: 'admin',
  company: 'Northstar Agency',
  verified: true,
};

function readSession(): AuthUser | null {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? (JSON.parse(value) as AuthUser) : defaultAdminUser;
  } catch {
    return defaultAdminUser;
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
    login: (email: string) =>
      startSession({
        ...defaultAdminUser,
        email,
        name: email.split('@')[0] || defaultAdminUser.name,
      }),
    loginWithGoogle: () => startSession(defaultAdminUser),
    signup: (name: string, email: string, role: UserRole, company: string) =>
      startSession({ name, email, role, company, verified: true }),
    verifyEmail: () => {
      if (!user) return;
      startSession({ ...user, verified: true });
    },
    updateProfile: (updates: Partial<AuthUser>) => {
      if (!user) return;
      startSession({ ...user, ...updates });
    },
    switchRole: (newRole: UserRole) => {
      if (!user) return;
      startSession({ ...user, role: newRole });
    },
    logout: () => {
      localStorage.removeItem(storageKey);
      setUser(null);
    },
  };
}
