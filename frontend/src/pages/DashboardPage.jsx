import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Plus,
  List,
  Columns2,
  Briefcase,
  Users,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import JobCard from '../components/JobCard';
import KanbanBoard from '../components/KanbanBoard';
import AddJobModal from '../components/AddJobModal';
import api from '../api/axios';

// ─── Dropdown style helper ────────────────────────────────────────────────────
const selectStyle = {
  backgroundColor: '#111111',
  border: '1px solid #222222',
  color: '#FFFFFF',
  fontSize: '13px',
  padding: '8px 10px',
  outline: 'none',
  borderRadius: '2px',
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui, sans-serif',
  transition: 'border-color 0.15s',
  minWidth: '130px',
};

// ─── Loading skeleton rows ────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <td key={i} style={{ padding: '14px 16px' }}>
        <div
          style={{
            height: '14px',
            backgroundColor: '#1a1a1a',
            borderRadius: '2px',
            width: i === 1 ? '80%' : i === 6 ? '60px' : '70%',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      </td>
    ))}
  </tr>
);

// ─── DashboardPage ────────────────────────────────────────────────────────────
const DashboardPage = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState([]);
  const [kanbanJobs, setKanbanJobs] = useState([]);   // all jobs, unpaginated
  const [summary, setSummary] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingKanban, setLoadingKanban] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'kanban'

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination (List view only)
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  // "By Stage" mode: full sorted dataset (client-side paging)
  const stageAllJobsRef = useRef([]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // Debounce ref
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // ── Debounce search input ──────────────────────────────────────────────────
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // ── Fetch analytics summary ────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const { data } = await api.get('/api/analytics/summary');
      // ── Debug: log raw analytics response to verify field names ──────────
      console.log('[Dashboard] analytics response →', data);
      setSummary(data);
    } catch (err) {
      console.error('[Dashboard] analytics fetch error →', err?.response ?? err);
      toast.error(err?.response?.data?.message || 'Failed to load analytics.');
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  // ── Reset page when filters / search change ────────────────────────────────
  useEffect(() => {
    setPage(1);
    stageAllJobsRef.current = [];
  }, [debouncedSearch, status, priority, sortBy]);

  // Pipeline order for client-side "By Stage" sort
  const STATUS_ORDER = {
    interview: 0,
    screening: 1,
    applied: 2,
    offer: 3,
    rejected: 4,
    ghosted: 5
  };
  const PAGE_SIZE = 8;

  // ── Fetch jobs list (paginated — List view) ─────────────────────────────
  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      if (sortBy === 'by_stage') {
        if (stageAllJobsRef.current.length > 0) {
          // ─ Cache hit: just re-slice for the new page (no API call) ─────────
          const start = (page - 1) * PAGE_SIZE;
          const slice = stageAllJobsRef.current.slice(start, start + PAGE_SIZE);
          setJobs(slice);
          setPagination(prev => prev ? { ...prev, page } : prev);
        } else {
          // ─ Cache miss: fetch all, sort, populate cache, slice page 1 ────────
          const params = { limit: 1000 };
          if (debouncedSearch) params.search = debouncedSearch;
          if (status !== 'all') params.status = status;
          if (priority !== 'all') params.priority = priority;

          const { data } = await api.get('/api/jobs', { params });
          const all = Array.isArray(data) ? data : data.jobs ?? [];
          const sorted = [...all].sort(
            (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
          );

          stageAllJobsRef.current = sorted;
          const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
          const safePage = Math.min(page, totalPages);
          setJobs(sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE));
          setPagination({ total: sorted.length, totalPages, page: safePage });
        }
      } else {
        // ─ Normal backend-paginated fetch ───────────────────────────────
        const params = { page, limit: PAGE_SIZE };
        if (debouncedSearch) params.search = debouncedSearch;
        if (status !== 'all') params.status = status;
        if (priority !== 'all') params.priority = priority;
        params.sortBy = sortBy;

        const { data } = await api.get('/api/jobs', { params });
        stageAllJobsRef.current = [];
        setJobs(Array.isArray(data) ? data : data.jobs ?? []);
        setPagination(data?.pagination ?? null);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load jobs.');
    } finally {
      setLoadingJobs(false);
    }
  }, [debouncedSearch, status, priority, sortBy, page]);

  // ── Fetch ALL jobs (unpaginated — Kanban view) ────────────────────────────
  const fetchAllJobs = useCallback(async () => {
    setLoadingKanban(true);
    try {
      const params = { limit: 1000 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status !== 'all') params.status = status;
      if (priority !== 'all') params.priority = priority;
      // Kanban has no meaningful sort, omit sortBy

      const { data } = await api.get('/api/jobs', { params });
      setKanbanJobs(Array.isArray(data) ? data : data.jobs ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load jobs.');
    } finally {
      setLoadingKanban(false);
    }
  }, [debouncedSearch, status, priority]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  // List view: fetch paginated
  useEffect(() => { if (view === 'list') fetchJobs(); }, [fetchJobs, view]);
  // Kanban view: fetch all jobs whenever view is kanban or filters change
  useEffect(() => { if (view === 'kanban') fetchAllJobs(); }, [fetchAllJobs, view]);

  // ── Delete job ─────────────────────────────────────────────────────────────
  const handleDelete = async (jobId) => {
    try {
      await api.delete(`/api/jobs/${jobId}`);
      toast.success('Application deleted.');
      if (view === 'list') fetchJobs(); else fetchAllJobs();
      fetchSummary();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete.');
    }
  };

  // ── Open edit modal ────────────────────────────────────────────────────────
  const handleEdit = (job) => {
    setEditingJob(job);
    setModalOpen(true);
  };

  // ── After save in modal ────────────────────────────────────────────────────
  const handleSaved = () => {
    if (view === 'list') fetchJobs(); else fetchAllJobs();
    fetchSummary();
  };

  // ── Close modal ────────────────────────────────────────────────────────────
  const closeModal = () => {
    setModalOpen(false);
    setEditingJob(null);
  };

  // ── View toggle button ─────────────────────────────────────────────────────
  const ViewBtn = ({ id, icon, label }) => {
    const active = view === id;
    return (
      <button
        onClick={() => setView(id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 14px',
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '0.02em',
          backgroundColor: 'transparent',
          border: active ? '1px solid #FFE500' : '1px solid #222222',
          color: active ? '#FFE500' : '#555555',
          cursor: 'pointer',
          borderRadius: '2px',
          transition: 'all 0.15s',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.borderColor = '#444444';
            e.currentTarget.style.color = '#888888';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.borderColor = '#222222';
            e.currentTarget.style.color = '#555555';
          }
        }}
      >
        {icon}
        {label}
      </button>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh' }}>
      {/* Pulse keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <Navbar />

      <main
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 24px',
        }}
      >

        {/* ── Section 1: Stats ─────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '28px',
            flexWrap: 'wrap',
          }}
        >
          <StatsCard
            label="Total Applied"
            value={summary?.totalApplications}
            loading={loadingSummary}
            icon={<Briefcase size={14} />}
          />
          <StatsCard
            label="Interviews"
            value={summary?.byStatus?.interview ?? 0}
            loading={loadingSummary}
            icon={<Users size={14} />}
          />
          <StatsCard
            label="Offers"
            value={summary?.byStatus?.offer ?? 0}
            loading={loadingSummary}
            yellow
            icon={<TrendingUp size={14} />}
          />
          <StatsCard
            label="Rejected"
            value={summary?.byStatus?.rejected ?? 0}
            loading={loadingSummary}
            icon={<XCircle size={14} />}
          />
        </div>

        {/* ── Section 2: Controls ──────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '20px',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '320px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#555555',
                pointerEvents: 'none',
              }}
            />
            <input
              className="input-field"
              style={{ paddingLeft: '32px' }}
              placeholder="Search company or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filters + Add */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status filter — List view only */}
            {view === 'list' && (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={selectStyle}
                onFocus={(e) => (e.target.style.borderColor = '#FFE500')}
                onBlur={(e) => (e.target.style.borderColor = '#222222')}
              >
                <option value="all">All Status</option>
                {['applied', 'screening', 'interview', 'offer', 'rejected', 'ghosted'].map((s) => (
                  <option key={s} value={s} style={{ backgroundColor: '#111111' }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            )}

            {/* Priority filter */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={selectStyle}
              onFocus={(e) => (e.target.style.borderColor = '#FFE500')}
              onBlur={(e) => (e.target.style.borderColor = '#222222')}
            >
              <option value="all">All Priority</option>
              {['low', 'medium', 'high'].map((p) => (
                <option key={p} value={p} style={{ backgroundColor: '#111111' }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>

            {/* Sort — List view only */}
            {view === 'list' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={selectStyle}
                onFocus={(e) => (e.target.style.borderColor = '#FFE500')}
                onBlur={(e) => (e.target.style.borderColor = '#222222')}
              >
                <option value="newest">Newest First</option>
                <option value="by_stage">By Stage</option>
              </select>
            )}

            {/* Add Job */}
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => {
                setEditingJob(null);
                setModalOpen(true);
              }}
            >
              <Plus size={14} />
              Add Job
            </button>
          </div>
        </div>

        {/* ── Section 3: View toggle ───────────────────────────────────────── */}
        <div className="flex items-center gap-2" style={{ marginBottom: '20px' }}>
          <ViewBtn id="list" icon={<List size={13} />} label="List" />
          <ViewBtn id="kanban" icon={<Columns2 size={13} />} label="Kanban" />

          {/* Total count */}
          {view === 'list' && !loadingJobs && pagination && (
            <span style={{ fontSize: '12px', color: '#444444', marginLeft: '4px' }}>
              {pagination.total} {pagination.total === 1 ? 'application' : 'applications'}
            </span>
          )}
          {view === 'list' && !loadingJobs && !pagination && (
            <span style={{ fontSize: '12px', color: '#444444', marginLeft: '4px' }}>
              {jobs.length} {jobs.length === 1 ? 'application' : 'applications'}
            </span>
          )}
          {view === 'kanban' && !loadingKanban && (
            <span style={{ fontSize: '12px', color: '#444444', marginLeft: '4px' }}>
              {kanbanJobs.length} {kanbanJobs.length === 1 ? 'application' : 'applications'}
            </span>
          )}
        </div>

        {/* ── Section 4A: List view ────────────────────────────────────────── */}
        {view === 'list' && (
          <div
            style={{
              backgroundColor: '#111111',
              border: '1px solid #222222',
              overflow: 'hidden',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
              }}
            >
              {/* Column widths */}
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '19%' }} />
              </colgroup>

              <thead>
                <tr style={{ borderBottom: '1px solid #222222' }}>
                  {['Company', 'Role', 'Status', 'Priority', 'Applied Date', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: '11px 16px',
                          textAlign: 'left',
                          fontSize: '10px',
                          fontWeight: '700',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: '#555555',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {loadingJobs
                  ? Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />)
                  : jobs.length === 0
                    ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            padding: '48px 16px',
                            textAlign: 'center',
                            color: '#333333',
                            fontSize: '13px',
                          }}
                        >
                          No applications found.{' '}
                          <button
                            onClick={() => setModalOpen(true)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#FFE500',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontFamily: 'Inter, system-ui, sans-serif',
                            }}
                          >
                            Add your first one →
                          </button>
                        </td>
                      </tr>
                    )
                    : jobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Section 4B: Kanban view ──────────────────────────────────────── */}
        {view === 'kanban' && (
          <KanbanBoard
            jobs={kanbanJobs}
            onEdit={handleEdit}
            onRefresh={() => {
              fetchAllJobs();
              fetchSummary();
            }}
          />
        )}

        {/* ── Section 5: Pagination controls (List view only) ─────────────── */}
        {view === 'list' && pagination && pagination.totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '24px',
              flexWrap: 'wrap',
            }}
          >
            {/* Previous */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'Inter, system-ui, sans-serif',
                backgroundColor: 'transparent',
                border: '1px solid #222222',
                borderRadius: '0',
                color: page === 1 ? '#333333' : '#888888',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                letterSpacing: '0.03em',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (page !== 1) e.currentTarget.style.color = '#CCCCCC';
              }}
              onMouseLeave={(e) => {
                if (page !== 1) e.currentTarget.style.color = '#888888';
              }}
            >
              Previous
            </button>

            {/* Page numbers */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  backgroundColor: 'transparent',
                  border: p === page ? '1px solid #FFE500' : '1px solid #222222',
                  borderRadius: '0',
                  color: p === page ? '#FFE500' : '#555555',
                  cursor: 'pointer',
                  minWidth: '36px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (p !== page) {
                    e.currentTarget.style.borderColor = '#444444';
                    e.currentTarget.style.color = '#888888';
                  }
                }}
                onMouseLeave={(e) => {
                  if (p !== page) {
                    e.currentTarget.style.borderColor = '#222222';
                    e.currentTarget.style.color = '#555555';
                  }
                }}
              >
                {p}
              </button>
            ))}

            {/* Page X of Y */}
            <span
              style={{
                fontSize: '12px',
                color: '#444444',
                padding: '0 8px',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              Page {page} of {pagination.totalPages}
            </span>

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              style={{
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'Inter, system-ui, sans-serif',
                backgroundColor: 'transparent',
                border: '1px solid #222222',
                borderRadius: '0',
                color: page === pagination.totalPages ? '#333333' : '#888888',
                cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer',
                letterSpacing: '0.03em',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (page !== pagination.totalPages) e.currentTarget.style.color = '#CCCCCC';
              }}
              onMouseLeave={(e) => {
                if (page !== pagination.totalPages) e.currentTarget.style.color = '#888888';
              }}
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* ── Add / Edit modal ──────────────────────────────────────────────── */}
      <AddJobModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSaved={handleSaved}
        job={editingJob}
      />
    </div>
  );
};

export default DashboardPage;
