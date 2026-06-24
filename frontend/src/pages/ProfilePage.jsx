import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      {/* Nav */}
      <header className="border-b border-brand-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="badge-yellow">JT</span>
          <span className="font-bold tracking-tight text-sm">Job Tracker</span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="/" className="text-brand-muted text-sm font-medium hover:text-white transition-colors">Dashboard</a>
          <a href="/analytics" className="text-brand-muted text-sm font-medium hover:text-white transition-colors">Analytics</a>
          <a href="/profile" className="text-brand-yellow text-sm font-semibold">Profile</a>
        </nav>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10 animate-fade-in">
        <div className="mb-8">
          <p className="label mb-1">Account</p>
          <h1 className="text-4xl font-black tracking-tighter">Profile</h1>
        </div>

        {/* User info card */}
        <div className="card mb-4 space-y-4">
          <div>
            <p className="label mb-1">Name</p>
            <p className="text-white font-semibold">{user?.name ?? '—'}</p>
          </div>
          <div className="divider" />
          <div>
            <p className="label mb-1">Email</p>
            <p className="text-white font-semibold">{user?.email ?? '—'}</p>
          </div>
          <div className="divider" />
          <div>
            <p className="label mb-1">Member since</p>
            <p className="text-white font-semibold">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>

        {/* Danger zone */}
        <div className="card border-brand-danger">
          <p className="label text-brand-danger mb-1">Danger zone</p>
          <p className="text-brand-muted text-sm mb-4">This will end your session on all devices.</p>
          <button id="profile-logout" onClick={handleLogout} className="btn-danger">
            Sign out
          </button>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
