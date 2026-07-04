import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import api from '../api/axios';

// ─── Column definitions ───────────────────────────────────────────────────────
const COLUMNS = [
  { id: 'applied',   label: 'Applied',   color: '#888888', accent: '#444444' },
  { id: 'screening', label: 'Screening', color: '#3B82F6', accent: '#3B82F6' },
  { id: 'interview', label: 'Interview', color: '#FFE500', accent: '#FFE500' },
  { id: 'offer',     label: 'Offer',     color: '#00CC66', accent: '#00CC66' },
  { id: 'rejected',  label: 'Rejected',  color: '#FF3333', accent: '#FF3333' },
  { id: 'ghosted',   label: 'Ghosted',   color: '#555555', accent: '#444444' },
];

const PRIORITY_CONFIG = {
  high:   { label: 'High', style: { border: '1px solid #FFE500', color: '#FFE500' } },
  medium: { label: 'Med',  style: { border: '1px solid #3B82F6', color: '#3B82F6' } },
  low:    { label: 'Low',  style: { border: '1px solid #444444', color: '#666666' } },
};

const badgeBase = {
  display: 'inline-block',
  fontSize: '9px',
  fontWeight: '700',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: '2px 6px',
  borderRadius: '2px',
};

const fmtDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
};

// ─── Single Kanban card ───────────────────────────────────────────────────────
// Uses job.id (string) as draggableId — job.id is what the REST API returns.
const KanbanCard = ({ job, index, onEdit }) => {
  const priorityCfg = PRIORITY_CONFIG[job.priority] || PRIORITY_CONFIG.low;

  // draggableId MUST be a string
  const draggableId = String(job.id);

  return (
    <Draggable draggableId={draggableId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onEdit(job)}
          style={{
            // Merge DnD position styles first, then our overrides
            ...provided.draggableProps.style,
            backgroundColor: snapshot.isDragging ? '#1a1a1a' : '#0F0F0F',
            border: snapshot.isDragging ? '1px solid #FFE500' : '1px solid #1e1e1e',
            padding: '12px',
            marginBottom: '8px',
            borderRadius: '2px',
            cursor: snapshot.isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            transition: snapshot.isDragging
              ? 'none'
              : 'border-color 0.15s, background-color 0.15s',
            boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.6)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (!snapshot.isDragging) {
              e.currentTarget.style.borderColor = '#333333';
              e.currentTarget.style.backgroundColor = '#141414';
            }
          }}
          onMouseLeave={(e) => {
            if (!snapshot.isDragging) {
              e.currentTarget.style.borderColor = '#1e1e1e';
              e.currentTarget.style.backgroundColor = '#0F0F0F';
            }
          }}
        >
          {/* Company */}
          <p style={{
            fontWeight: '700',
            color: '#FFFFFF',
            fontSize: '13px',
            marginBottom: '2px',
            lineHeight: 1.3,
          }}>
            {job.company}
          </p>
          {/* Role */}
          <p style={{
            fontSize: '12px',
            color: '#666666',
            marginBottom: '10px',
            lineHeight: 1.3,
          }}>
            {job.role}
          </p>
          {/* Footer row — priority badge + date */}
          <div className="flex items-center justify-between">
            <span style={{ ...badgeBase, ...priorityCfg.style }}>
              {priorityCfg.label}
            </span>
            {fmtDate(job.applied_date) && (
              <span style={{ fontSize: '10px', color: '#444444' }}>
                {fmtDate(job.applied_date)}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

// ─── KanbanBoard ──────────────────────────────────────────────────────────────
// Props:
//   jobs      — array of all job objects from the API
//   onEdit    — fn(job) → open edit modal
//   onRefresh — fn() → re-fetch jobs + summary after a status change

const KanbanBoard = ({ jobs, onEdit, onRefresh }) => {
  // Group jobs into columns by status
  const columns = COLUMNS.map((col) => ({
    ...col,
    jobs: jobs.filter((j) => j.status === col.id),
  }));

  // ── onDragEnd ──────────────────────────────────────────────────────────────
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside any column
    if (!destination) return;

    // Dropped back into the same column — no status change needed
    if (destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;

    try {
      await api.put(`/api/jobs/${draggableId}/status`, { status: newStatus });
      toast.success(`Moved to ${newStatus}`);
      onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(200px, 1fr))',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '16px',
          minHeight: '400px',
        }}
      >
        {columns.map((col) => (
          <div
            key={col.id}
            style={{
              backgroundColor: '#0D0D0D',
              border: '1px solid #1a1a1a',
              borderRadius: '2px',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '300px',
            }}
          >
            {/* Column header */}
            <div
              style={{
                padding: '12px 12px 10px',
                borderBottom: '1px solid #1a1a1a',
                position: 'relative',
              }}
            >
              {/* Coloured accent bar at very top of column */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: col.accent,
                }}
              />
              <div
                className="flex items-center justify-between"
                style={{ marginTop: '2px' }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: col.color,
                  }}
                >
                  {col.label}
                </span>
                <span
                  style={{
                    backgroundColor: '#1a1a1a',
                    color: '#666666',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '1px 6px',
                    borderRadius: '2px',
                    minWidth: '20px',
                    textAlign: 'center',
                  }}
                >
                  {col.jobs.length}
                </span>
              </div>
            </div>

            {/* Droppable zone — MUST have provided.innerRef + provided.droppableProps + provided.placeholder */}
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: snapshot.isDraggingOver ? '#111111' : 'transparent',
                    transition: 'background-color 0.15s',
                    minHeight: '100px',
                  }}
                >
                  {col.jobs.map((job, index) => (
                    <KanbanCard
                      key={String(job.id)}
                      job={job}
                      index={index}
                      onEdit={onEdit}
                    />
                  ))}

                  {/* placeholder MUST be inside the Droppable div — required by @hello-pangea/dnd */}
                  {provided.placeholder}

                  {/* Empty column hint */}
                  {col.jobs.length === 0 && !snapshot.isDraggingOver && (
                    <p
                      style={{
                        fontSize: '11px',
                        color: '#2a2a2a',
                        textAlign: 'center',
                        paddingTop: '20px',
                        userSelect: 'none',
                      }}
                    >
                      Drop here
                    </p>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
