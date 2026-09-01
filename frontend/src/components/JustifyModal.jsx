import React, { useState, useEffect, useRef } from 'react';

// JustifyModal: uses shared modal styles from Panel.css and specific classes for content
export default function JustifyModal({ open, onClose, onSubmit, defaultReason = '', reasonTypes = ['pausa', 'descanso', 'otro'], existing = [] }) {
  const [reasonType, setReasonType] = useState(reasonTypes[0] || 'pausa');
  const [reasonText, setReasonText] = useState(defaultReason);
  const cardRef = useRef(null);

  useEffect(() => {
    setReasonType(reasonTypes[0] || 'pausa');
    setReasonText(defaultReason || '');
  }, [reasonTypes, defaultReason]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    onSubmit && onSubmit({ reasonType, reasonText });
    // parent will close on success
  };

  const onBackdropClick = (e) => {
    // close if clicking the backdrop (not the card)
    if (e.target === e.currentTarget) onClose && onClose();
  };

  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-labelledby="justify-title" onClick={onBackdropClick}>
      <div className="modal-card" ref={cardRef} role="document">
        <button aria-label="Cerrar" className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-titulo" id="justify-title">Pausa / descanso del fichaje</div>
        <p className="modal-desc">Se usa para dejar constancia de una pausa o descanso dentro de la jornada. No es una baja ni una ausencia.</p>

        {existing && existing.length > 0 && (
          <div className="justificaciones-list">
            <strong style={{ display: 'block', marginBottom: 8 }}>Justificaciones anteriores</strong>
            <ul>
              {existing.map((j) => (
                <li key={j.id} className="justificacion-item">
                  <div className="justificacion-meta">{new Date(j.creado_en).toLocaleString()}</div>
                  <div className="justificacion-text">{j.motivo_tipo ? `${j.motivo_tipo} — ` : ''}{j.motivo_text}</div>
                  <div className="justificacion-meta small">{j.user_agent || j.ip ? `${j.user_agent || ''}${j.ip ? ' · ' + j.ip : ''}` : ''}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-field">
            <label className="form-label">Tipo de pausa</label>
            <select className="form-select" value={reasonType} onChange={(e) => setReasonType(e.target.value)} autoFocus>
              {reasonTypes.map((r) => <option key={r} value={r}>{r === 'pausa' ? 'Pausa' : r === 'descanso' ? 'Descanso' : 'Otro'}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Detalle opcional</label>
            <textarea className="form-input" value={reasonText} onChange={(e) => setReasonText(e.target.value)} rows={4} placeholder="Ej.: Pausa de 15 minutos para descanso del trabajador." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn-mini" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-nuevo">Enviar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
