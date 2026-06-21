import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <button 
      onClick={toggleTheme}
      className="btn btn-secondary"
      style={{
        padding: '8px 16px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        height: '40px',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--glass-border)',
        color: 'var(--text-primary)'
      }}
    >
      {theme === 'light' ? (
        <>
          <Moon size={16} color="var(--accent-purple)" />
          <span>Dark Mode</span>
        </>
      ) : (
        <>
          <Sun size={16} color="var(--accent-orange)" />
          <span>Light Mode</span>
        </>
      )}
    </button>
  );
}
