import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

import Navbar from '../components/Navbar';
import api from '../api/axios';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  applied:   '#888888',
  screening: '#0047FF',
  interview: '#FFE500',
  offer:     '#00CC66',
  rejected:  '#FF3333',
  ghosted:   '#444444',
};

// ─── Shared card wrapper ──────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div
    style={{
      backgroundColor: '#111111',
      border: '1px solid #222222',
      padding: '20px',
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── Section heading ──────────────────────────────────────────────────────────
const SectionTitle = ({ children }) => (
  <p
    style={{
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: '#555555',
      marginBottom: '12px',
    }}
  >
    {children}
  </p>
);

// ─── Skeleton block ───────────────────────────────────────────────────────────
const Skeleton = ({ w = '100%', h = '16px', style = {} }) => (
  <div
    style={{
      width: w,
      height: h,
      backgroundColor: '#1a1a1a',
      borderRadius: '2px',
      animation: 'pulse 1.5s ease-in-out infinite',
      ...style,
    }}
  />
);

// ─── Custom donut tooltip (unused — label shown in legend) ────────────────────
const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div
      style={{
        backgroundColor: '#111111',
        border: '1px solid #FFE500',
        padding: '8px 12px',
        fontSize: '12px',
        color: '#FFFFFF',
        borderRadius: '2px',
      }}
    >
      <span style={{ color: '#888888', marginRight: '6px', textTransform: 'capitalize' }}>
        {name}
      </span>
      <strong>{value}</strong>
    </div>
  );
};

// ─── Custom line tooltip ──────────────────────────────────────────────────────
const LineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: '#111111',
        border: '1px solid #FFE500',
        padding: '8px 12px',
        fontSize: '12px',
        color: '#FFFFFF',
        borderRadius: '2px',
      }}
    >
      <p style={{ color: '#888888', marginBottom: '2px' }}>{label}</p>
      <p>
        <strong style={{ color: '#FFE500' }}>{payload[0].value}</strong>
        <span style={{ color: '#555555', marginLeft: '4px' }}>applications</span>
      </p>
    </div>
  );
};

// ─── AnalyticsPage ────────────────────────────────────────────────────────────
const AnalyticsPage = () => {
  const [summary, setSummary]       = useState(null);
  const [byStatus, setByStatus]     = useState([]);
  const [byWeek, setByWeek]         = useState([]);
  const [byCompany, setByCompany]   = useState([]);
  const [loading, setLoading]       = useState(true);

  // ── Parallel fetch on mount ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sumRes, statusRes, weekRes, companyRes] = await Promise.all([
          api.get('/api/analytics/summary'),
          api.get('/api/analytics/by-status'),
          api.get('/api/analytics/by-week'),
          api.get('/api/analytics/by-company'),
        ]);

        console.log('[Analytics] summary   →', sumRes.data);
        console.log('[Analytics] by-status →', statusRes.data);
        console.log('[Analytics] by-week   →', weekRes.data);
        console.log('[Analytics] by-company→', companyRes.data);

        setSummary(sumRes.data);

        // by-status: API returns { byStatus: [{status, count}, ...] }
        const rawStatus = statusRes.data?.byStatus ?? statusRes.data;
        setByStatus(
          (Array.isArray(rawStatus) ? rawStatus : []).map((d) => ({
            name:  d.status || d.name || '',
            value: d.count  ?? d.value ?? 0,
          }))
        );

        // by-week: API returns { byWeek: [{week, count}, ...] }
        const rawWeek = weekRes.data?.byWeek ?? weekRes.data;
        setByWeek(
          (Array.isArray(rawWeek) ? rawWeek : []).map((d) => ({
            label: d.week || d.date || d.label || '',
            count: d.count ?? d.value ?? 0,
          }))
        );

        // by-company: API returns { byCompany: [{company, count}, ...] }
        const rawCompany = companyRes.data?.byCompany ?? companyRes.data;
        setByCompany(
          (Array.isArray(rawCompany) ? rawCompany : []).map((d) => ({
            name:  d.company || d.name || '',
            count: d.count   ?? d.value ?? 0,
          }))
        );
      } catch (err) {
        console.error('[Analytics] fetch error →', err?.response ?? err);
        toast.error(err?.response?.data?.message || 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ── Summary helpers ────────────────────────────────────────────────────────
  const totalApps      = summary?.totalApplications ?? summary?.total ?? null;
  const responseRate   = summary?.responseRate      ?? null;
  const offerRate      = summary?.offerRate         ?? null;
  const avgDays        = summary?.avgDaysToResponse ?? summary?.avgDays ?? null;

  const maxCompanyCount = byCompany.length ? Math.max(...byCompany.map((c) => c.count)) : 1;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh' }}>
      {/* Pulse keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
      `}</style>

      <Navbar />

      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 24px',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* ── Page heading ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
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
            Analytics.
          </h1>
          <p style={{ color: '#555555', fontSize: '13px' }}>
            Your job search at a glance.
          </p>
        </div>

        {/* ── Section 1: Summary cards ───────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          {/* Total Applications */}
          <Card>
            <p className="label" style={{ marginBottom: '10px' }}>Total Applications</p>
            {loading
              ? <Skeleton h="36px" w="50%" />
              : <p style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.04em', color: '#FFFFFF', lineHeight: 1 }}>
                  {totalApps ?? '—'}
                </p>
            }
          </Card>

          {/* Response Rate */}
          <Card>
            <p className="label" style={{ marginBottom: '10px' }}>Response Rate</p>
            {loading
              ? <Skeleton h="36px" w="50%" />
              : <p style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  <span style={{ color: '#FFE500' }}>
                    {responseRate !== null ? `${responseRate}%` : '—'}
                  </span>
                </p>
            }
          </Card>

          {/* Offer Rate */}
          <Card>
            <p className="label" style={{ marginBottom: '10px' }}>Offer Rate</p>
            {loading
              ? <Skeleton h="36px" w="50%" />
              : <p style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  <span style={{ color: '#FFE500' }}>
                    {offerRate !== null ? `${offerRate}%` : '—'}
                  </span>
                </p>
            }
          </Card>

          {/* Avg Days to Response */}
          <Card>
            <p className="label" style={{ marginBottom: '10px' }}>Avg Days to Response</p>
            {loading
              ? <Skeleton h="36px" w="50%" />
              : <p style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.04em', color: '#FFFFFF', lineHeight: 1 }}>
                  {avgDays !== null ? avgDays : '—'}
                </p>
            }
          </Card>
        </div>

        {/* ── Section 2: Charts row ──────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.6fr',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          {/* ── Left: Donut chart — by status ─────────────────────────────── */}
          <Card>
            <SectionTitle>Applications by Status</SectionTitle>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Skeleton h="200px" />
                {[1,2,3].map(i => <Skeleton key={i} h="14px" w={i === 1 ? '70%' : i === 2 ? '55%' : '65%'} />)}
              </div>
            ) : byStatus.length === 0 ? (
              <p style={{ color: '#333333', fontSize: '13px', padding: '40px 0', textAlign: 'center' }}>
                No data yet. Start adding applications.
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={byStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      stroke="none"
                    >
                      {byStatus.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLORS[entry.name] || '#555555'}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Custom legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                  {byStatus.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: STATUS_COLORS[entry.name] || '#555555',
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#888888',
                            textTransform: 'capitalize',
                          }}
                        >
                          {entry.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#FFFFFF' }}>
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* ── Right: Line chart — applications per week ──────────────────── */}
          <Card>
            <SectionTitle>Applications per Week</SectionTitle>

            {loading ? (
              <Skeleton h="260px" />
            ) : byWeek.length === 0 ? (
              <p style={{ color: '#333333', fontSize: '13px', padding: '80px 0', textAlign: 'center' }}>
                No data yet. Start adding applications.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={byWeek}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#222222"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#555555', fontSize: 11 }}
                    axisLine={{ stroke: '#222222' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#555555', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<LineTooltip />} cursor={{ stroke: '#333333' }} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#FFE500"
                    strokeWidth={2}
                    dot={{ fill: '#FFE500', r: 3, strokeWidth: 0 }}
                    activeDot={{ fill: '#FFE500', r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* ── Section 3: Top companies ───────────────────────────────────────── */}
        <Card>
          <SectionTitle>Top Companies Applied To</SectionTitle>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[80, 60, 70, 45, 55].map((w, i) => (
                <Skeleton key={i} h="14px" w={`${w}%`} />
              ))}
            </div>
          ) : byCompany.length === 0 ? (
            <p style={{ color: '#333333', fontSize: '13px', padding: '20px 0' }}>
              No data yet. Start adding applications.
            </p>
          ) : (
            <div>
              {byCompany.map((company, idx) => {
                const pct = Math.round((company.count / maxCompanyCount) * 100);
                return (
                  <div
                    key={company.name}
                    style={{
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      borderBottom: idx < byCompany.length - 1 ? '1px solid #1a1a1a' : 'none',
                    }}
                  >
                    {/* Label row */}
                    <div className="flex items-center justify-between" style={{ marginBottom: '7px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF' }}>
                        {company.name}
                      </span>
                      <span style={{ fontSize: '12px', color: '#555555', fontVariantNumeric: 'tabular-nums' }}>
                        {company.count} {company.count === 1 ? 'application' : 'applications'}
                      </span>
                    </div>
                    {/* Bar */}
                    <div
                      style={{
                        width: '100%',
                        height: '4px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          backgroundColor: '#FFE500',
                          borderRadius: '2px',
                          transition: 'width 0.6s ease-out',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default AnalyticsPage;
