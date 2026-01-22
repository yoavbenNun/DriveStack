import React from 'react';
import { useTheme } from '../context/ThemeContext'; 

const DashboardPage = () => {
  const { theme, toggleTheme } = useTheme(); 

  return (
    <div style={{ padding: '50px', border: '5px solid green', textAlign: 'center' }}>
      <h1>My Drive (Dashboard)</h1>
      <p>Current Theme: <strong>{theme}</strong></p>
      
      <button 
        onClick={toggleTheme}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        Toggle Theme 🌓
      </button>
    </div>
  );
};

export default DashboardPage;