import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './Panel.css';
import { t, getLang, setLang } from '../i18n';

export default function PanelAdmin() {
  const { logout } = useAuth();
  const [tab, setTab]                   = useState('hoy');
  const [fichajesHoy, setFichajesHoy]   = useState([]);
  const [resumen, setResumen]           = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [ausencias, setAusencias]       = useState([]);
  const [nuevoForm, setNuevoForm]       = useState({ nombre: '', username: '', password: '' });
  const [msgNuevo, setMsgNuevo]         = useState(null);
  const [modalAusencia, setModalAusencia] = useState(null); // { usuario_id, nombre }
  const [formAusencia, setFormAusencia]   = useState({ fecha: '', justificada: false, motivo_tipo: '', motivo: '' });
  const [resetInfo, setResetInfo]        = useState(null);
  const [modalFichajeManual, setModalFichajeManual] = useState(false);
  const [formFichajeManual, setFormFichajeManual] = useState({ usuario_id: '', tipo: 'entrada', fecha_hora: '' });
  const motivoOptions = [
    { value: '', label: t('motivo') },
    { value: 'baja_medica', label: t('baja_medica') },
    { value: 'vacaciones', label: t('vacaciones') },
    { value: 'permiso', label: t('permiso') },
    { value: 'otro', label: t('otro') },
  ];
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });

  const cargarHoy = useCallback(async () => {
    try { const { data } = await api.get('/fichajes/hoy'); setFichajesHoy(data); } catch {}
  }, []);

  const cargarResumen = useCallback(async () => {
    try { const { data } = await api.get(`/fichajes/resumen?mes=${mesSeleccionado}`); setResumen(data); } catch {}
  }, [mesSeleccionado]);

  const cargarTrabajadores = useCallback(async () => {
    try { const { data } = await api.get('/trabajadores'); setTrabajadores(data); } catch {}
  }, []);

  const cargarAusencias = useCallback(async () => {
    try { const { data } = await api.get(`/ausencias?mes=${mesSeleccionado}`); setAusencias(data); } catch {}
  }, [mesSeleccionado]);

  useEffect(() => {
    if (tab === 'hoy')          cargarHoy();
    if (tab === 'resumen')      cargarResumen();
    if (tab === 'trabajadores') cargarTrabajadores();
    if (tab === 'ausencias')    cargarAusencias();
  }, [tab, cargarHoy, cargarResumen, cargarTrabajadores, cargarAusencias]);

  const crearTrabajador = async (e) => {
    e.preventDefault();
    setMsgNuevo(null);
    try {
      await api.post('/trabajadores', nuevoForm);
      setMsgNuevo({ tipo: 'ok', texto: `${t('crear_trabajador_exito')}: "${nuevoForm.nombre}"` });
      setNuevoForm({ nombre: '', username: '', password: '' });
      cargarTrabajadores();
    } catch (err) {
      setMsgNuevo({ tipo: 'error', texto: err.response?.data?.error || t('error_crear_trabajador') });
    }
  };

  const guardarAusencia = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ausencias', { usuario_id: modalAusencia.usuario_id, ...formAusencia });
      setModalAusencia(null);
      setFormAusencia({ fecha: '', justificada: false, motivo_tipo: '', motivo: '' });
      cargarAusencias();
    } catch (err) {
      alert(err.response?.data?.error || t('error_guardar_ausencia'));
    }
  };

  const toggleJustificada = async (ausencia) => {
    try {
      await api.put(`/ausencias/${ausencia.id}`, { justificada: !ausencia.justificada, motivo: ausencia.motivo });
      cargarAusencias();
    } catch {}
  };

  const eliminarAusencia = async (id) => {
    if (!window.confirm(t('confirmar_eliminar_ausencia'))) return;
    try { await api.delete(`/ausencias/${id}`); cargarAusencias(); } catch {}
  };

  const resetPassword = async (trabajador) => {
    if (!window.confirm(t('confirmar_restablecer_pass'))) return;
    try {
      const { data } = await api.post(`/trabajadores/${trabajador.id}/reset-password`);
      setResetInfo({ nombre: trabajador.nombre, tempPassword: data.tempPassword });
      cargarTrabajadores();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const copiarPasswordTemporal = async () => {
    if (!resetInfo?.tempPassword) return;
    try {
      await navigator.clipboard.writeText(resetInfo.tempPassword);
      alert(t('copiada'));
    } catch {
      alert(resetInfo.tempPassword);
    }
  };

  const crearFichajeManual = async (e) => {
    e.preventDefault();
    if (!formFichajeManual.usuario_id || !formFichajeManual.fecha_hora) {
      alert(t('error_registrar'));
      return;
    }
    try {
      await api.post('/fichajes/manual', {
        usuario_id: Number(formFichajeManual.usuario_id),
        tipo: formFichajeManual.tipo,
        fecha_hora: formFichajeManual.fecha_hora,
      });
      setModalFichajeManual(false);
      setFormFichajeManual({ usuario_id: '', tipo: 'entrada', fecha_hora: '' });
      cargarHoy();
    } catch (err) {
      alert(err.response?.data?.error || t('error_registrar'));
    }
  };

  const eliminarFichaje = async (id) => {
    if (!window.confirm(t('confirmar_eliminar_fichaje'))) return;
    try {
      await api.delete(`/fichajes/${id}`);
      cargarHoy();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const descargar = async (formato, usuario_id, nombre) => {
    try {
      const { data: blob } = await api.get(`/exportar/${formato}?usuario_id=${usuario_id}&mes=${mesSeleccionado}`, {
        responseType: 'blob',
      });
      const enlace = document.createElement('a');
      enlace.href  = URL.createObjectURL(blob);
      enlace.download = `fichajes_${nombre.replace(/ /g, '_')}_${mesSeleccionado}.${formato === 'excel' ? 'xlsx' : 'pdf'}`;
      enlace.click();
      URL.revokeObjectURL(enlace.href);
    } catch (err) { alert(`${t('error_descarga')}: ${err.message}`); }
  };

  const formatHora  = (iso) => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const formatFecha = (iso) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="panel-fondo">
      <div className="panel-wrap">

        <div className="cabecera">
          <div>
            <div className="cabecera-empresa">🏭 {t('empresa')}</div>
            <div className="cabecera-nombre">{t('panel_admin')}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={getLang()} onChange={(e) => setLang(e.target.value)}>
              <option value="es">ES</option>
              <option value="ar">AR</option>
            </select>
            <button className="btn-logout" onClick={logout}>{t('salir') || 'Salir'}</button>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'hoy'          ? 'activo' : ''}`} onClick={() => setTab('hoy')}>{t('hoy')}</button>
          <button className={`tab ${tab === 'resumen'      ? 'activo' : ''}`} onClick={() => setTab('resumen')}>{t('resumen')}</button>
          <button className={`tab ${tab === 'ausencias'    ? 'activo' : ''}`} onClick={() => setTab('ausencias')}>{t('ausencias')}</button>
          <button className={`tab ${tab === 'trabajadores' ? 'activo' : ''}`} onClick={() => setTab('trabajadores')}>{t('equipo')}</button>
        </div>

        {/* HOY */}
         {tab === 'hoy' && (
           <div className="seccion">
             <div className="seccion-titulo">
               {t('fichajes_hoy')} — {new Date().toLocaleDateString(getLang() === 'ar' ? 'ar' : 'es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
             </div>
             <button className="btn-login" style={{ marginBottom: 12, width: '100%' }} onClick={() => setModalFichajeManual(true)}>
               + {t('fichaje_manual')}
             </button>
             {fichajesHoy.length === 0 ? <div className="vacio">{t('sin_fichajes_hoy')}</div> : (
               <div className="tabla-wrap">
                 {fichajesHoy.map((f) => (
                   <div key={f.id} className="fila-fichaje">
                     <span className="fila-nombre">{f.nombre}</span>
                     <span className={`fila-tipo ${f.tipo}`}>{t(f.tipo)}</span>
                     <span className="fila-hora">{formatHora(f.fecha_hora)}</span>
                     <button className="btn-mini rojo" onClick={() => eliminarFichaje(f.id)}>✕</button>
                   </div>
                 ))}
               </div>
             )}
           </div>
         )}

        {/* RESUMEN */}
        {tab === 'resumen' && (
          <div className="seccion">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="seccion-titulo" style={{ margin: 0 }}>{t('resumen_mensual')}</div>
              <input type="month" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)}
                style={{ border: '1px solid #ddd', borderRadius: 6, padding: '4px 8px', fontSize: 13 }} />
            </div>
            {resumen.length === 0 ? <div className="vacio">{t('sin_datos_mes')}</div> : (
              <div className="tabla-wrap">
                <div className="fila-fichaje cabecera-tabla">
                  <span className="fila-nombre">{t('usuario')}</span>
                  <span style={{ minWidth: 36 }}>{t('dias')}</span>
                  <span style={{ minWidth: 130 }}></span>
                </div>
                {resumen.filter(r => r.nombre !== 'Administrador').map((r) => (
                  <div key={r.id} className="fila-fichaje">
                    <span className="fila-nombre">{r.nombre}</span>
                    <span className="fila-hora">{r.dias_trabajados}</span>
                    <div className="btns-exportar">
                      <button className="btn-exportar excel" onClick={() => descargar('excel', r.id, r.nombre)}>⬇ Excel</button>
                      <button className="btn-exportar pdf"   onClick={() => descargar('pdf',   r.id, r.nombre)}>⬇ PDF</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUSENCIAS */}
        {tab === 'ausencias' && (
          <div className="seccion">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="seccion-titulo" style={{ margin: 0 }}>{t('ausencias')}</div>
              <input type="month" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)}
                style={{ border: '1px solid #ddd', borderRadius: 6, padding: '4px 8px', fontSize: 13 }} />
            </div>

            {/* Botones para registrar ausencia por trabajador */}
            <div className="seccion-titulo" style={{ marginBottom: 8 }}>{t('registrar_nueva_ausencia')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {trabajadores.filter(t => t.rol === 'trabajador' && t.activo).map(trab => (
                <div key={trab.id} style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-trabajador"
                    onClick={() => { setModalAusencia({ usuario_id: trab.id, nombre: trab.nombre }); setFormAusencia({ fecha: new Date().toISOString().slice(0,10), justificada: false, motivo_tipo: '', motivo: '' }); }}>
                    + {trab.nombre.split(' ')[0]}
                  </button>
                </div>
              ))}
            </div>

            {/* Lista de ausencias del mes */}
            {ausencias.length === 0 ? <div className="vacio">{t('sin_datos')}</div> : (
              <div className="tabla-wrap">
                {ausencias.map((a) => (
                  <div key={a.id} className="fila-fichaje" style={{ flexWrap: 'wrap', gap: 6 }}>
                    <span className="fila-nombre">{a.nombre}</span>
                    <span className="fila-hora">{formatFecha(a.fecha)}</span>
                    <span className={`fila-tipo ${a.justificada ? 'entrada' : 'salida'}`}>
                      {a.justificada ? t('justificada') : t('injustificada')}
                    </span>
                    {a.motivo && <span style={{ fontSize: 12, color: '#888', flex: '1 1 100%', paddingLeft: 4 }}>📝 {a.motivo}</span>}
                    <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                      <button className="btn-mini" onClick={() => toggleJustificada(a)}>
                        {a.justificada ? t('marcar_injusta') : t('justificar_btn')}
                      </button>
                      <button className="btn-mini rojo" onClick={() => eliminarAusencia(a.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRABAJADORES */}
        {tab === 'trabajadores' && (
          <div className="seccion">
            <div className="seccion-titulo">{t('trabajadores_lista')}</div>
            <div className="tabla-wrap" style={{ marginBottom: 20 }}>
              {trabajadores.map((trab) => (
                <div key={trab.id} className="fila-fichaje" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="fila-nombre">{trab.nombre}</span>
                  <span className="fila-hora" style={{ color: '#888' }}>{trab.username}</span>
                  <span className={`fila-tipo ${trab.activo ? 'entrada' : 'salida'}`}>{trab.activo ? t('activo') : t('inactivo')}</span>
                  <button className="btn-mini" onClick={() => resetPassword(trab)}>{t('restablecer_pass')}</button>
                </div>
              ))}
            </div>
            {resetInfo && (
              <div className="reset-info">
                <div className="reset-info-titulo">{t('contrasena_temporal_lista')} — {resetInfo.nombre}</div>
                <p className="reset-info-texto">{t('restablecer_info')}</p>
                <div className="reset-info-codigo">
                  <code>{resetInfo.tempPassword}</code>
                  <button className="btn-mini" onClick={copiarPasswordTemporal}>{t('copiar')}</button>
                </div>
              </div>
            )}
            <div className="seccion-titulo">{t('crear_trabajador')}</div>
            <form onSubmit={crearTrabajador} className="form-nuevo">
              <input placeholder={t('nombre_completo')} value={nuevoForm.nombre} onChange={(e) => setNuevoForm({ ...nuevoForm, nombre: e.target.value })} required />
              <input placeholder={t('usuario')} value={nuevoForm.username} onChange={(e) => setNuevoForm({ ...nuevoForm, username: e.target.value })} required />
              <input type="password" placeholder={t('contrasena_inicial')} value={nuevoForm.password} onChange={(e) => setNuevoForm({ ...nuevoForm, password: e.target.value })} required />
              {msgNuevo && <div className={`alerta ${msgNuevo.tipo}`}>{msgNuevo.texto}</div>}
              <button type="submit" className="btn-login">{t('crear_trabajador')}</button>
            </form>
          </div>
        )}

        {/* MODAL FICHAJE MANUAL */}
         {modalFichajeManual && (
           <div className="modal-fondo" onClick={() => setModalFichajeManual(false)}>
             <div className="modal-card" onClick={(e) => e.stopPropagation()}>
               <div className="seccion-titulo">{t('fichaje_manual')}</div>
               <form onSubmit={crearFichajeManual} className="form-nuevo">
                 <label style={{ fontSize: 12, color: '#555' }}>{t('usuario_del_fichaje')}</label>
                 <select value={formFichajeManual.usuario_id} onChange={(e) => setFormFichajeManual({ ...formFichajeManual, usuario_id: e.target.value })} required>
                   <option value="">— {t('usuario')} —</option>
                   {trabajadores.filter(trab => trab.rol === 'trabajador').map(trab => (
                     <option key={trab.id} value={trab.id}>{trab.nombre}</option>
                   ))}
                 </select>
                 <label style={{ fontSize: 12, color: '#555' }}>Tipo</label>
                 <select value={formFichajeManual.tipo} onChange={(e) => setFormFichajeManual({ ...formFichajeManual, tipo: e.target.value })}>
                   <option value="entrada">{t('entrada')}</option>
                   <option value="salida">{t('salida')}</option>
                 </select>
                 <label style={{ fontSize: 12, color: '#555' }}>{t('hora_fichaje')}</label>
                 <input type="datetime-local" value={formFichajeManual.fecha_hora} onChange={(e) => setFormFichajeManual({ ...formFichajeManual, fecha_hora: e.target.value })} required />
                 <div style={{ display: 'flex', gap: 8 }}>
                   <button type="button" className="btn-logout" style={{ flex: 1 }} onClick={() => setModalFichajeManual(false)}>{t('cancelar')}</button>
                   <button type="submit" className="btn-login" style={{ flex: 1 }}>{t('crear_fichaje_manual')}</button>
                 </div>
               </form>
             </div>
           </div>
         )}

         {/* MODAL AUSENCIA */}
        {modalAusencia && (
          <div className="modal-fondo" onClick={() => setModalAusencia(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="seccion-titulo">{t('registrar_ausencia')} — {modalAusencia.nombre}</div>
              <form onSubmit={guardarAusencia} className="form-nuevo">
                <label style={{ fontSize: 12, color: '#555' }}>{t('fecha')}</label>
                <input type="date" value={formAusencia.fecha} onChange={(e) => setFormAusencia({ ...formAusencia, fecha: e.target.value })} required />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={formAusencia.justificada} onChange={(e) => {
                    // autocompletar motivo_tipo al marcar justificada (ejemplo: baja_medica)
                    const checked = e.target.checked;
                    setFormAusencia({ ...formAusencia, justificada: checked, motivo_tipo: checked && !formAusencia.motivo_tipo ? 'baja_medica' : formAusencia.motivo_tipo });
                  }} />
                  {t('ausencia_justificada')}
                </label>
                <select value={formAusencia.motivo_tipo} onChange={(e) => setFormAusencia({ ...formAusencia, motivo_tipo: e.target.value })}>
                  {motivoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input placeholder={t('motivo')} value={formAusencia.motivo} onChange={(e) => setFormAusencia({ ...formAusencia, motivo: e.target.value })} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn-logout" style={{ flex: 1 }} onClick={() => setModalAusencia(null)}>{t('cancelar')}</button>
                  <button type="submit" className="btn-login" style={{ flex: 1 }}>{t('guardar')}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
