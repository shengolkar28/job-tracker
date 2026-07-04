import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Static stats for left panel ─────────────────────────────────────────────
const STATS = [
  { value: '248',  label: 'jobs tracked' },
  { value: '12',   label: 'offers landed' },
  { value: '4.2k', label: 'users' },
];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── Client-side validation ───────────────────────────────────────────────
    if (form.password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    setPasswordError('');

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created.');
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setForm({ ...form, password: val });
    // Clear inline error once they type enough
    if (passwordError && val.length >= 6) setPasswordError('');
  };

  return (
    <div className="flex min-h-screen bg-brand-bg">

      {/* ── LEFT PANEL (55%, hidden below md) ──────────────────────────────── */}
      <div
        className="hidden md:flex flex-col justify-between p-12 flex-shrink-0"
        style={{ width: '55%', minWidth: '480px', backgroundColor: '#0A0A0A' }}
      >
        {/* Logo */}
        <span
          className="text-5xl font-black text-white"
          style={{ letterSpacing: '-0.05em' }}
        >
          JOIN.
        </span>

        {/* Hero heading */}
        <div>
          <h1
            className="font-black text-white leading-none mb-2"
            style={{ fontSize: 'clamp(3.5rem, 5vw, 5.5rem)', letterSpacing: '-0.04em' }}
          >
            Start tracking.<br />Stop stressing.
          </h1>
        </div>

        {/* Stats + tagline */}
        <div>
          <div className="flex items-end gap-10 mb-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <p
                  className="font-black text-brand-yellow leading-none"
                  style={{ fontSize: '2rem', letterSpacing: '-0.04em' }}
                >
                  {s.value}
                </p>
                <p className="text-brand-muted text-xs mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-brand-muted text-sm">Built for serious candidates.</p>
        </div>
      </div>

      {/* ── RIGHT PANEL (45%, full screen on mobile) ────────────────────────── */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-8 py-12"
        style={{
          backgroundColor: '#111111',
          borderLeft: '1px solid #222222',
        }}
      >
        <div className="w-full max-w-sm md:max-w-[360px]">

          {/* Heading */}
          <div className="mb-8">
            <h2
              className="text-3xl font-black text-white mb-1"
              style={{ letterSpacing: '-0.03em' }}
            >
              Create account.
            </h2>
            <p className="text-brand-muted text-sm">Start your job search dashboard.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="label block mb-1.5" htmlFor="reg-name">
                Full name
              </label>
              <input
                id="reg-name"
                type="text"
                className="input-field"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="label block mb-1.5" htmlFor="reg-email">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            {/* Password with eye toggle + inline error */}
            <div>
              <label className="label block mb-1.5" htmlFor="reg-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  style={passwordError ? { borderColor: '#FF3333' } : {}}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handlePasswordChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#888888' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FFE500')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Inline error */}
              {passwordError && (
                <p
                  className="text-xs mt-1.5 font-medium"
                  style={{ color: '#FF3333' }}
                >
                  {passwordError}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="reg-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Get started'}
            </button>
          </form>

          {/* Divider */}
          <div className="divider my-6" />

          {/* Login link */}
          <p className="text-brand-muted text-sm text-center">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-white font-semibold hover:text-brand-yellow transition-colors"
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
};

export default RegisterPage;
