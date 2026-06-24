import { useAuth } from '../context/AuthContext';

// ── Placeholder dashboard — full implementation comes next ────────────────────
const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      {/* Nav */}
      <header className="border-b border-brand-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="badge-yellow">JT</span>
          <span className="font-bold tracking-tight text-sm">Job Tracker</span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="/" className="text-brand-yellow text-sm font-semibold">Dashboard</a>
          <a href="/analytics" className="text-brand-muted text-sm font-medium hover:text-white transition-colors">Analytics</a>
          <a href="/profile" className="text-brand-muted text-sm font-medium hover:text-white transition-colors">Profile</a>
          <button onClick={logout} className="btn-ghost text-xs py-1.5 px-3">Sign out</button>
        </nav>
      </header>

      {/* Body */}
      <main className="max-w-6xl mx-auto px-6 py-10 animate-fade-in">
        <div className="mb-8">
          <p className="label mb-1">Dashboard</p>
          <h1 className="text-4xl font-black tracking-tighter">
            Hey, {user?.name?.split(' ')[0] ?? 'there'}.
          </h1>
          <p className="text-brand-muted mt-1 text-sm">Here's your job search at a glance.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-brand-border mb-8">
          {[
            { label: 'Total Applied', value: '—' },
            { label: 'Interviews', value: '—' },
            { label: 'Offers', value: '—' },
            { label: 'Rejected', value: '—' },
          ].map((s) => (
            <div key={s.label} className="bg-brand-bg p-5">
              <p className="label mb-2">{s.label}</p>
              <p className="text-3xl font-black tracking-tighter text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Coming soon notice */}
        <div className="card border-brand-yellow border">
          <p className="label text-brand-yellow mb-1">In progress</p>
          <p className="text-white font-bold">Job list coming next.</p>
          <p className="text-brand-muted text-sm mt-1">
            Add, edit, and track every application with status, company, role, and notes.
          </p>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
