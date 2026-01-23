import React, { useState } from 'react';
import { Search, Moon, Sun, Settings, HelpCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const TopBar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px', borderBottom: '3px solid var(--border-color)' }}>
      <div style={{ flex: '0 1 1000px', display: 'flex', alignItems: 'center', backgroundColor: 'var(--search-bg)', padding: '20px 40px', borderRadius: '20px', gap: '25px' }}>
        <Search size={30} opacity={0.8} />
        <input type="text" placeholder="Search Drive..." style={{ background: 'transparent', border: 'none', color: 'inherit', width: '100%', outline: 'none', fontSize: '1.6rem' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '50px' }}>
        <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}>
          {theme === 'dark' ? <Sun size={30} /> : <Moon size={30} />}
        </button>
        <Settings size={70} />
        <div style={{ width: '100px', height: '55px', borderRadius: '50%', backgroundColor: '#4facfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>U</div>
      </div>
    </div>
  );
};

export default TopBar;