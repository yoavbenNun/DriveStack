import React from 'react';
import Sidebar from '../components/SideBar';
import TopBar from '../components/TopBar';

const DashboardPage = () => {
  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw',
      overflow: 'hidden', // Essential to keep Sidebar and TopBar fixed
      backgroundColor: 'transparent',
      margin: 0,
      padding: 0
    }}>
      {/* 1. Side Navigation*/}
      <Sidebar />

      {/* 2. Main Work Area (TopBar + Content) */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minWidth: 0 // Prevents layout breaking when content is wide
      }}>
        
        {/* 3. Top Navigation */}
        <TopBar />

        {/* 4. Scrollable Content Area */}
        <main style={{ 
          flex: 1, 
          padding: '40px', 
          overflowY: 'auto', // Only the files area scrolls
          color: 'var(--text-color)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <header style={{ marginBottom: '32px' }}>
            <h1 style={{ 
                fontSize: '2.5rem', // Large header to match the scale
                fontWeight: '600',
                margin: 0 
            }}>
                My Drive
            </h1>
          </header>

          {/* This is where the FileGrid will live */}
          <div style={{ 
            flex: 1,
            border: '2px dashed var(--border-color)', 
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--hover-bg)'
          }}>
            <div style={{ textAlign: 'center', opacity: 0.6 }}>
              <p style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Your drive is empty</p>
              <p style={{ fontSize: '1.1rem' }}>Use the <b>+ New</b> button to upload your first file.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;