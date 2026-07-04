import { Pencil, Trash2, ExternalLink } from 'lucide-react';

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  applied:   { label: 'Applied',   style: { border: '1px solid #444444', color: '#888888' } },
  screening: { label: 'Screening', style: { border: '1px solid #3B82F6', color: '#3B82F6' } },
  interview: { label: 'Interview', style: { border: '1px solid #FFE500', color: '#FFE500' } },
  offer:     { label: 'Offer',     style: { border: '1px solid #00CC66', color: '#00CC66' } },
  rejected:  { label: 'Rejected',  style: { border: '1px solid #FF3333', color: '#FF3333' } },
  ghosted:   { label: 'Ghosted',   style: { border: '1px solid #444444', color: '#555555' } },
};

const PRIORITY_CONFIG = {
  high:   { label: 'High',   style: { backgroundColor: '#FFE50022', border: '1px solid #FFE500', color: '#FFE500' } },
  medium: { label: 'Med',    style: { backgroundColor: '#3B82F622', border: '1px solid #3B82F6', color: '#3B82F6' } },
  low:    { label: 'Low',    style: { backgroundColor: '#22222222', border: '1px solid #444444', color: '#888888' } },
};

const badgeBase = {
  display: 'inline-block',
  fontSize: '10px',
  fontWeight: '700',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: '2px 7px',
  borderRadius: '2px',
  whiteSpace: 'nowrap',
};

// ─── Format date helper ───────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

// ─── JobCard ──────────────────────────────────────────────────────────────────
// Renders as a table <tr> row in list view.
// Props:
//   job       — job object
//   onEdit    — fn(job) → open edit modal
//   onDelete  — fn(jobId) → trigger delete

const JobCard = ({ job, onEdit, onDelete }) => {
  // ── Debug: log full job object to verify exact API field names ────────────────
  console.log('[JobCard] job →', job);

  const statusCfg   = STATUS_CONFIG[job.status]   || STATUS_CONFIG.applied;
  const priorityCfg = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.low;

  // Defensive dual-key reads — handle snake_case (API) or camelCase (legacy)
  const salaryRange = job.salary_range || job.salaryRange || null;
  const jobUrl      = job.job_url      || job.jobUrl      || null;

  const handleDelete = () => {
    if (window.confirm(`Delete application to ${job.company}? This cannot be undone.`)) {
      onDelete(job.id);
    }
  };

  return (
    <tr
      style={{
        borderBottom: '1px solid #1a1a1a',
        transition: 'background-color 0.1s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#161616')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {/* Company */}
      <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
        <div>
          <span style={{ fontWeight: '700', color: '#FFFFFF', fontSize: '14px', display: 'block' }}>
            {job.company}
          </span>
          {job.location && (
            <span style={{ fontSize: '11px', color: '#555555', marginTop: '2px', display: 'block' }}>
              {job.location}
            </span>
          )}
          {salaryRange && (
            <span style={{ fontSize: '11px', color: '#998800', marginTop: '1px', display: 'block' }}>
              {salaryRange}
            </span>
          )}
        </div>
      </td>

      {/* Role */}
      <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
        <span style={{ fontSize: '13px', color: '#888888' }}>{job.role}</span>
      </td>

      {/* Status */}
      <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
        <span style={{ ...badgeBase, ...statusCfg.style }}>{statusCfg.label}</span>
      </td>

      {/* Priority */}
      <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
        <span style={{ ...badgeBase, ...priorityCfg.style }}>{priorityCfg.label}</span>
      </td>

      {/* Date */}
      <td style={{ padding: '13px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '12px', color: '#555555', fontVariantNumeric: 'tabular-nums' }}>
          {fmtDate(job.applied_date)}
        </span>
      </td>

      {/* Actions */}
      <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
        <div className="flex items-center gap-2">
          {jobUrl && (
            <a
              href={jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open posting"
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#555555',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#888888')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#555555')}
            >
              <ExternalLink size={14} />
            </a>
          )}
          <button
            onClick={() => onEdit(job)}
            title="Edit"
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: '#555555',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '2px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFE500')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#555555')}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            title="Delete"
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: '#555555',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '2px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FF3333')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#555555')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default JobCard;
