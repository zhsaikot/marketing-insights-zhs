import type { ReactNode } from 'react';

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'positive' | 'warning' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
