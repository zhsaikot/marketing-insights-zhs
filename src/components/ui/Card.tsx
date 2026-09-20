import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Card({ title, action, children, className = '', style }: CardProps) {
  return (
    <section className={`card ${className}`} style={style}>
      {(title || action) && (
        <header className="card-header">
          <h2>{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
