import React from 'react';
import { useAuth } from '../context/AuthContext'; 

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px'
    }}>
      <h1>Welcome back, {user ? user.username : 'User'}! 👋</h1>
      
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '20px', 
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <p>This is your protected dashboard.</p>
        <p>Only logged-in users can see this.</p>
        
        <button 
          onClick={logout}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#ff7675',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;