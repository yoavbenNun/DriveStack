import React, { useState, useRef, useEffect } from 'react';
import { Search, Moon, Sun, Settings, LogOut, Camera, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DEFAULT_AVATAR =
  'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';

const TopBar = ({ searchQuery, onSearchChange }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  const avatarSrc =
    user?.image && user.image.trim() !== '' ? user.image : DEFAULT_AVATAR;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsPopoverOpen(false);
    if (logout) logout();
    else localStorage.removeItem('token');
    navigate('/login');
  };

  const handleChangePicture = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result; // dataURL

      try {
        const response = await fetch(`/api/users/${user.id}/image`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image }),
        });

        if (!response.ok) {
          alert('Failed to update image. Please try again.');
          return;
        }

        const data = await response.json();
        updateUser?.({ image: data.image });
      } catch (error) {
        console.error('Error updating image:', error);
        alert('Error updating image.');
      }
    };

    reader.readAsDataURL(file);

    // מאפשר לבחור שוב את אותה תמונה
    e.target.value = '';
  };

  const handleDeletePicture = async () => {
    if (!user?.id) return;
    if (!window.confirm('Are you sure you want to delete your profile picture?')) return;

    try {
      const response = await fetch(`/api/users/${user.id}/image`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert('Failed to delete image.');
        return;
      }

      const data = await response.json();
      updateUser?.({ image: data.image }); // מצפה שהשרת יחזיר "" / null / placeholder
      setIsPopoverOpen(false);
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image.');
    }
  };

  return (
    <div
      style={{
        height: '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 60px',
        borderBottom: '3px solid var(--border-color)',
      }}
    >
      {/* Search */}
      <div
        style={{
          flex: '0 1 1000px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--search-bg)',
          padding: '20px 40px',
          borderRadius: '20px',
          gap: '25px',
        }}
      >
        <Search size={30} opacity={0.8} />
        <input
          type="text"
          placeholder="Search Drive..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            width: '100%',
            outline: 'none',
            fontSize: '1.6rem',
          }}
        />
      </div>

      {/* Right Side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: 'var(--search-bg)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            color: 'inherit',
          }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={26} /> : <Moon size={26} />}
        </button>

        {/* Settings icon (כרגע רק תצוגה) */}
        <Settings size={40} />

        {/* Avatar + Popover */}
        <div style={{ position: 'relative' }} ref={popoverRef}>
          <div
            onClick={() => setIsPopoverOpen((v) => !v)}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid var(--border-color)',
              cursor: 'pointer',
              backgroundColor: 'var(--search-bg)',
              opacity: isPopoverOpen ? 0.85 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Open profile menu"
          >
            <img
              src={avatarSrc}
              alt={user?.name || 'User'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_AVATAR;
              }}
            />
          </div>

          {isPopoverOpen && (
            <div
              style={{
                position: 'absolute',
                top: '90px',
                right: '0',
                width: '420px',
                backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f0f4f9',
                borderRadius: '32px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                padding: '35px 30px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid var(--border-color)',
                color: theme === 'dark' ? '#fff' : '#1f1f1f',
              }}
            >
              <span style={{ fontSize: '1.1rem', opacity: 0.8, marginBottom: '25px' }}>
                {user?.email || 'user@example.com'}
              </span>

              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <img
                  src={avatarSrc}
                  alt="Profile"
                  style={{
                    width: '130px',
                    height: '130px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid transparent',
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_AVATAR;
                  }}
                />

                <label
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: theme === 'dark' ? '#444' : '#fff',
                    borderRadius: '50%',
                    padding: '10px',
                    cursor: 'pointer',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Change picture"
                >
                  <Camera size={24} color={theme === 'dark' ? '#fff' : '#444'} />
                  <input type="file" accept="image/*" hidden onChange={handleChangePicture} />
                </label>
              </div>

              <h2 style={{ margin: '0 0 25px 0', fontSize: '2.2rem', fontWeight: '400' }}>
                Hello, {user?.name || user?.username || 'User'}!
              </h2>

              <button
                onClick={handleDeletePicture}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '24px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#ff4d4f',
                  fontWeight: '500',
                  fontSize: '1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginBottom: '15px',
                }}
              >
                <Trash2 size={22} /> Delete Profile Picture
              </button>

              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '20px',
                  borderRadius: '24px',
                  backgroundColor: 'var(--search-bg)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  color: 'inherit',
                  fontSize: '1.3rem',
                  fontWeight: '500',
                }}
              >
                <LogOut size={26} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;