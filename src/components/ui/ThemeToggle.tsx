import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
}

export function ThemeToggle({ className = '', style }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    toggleTheme();
    setTimeout(() => setAnimating(false), 500);
  };

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${isDark ? 'is-dark' : 'is-light'} ${animating ? 'is-animating' : ''} ${className}`}
      onClick={handleClick}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={style}
    >
      <div className={`theme-toggle-inner ${animating ? 'spin-effect' : ''}`}>
        {isDark ? (
          <Moon size={18} className="theme-icon moon-icon" />
        ) : (
          <Sun size={18} className="theme-icon sun-icon" />
        )}
      </div>
      <span className="theme-toggle-glow" />
    </button>
  );
}
