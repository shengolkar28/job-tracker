import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name = '') => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
};

const fmtMemberSince = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

// ─── Card wrapper ─────────────────────────────────────────────────────────────
const Card = ({ children, dangerBorder = false, style = {} }) => (
  <div
    style={{
      backgroundColor: '#111111',
      border: dangerBorder ? '1px solid #FF3333' : '1px solid #222222',
      padding: '24px',
      marginBottom: '16px',
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── Section label ────────────────────────────────────────────────────────────
const SLabel = ({ danger = false, children }) => (
  <p
    style={{
      fontSize: '10px',
      fontWeight: '700',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: danger ? '#FF3333' : '#555555',
      marginBottom: '16px',
    }}
  >
    {children}
  </p>
);

// ─── Divider ──────────────────────────────────────────────────────────────────
const Divider = () => (
  <div style={{ borderTop: '1px solid #1e1e1e', margin: '16px 0' }} />
);

// ─── Toggle switch ────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    style={{
      position: 'relative',
      width: '40px',
      height: '22px',
      borderRadius: '11px',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: checked ? '#FFE500' : '#2a2a2a',
      transition: 'background-color 0.2s',
      flexShrink: 0,
      padding: 0,
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: '3px',
        left: checked ? '21px' : '3px',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: checked ? '#000000' : '#555555',
        transition: 'left 0.2s',
      }}
    />
  </button>
);

// ─── ProfilePage ──────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [remindersEnabled, setRemindersEnabled] = useState(
    user?.reminder_enabled ?? false
  );

  // Keep toggle in sync if user loads async
  useEffect(() => {
    if (user?.reminder_enabled !== undefined) {
      setRemindersEnabled(user.reminder_enabled);
    }
  }, [user]);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (user === null) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggleReminders = () => {
    setRemindersEnabled((prev) => !prev);
    toast.success('Preference saved.');
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out.');
    navigate('/login');
  };

  const initials = getInitials(user.name);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh' }}>
      <Navbar />

      <main
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '32px 24px',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* ── Page heading ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '28px' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: '900',
              letterSpacing: '-0.04em',
              color: '#FFFFFF',
              lineHeight: 1,
              marginBottom: '6px',
            }}
          >
            Profile.
          </h1>
          <p style={{ color: '#555555', fontSize: '13px' }}>
            Manage your account and preferences.
          </p>
        </div>

        {/* ── Section 1: User info ──────────────────────────────────────────── */}
        <Card>
          {/* Avatar + name block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            {/* Initials avatar */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#FFE500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: '900',
                  letterSpacing: '-0.03em',
                  color: '#000000',
                  lineHeight: 1,
                }}
              >
                {initials}
              </span>
            </div>

            {/* Name + email stacked */}
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: '1.35rem',
                  fontWeight: '900',
                  letterSpacing: '-0.03em',
                  color: '#FFFFFF',
                  lineHeight: 1.1,
                  marginBottom: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.name}
              </p>
              <p style={{ fontSize: '13px', color: '#555555' }}>
                {user.email}
              </p>
            </div>
          </div>

          <Divider />

          {/* Member since */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#444444',
              }}
            >
              Member since
            </span>
            <span style={{ fontSize: '13px', color: '#888888', fontWeight: '500' }}>
              {fmtMemberSince(user.created_at)}
            </span>
          </div>
        </Card>

        {/* ── Section 2: Preferences ────────────────────────────────────────── */}
        <Card>
          <SLabel>Preferences</SLabel>

          {/* Email reminders toggle row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', marginBottom: '2px' }}>
                Email Reminders
              </p>
              <p style={{ fontSize: '12px', color: '#555555' }}>
                Get notified when you haven't applied in a while.
              </p>
            </div>
            <Toggle checked={remindersEnabled} onChange={handleToggleReminders} />
          </div>
        </Card>

        {/* ── Section 3: Danger zone ────────────────────────────────────────── */}
        <Card dangerBorder>
          <SLabel danger>Danger Zone</SLabel>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', marginBottom: '2px' }}>
                Sign out of your account
              </p>
              <p style={{ fontSize: '12px', color: '#555555' }}>
                This will end your session and clear all local data.
              </p>
            </div>
            <button
              id="profile-logout"
              onClick={handleLogout}
              className="btn-danger"
              style={{ flexShrink: 0 }}
            >
              Sign out
            </button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default ProfilePage;
