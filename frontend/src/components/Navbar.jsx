import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// ─── Nav link definitions ─────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Dashboard', to: '/' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Profile',   to: '/profile' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // ──    Exact match for /, prefix match for nested routes ────────────────────
  const isActive = (to) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out.');
    navigate('/login');
  };

  return (
    <header
      style={{
        backgroundColor: '#111111',
        borderBottom: '1px solid #222222',
      }}
    >
      {/* ── Main row (height 56px) ──────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6"
        style={{ height: '56px' }}
      >
        {/* Left — logo */}
        <Link
          to="/"
          className="font-black text-white text-xl transition-colors hover:text-brand-yellow"
          style={{ letterSpacing: '-0.04em', textDecoration: 'none' }}
        >
          TRACK.
        </Link>

        {/* Center — nav links (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ label, to }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                className="relative text-sm font-medium tracking-tight transition-colors pb-0.5"
                style={{
                  color: active ? '#FFE500' : '#888888',
                  fontWeight: active ? 600 : 500,
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = '#888888';
                }}
              >
                {label}
                {/* Active indicator — 2px bottom border */}
                {active && (
                  <span
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                      height: '2px',
                      backgroundColor: '#FFE500',
                      borderRadius: '0',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right — user name + sign out */}
        <div className="flex items-center gap-3">
          {user?.name && (
            <span className="hidden md:block text-white text-sm font-medium">
              {user.name}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm font-medium tracking-tight transition-colors"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #222222',
              color: '#888888',
              padding: '6px 12px',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#FFE500';
              e.currentTarget.style.color = '#FFE500';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#222222';
              e.currentTarget.style.color = '#888888';
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ── Mobile bottom nav row (visible below md) ──────────────────────── */}
      <div
        className="md:hidden flex items-center gap-6 px-6 overflow-x-auto"
        style={{
          borderTop: '1px solid #222222',
          height: '40px',
          scrollbarWidth: 'none', // hide scrollbar on Firefox
        }}
      >
        {NAV_LINKS.map(({ label, to }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex-shrink-0 text-sm font-medium tracking-tight transition-colors whitespace-nowrap relative pb-0.5"
              style={{
                color: active ? '#FFE500' : '#888888',
                fontWeight: active ? 600 : 500,
                textDecoration: 'none',
              }}
            >
              {label}
              {active && (
                <span
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: '2px', backgroundColor: '#FFE500' }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </header>
  );
};

export default Navbar;
