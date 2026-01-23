import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, HardDrive, Users, Clock, Star, Trash2, Cloud, LogOut } from 'lucide-react';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const activeTab = 'my-drive'; 

  const menuItems = [
    { id: 'my-drive', icon: HardDrive, label: 'My Drive' },
    { id: 'shared', icon: Users, label: 'Shared with me' },
    { id: 'recent', icon: Clock, label: 'Recent' },
    { id: 'starred', icon: Star, label: 'Starred' },
    { id: 'trash', icon: Trash2, label: 'Trash' },
  ];

  return (
    <div style={{
      width: '280px', 
      height: '100vh',
      background: 'var(--sidebar-bg)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px', 
      color: 'var(--text-color)',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box'
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 10px 30px 10px' }}>
        <Cloud size={38} color="#4facfe" />
        <span style={{ fontSize: '1.6rem', fontWeight: '700' }}>DriveClone</span>
      </div>

      <button style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        background: 'white',
        color: '#333',
        border: 'none',
        borderRadius: '20px',
        padding: '16px 28px', // Chunky button
        fontSize: '1.1rem',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
        marginBottom: '25px',
        width: 'fit-content'
      }}>
        <Plus size={28} color="#0c0100" /> 
        <span>New</span>
      </button>

      <nav style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <div 
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px', // More gap
              padding: '16px 25px', // More padding
              borderRadius: '0 30px 30px 0',
              marginBottom: '10px',
              cursor: 'pointer',
              marginLeft: '-20px',
              paddingLeft: '45px',
              backgroundColor: activeTab === item.id ? 'rgba(79, 172, 254, 0.2)' : 'transparent',
              color: activeTab === item.id ? '#4facfe' : 'inherit',
              borderLeft: activeTab === item.id ? '4px solid #4facfe' : '4px solid transparent'
            }}
          >
            <item.icon size={22} />
            <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{item.label}</span>
          </div>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', color: '#ff7675', cursor: 'pointer', padding: '12px', width: '100%', fontSize: '1rem' }}>
          <LogOut size={20} /> Logout {user?.username}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;