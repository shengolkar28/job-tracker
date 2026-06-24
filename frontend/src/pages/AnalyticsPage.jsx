const AnalyticsPage = () => (
  <div className="min-h-screen bg-brand-bg text-white">
    {/* Nav */}
    <header className="border-b border-brand-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="badge-yellow">JT</span>
        <span className="font-bold tracking-tight text-sm">Job Tracker</span>
      </div>
      <nav className="flex items-center gap-6">
        <a href="/" className="text-brand-muted text-sm font-medium hover:text-white transition-colors">Dashboard</a>
        <a href="/analytics" className="text-brand-yellow text-sm font-semibold">Analytics</a>
        <a href="/profile" className="text-brand-muted text-sm font-medium hover:text-white transition-colors">Profile</a>
      </nav>
    </header>

    <main className="max-w-6xl mx-auto px-6 py-10 animate-fade-in">
      <div className="mb-8">
        <p className="label mb-1">Analytics</p>
        <h1 className="text-4xl font-black tracking-tighter">Your metrics.</h1>
        <p className="text-brand-muted mt-1 text-sm">Response rates, pipeline stages, timelines.</p>
      </div>

      {/* Placeholder grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-brand-border">
        {['Response Rate', 'Stage Breakdown', 'Applications / Week', 'Time to Offer'].map((label) => (
          <div key={label} className="bg-brand-bg p-8 flex flex-col gap-3">
            <p className="label">{label}</p>
            <div className="h-32 border border-brand-border flex items-center justify-center">
              <span className="text-brand-muted text-xs">Chart coming soon</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  </div>
);

export default AnalyticsPage;
