import React, { useState } from 'react';
import Sidebar from '../components/SideBar';
import TopBar from '../components/TopBar';
import MyDrive from './MyDrive';

const DashboardPage = () => {
  const [driveApi, setDriveApi] = useState(null);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: 'transparent',
      margin: 0,
      padding: 0
    }}>
      {/* 1. Side Navigation */}
      <Sidebar onDriveRefresh={() => driveApi?.refresh()} />

      {/* 2. Main Work Area (TopBar + Content) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
      }}>
        {/* 3. Top Navigation */}
        <TopBar />

        {/* 4. Scrollable Content Area */}
        <main style={{
          flex: 1,
          padding: '40px',
          overflowY: 'auto',
          color: 'var(--text-color)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <header style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '600', margin: 0 }}>
              My Drive
            </h1>
          </header>

          {/* expose refresh to Sidebar */}
          <MyDrive onReady={setDriveApi} />
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
