// ─── StatsCard ────────────────────────────────────────────────────────────────
// Displays a single KPI metric with a label + large number.
// Props:
//   label    — muted caps label
//   value    — numeric value (or null while loading)
//   loading  — show animated skeleton when true
//   yellow   — if true, renders the value in brand yellow (#FFE500)
//   icon     — optional lucide-react element to decorate the card

const StatsCard = ({ label, value, loading = false, yellow = false, icon }) => {
  return (
    <div
      style={{
        backgroundColor: '#111111',
        border: '1px solid #222222',
        padding: '20px',
        flex: '1 1 0%',
        minWidth: '0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle accent line on top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          backgroundColor: yellow ? '#FFE500' : '#222222',
          transition: 'background-color 0.2s',
        }}
      />

      {/* Label row */}
      <div className="flex items-center justify-between mb-3">
        <span className="label">{label}</span>
        {icon && (
          <span style={{ color: '#444444', display: 'flex' }}>{icon}</span>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div
          style={{
            height: '36px',
            width: '60%',
            backgroundColor: '#1a1a1a',
            borderRadius: '2px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ) : (
        <p
          style={{
            fontSize: '2rem',
            fontWeight: '900',
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: yellow ? '#FFE500' : '#FFFFFF',
            transition: 'color 0.2s',
          }}
        >
          {value ?? '—'}
        </p>
      )}

      {/* Pulse keyframes injected inline via a style tag trick — handled globally */}
    </div>
  );
};

export default StatsCard;
