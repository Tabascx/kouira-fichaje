import React, { useState } from 'react';

// A lightweight modal component for justifying an entry/exit/pause.
// Does not include styling framework — keep minimal so it can be integrated into the app's UI library.

export default function JustifyModal({ open, onClose, onSubmit, defaultReason = '', reasonTypes = ['permiso', 'vacaciones', 'baja', 'otro'] }) {
  const [reasonType, setReasonType] = useState(reasonTypes[0] || 'otro');
  const [reasonText, setReasonText] = useState(defaultReason);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    onSubmit && onSubmit({ reasonType, reasonText });
    onClose && onClose();
  };

  return (
    <div style={styles.backdrop} role="dialog" aria-modal="true">
      <div style={styles.modal}>
        <h3>Justificar</h3>
        <form onSubmit={submit}>
          <div style={styles.field}>
            <label>Tipo</label>
            <select value={reasonType} onChange={(e) => setReasonType(e.target.value)}>
              {reasonTypes.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label>Motivo (detallado)</label>
            <textarea value={reasonText} onChange={(e) => setReasonText(e.target.value)} rows={4} />
          </div>
          <div style={styles.actions}>
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit">Enviar</button>
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
    padding: 16,
    borderRadius: 6,
    width: 480,
    maxWidth: '95%',
  },
  field: {
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
  },
};
