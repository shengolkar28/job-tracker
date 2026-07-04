import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['applied', 'screening', 'interview', 'offer', 'rejected', 'ghosted'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

const EMPTY_FORM = {
  company: '',
  role: '',
  status: 'applied',
  priority: 'medium',
  appliedDate: '',
  location: '',
  salaryRange: '',
  jobUrl: '',
  notes: '',
};

// ─── Field style helpers ──────────────────────────────────────────────────────
const fieldStyle = {
  width: '100%',
  backgroundColor: '#0A0A0A',
  border: '1px solid #222222',
  color: '#FFFFFF',
  fontSize: '14px',
  padding: '8px 12px',
  outline: 'none',
  borderRadius: '2px',
  transition: 'border-color 0.15s',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#888888',
  marginBottom: '6px',
};

// ─── AddJobModal ──────────────────────────────────────────────────────────────
// Props:
//   isOpen   — boolean
//   onClose  — fn()
//   onSaved  — fn() called after successful add/edit to trigger list refresh
//   job      — if provided, opens in "edit" mode with pre-filled data

const AddJobModal = ({ isOpen, onClose, onSaved, job = null }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(job);

  // ── Pre-fill form when editing ─────────────────────────────────────────────
  useEffect(() => {
    if (job) {
      // ── API returns snake_case; map every field explicitly ─────────────────
      console.log('[AddJobModal] editing job object →', job);
      setForm({
        company:     job.company      || '',
        role:        job.role         || '',
        status:      job.status       || 'applied',
        priority:    job.priority     || 'medium',
        // applied_date arrives as ISO string from API; slice to YYYY-MM-DD so
        // the <input type="date"> can display it correctly.
        appliedDate: job.applied_date
          ? new Date(job.applied_date).toISOString().split('T')[0]
          : '',
        location:    job.location     || '',
        salaryRange: job.salary_range || '',
        jobUrl:      job.job_url      || '',
        notes:       job.notes        || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [job, isOpen]);

  // ── Trap focus / close on Escape ───────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      toast.error('Company and Role are required.');
      return;
    }

    setSubmitting(true);
    try {
      // ── Build payload with explicit YYYY-MM-DD date formatting ────────────
      // HTML date inputs store their value as YYYY-MM-DD internally, but we
      // run it through Date() + toISOString() to guarantee the format is
      // correct and guard against any edge-case browser behaviour.
      let formattedDate = null;
      if (form.appliedDate) {
        const parsed = new Date(form.appliedDate);
        // new Date('YYYY-MM-DD') is parsed as UTC midnight, so toISOString()
        // will always give back the same calendar date.
        formattedDate = isNaN(parsed.getTime())
          ? null
          : parsed.toISOString().split('T')[0];
      }

      const payload = {
        company:       form.company,
        role:          form.role,
        status:        form.status,
        priority:      form.priority,
        location:      form.location,
        salary_range:  form.salaryRange,   // backend expects snake_case
        job_url:       form.jobUrl,        // backend expects snake_case
        notes:         form.notes,
        // applied_date already snake_case; omit entirely if blank
        ...(formattedDate ? { applied_date: formattedDate } : {}),
      };

      // ── Debug: log full payload before sending ────────────────────────────
      console.log('[AddJobModal] payload →', JSON.stringify(payload, null, 2));

      if (isEdit) {
        // Backend uses `id` (not `_id`) — log to confirm
        console.log('[AddJobModal] PUT job id →', job.id, '| full job →', job);
        await api.put(`/api/jobs/${job.id}`, payload);
        toast.success('Application updated!');
      } else {
        await api.post('/api/jobs', payload);
        toast.success('Application added!');
      }

      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#111111',
          border: '1px solid #222222',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          position: 'relative',
          borderRadius: '2px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.03em', color: '#FFFFFF', margin: 0 }}>
            {isEdit ? 'Edit Application' : 'Add Application'}
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #222222',
              color: '#888888',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '2px',
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
            <X size={14} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #222222', marginBottom: '20px' }} />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '16px' }}>

            {/* Company + Role */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Company *</label>
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Google"
                  required
                  style={fieldStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#FFE500')}
                  onBlur={(e) => (e.target.style.borderColor = '#222222')}
                />
              </div>
              <div>
                <label style={labelStyle}>Role *</label>
                <input
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  placeholder="Software Engineer"
                  required
                  style={fieldStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#FFE500')}
                  onBlur={(e) => (e.target.style.borderColor = '#222222')}
                />
              </div>
            </div>

            {/* Status + Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={fieldStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#FFE500')}
                  onBlur={(e) => (e.target.style.borderColor = '#222222')}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} style={{ backgroundColor: '#111111' }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  style={fieldStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#FFE500')}
                  onBlur={(e) => (e.target.style.borderColor = '#222222')}
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p} style={{ backgroundColor: '#111111' }}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Applied Date + Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Applied Date</label>
                <input
                  type="date"
                  name="appliedDate"
                  value={form.appliedDate}
                  onChange={handleChange}
                  style={{ ...fieldStyle, colorScheme: 'dark' }}
                  onFocus={(e) => (e.target.style.borderColor = '#FFE500')}
                  onBlur={(e) => (e.target.style.borderColor = '#222222')}
                />
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Remote / NYC"
                  style={fieldStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#FFE500')}
                  onBlur={(e) => (e.target.style.borderColor = '#222222')}
                />
              </div>
            </div>

            {/* Salary Range + Job URL */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Salary Range</label>
                <input
                  name="salaryRange"
                  value={form.salaryRange}
                  onChange={handleChange}
                  placeholder="$120k – $150k"
                  style={fieldStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#FFE500')}
                  onBlur={(e) => (e.target.style.borderColor = '#222222')}
                />
              </div>
              <div>
                <label style={labelStyle}>Job URL</label>
                <input
                  name="jobUrl"
                  value={form.jobUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  style={fieldStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#FFE500')}
                  onBlur={(e) => (e.target.style.borderColor = '#222222')}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Recruiter name, referral, next steps..."
                style={{ ...fieldStyle, resize: 'vertical', lineHeight: '1.5' }}
                onFocus={(e) => (e.target.style.borderColor = '#FFE500')}
                onBlur={(e) => (e.target.style.borderColor = '#222222')}
              />
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #222222', margin: '20px 0' }} />

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJobModal;
