import React, { useState } from 'react';

// JustifyModal: shows existing justifications (if provided) and lets user add a new one.
// Styled minimally but uses app color tokens where sensible.

export default function JustifyModal({ open, onClose, onSubmit, defaultReason = '', reasonTypes = ['permiso', 'vacaciones', 'baja', 'otro'], existing = [] }) {
  const [reasonType, setReasonType] = useState(reasonTypes[0] || 'otro');
  const [reasonText, setReasonText] = useState(defaultReason);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    onSubmit && onSubmit({ reasonType, reasonText });
    // do not auto-close here; parent will close when successful
  };

  return (
    <div style={styles.backdrop} role="dialog" aria-modal="true">
      <div style={styles.modal}>
        <h3 style={{ marginTop: 0 }}>Justificar fichaje</h3>

        {existing && existing.length > 0 && (
          <div style={styles.existing}>
            <strong>Justificaciones anteriores</strong>
            <ul style={{ marginTop: 8, paddingLeft: 16 }}>
              {existing.map((j) => (
                <li key={j.id} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 12, color: '#333' }}>{new Date(j.creado_en).toLocaleString()}</div>
                  <div style={{ fontSize: 13 }}>{j.motivo_tipo ? `${j.motivo_tipo} — ` : ''}{j.motivo_text}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>{j.user_agent || j.ip ? `${j.user_agent || ''} ${j.ip ? '· ' + j.ip : ''}` : ''}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={submit}>
          <div style={styles.field}>
            <label style={{ fontSize: 13, marginBottom: 6 }}>Tipo</label>
            <select value={reasonType} onChange={(e) => setReasonType(e.target.value)} style={styles.select}>
              {reasonTypes.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={{ fontSize: 13, marginBottom: 6 }}>Motivo (detallado)</label>
            <textarea value={reasonText} onChange={(e) => setReasonText(e.target.value)} rows={4} style={styles.textarea} />
          </div>
          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.btnSecondary}>Cancelar</button>
            <button type="submit" style={styles.btnPrimary}>Enviar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.4)',
    zIndex: 9999,
  },
  modal: {
    background: '#fff',
    padding: 18,
    borderRadius: 8,
    width: 540,
    maxWidth: '96%',
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)'
  },
  existing: {
    marginBottom: 10,
    maxHeight: 160,
    overflowY: 'auto',
    padding: 8,
    background: '#fafafa',
    border: '1px solid #eee',
    borderRadius: 6,
  },
  field: {
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
  },
  select: {
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #ddd'
  },
  textarea: {
    padding: 8,
    borderRadius: 6,
    border: '1px solid #ddd',
    fontFamily: 'inherit'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8
  },
  btnPrimary: {
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 6,
    cursor: 'pointer'
  },
  btnSecondary: {
    background: '#fff',
    color: '#333',
    border: '1px solid #ccc',
    padding: '8px 12px',
    borderRadius: 6,
    cursor: 'pointer'
  }
};
