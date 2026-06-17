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
  const [modalAusencia, setModalAusencia]           = useState(null);
  const [formAusencia, setFormAusencia]             = useState({ fecha: '', justificada: false, motivo_tipo: '', motivo: '' });
  const [resetInfo, setResetInfo]                   = useState(null);
  const [modalFichajeManual, setModalFichajeManual] = useState(false);
  const [formFichajeManual, setFormFichajeManual]   = useState({ usuario_id: '', tipo: 'entrada', fecha_hora: '' });
  const [modalEditar, setModalEditar]               = useState(null);
  const [formEditar, setFormEditar]                 = useState({ nombre: '', username: '' });
  const [lang, setLangState]                        = useState(getLang());

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

  const cargarHoy          = useCallback(async () => { try { const { data } = await api.get('/fichajes/hoy'); setFichajesHoy(data); } catch {} }, []);
  const cargarResumen      = useCallback(async () => { try { const { data } = await api.get(`/fichajes/resumen?mes=${mesSeleccionado}`); setResumen(data); } catch {} }, [mesSeleccionado]);
  const cargarTrabajadores = useCallback(async () => { try { const { data } = await api.get('/trabajadores'); setTrabajadores(data); } catch {} }, []);
  const cargarAusencias    = useCallback(async () => { try { const { data } = await api.get(`/ausencias?mes=${mesSeleccionado}`); setAusencias(data); } catch {} }, [mesSeleccionado]);

  useEffect(() => { cargarTrabajadores(); }, [cargarTrabajadores]);
  useEffect(() => {
    if (tab === 'hoy')       cargarHoy();
    if (tab === 'resumen')   cargarResumen();
    if (tab === 'ausencias') cargarAusencias();
  }, [tab, cargarHoy, cargarResumen, cargarAusencias]);

  const cambiarLang = (l) => { setLang(l); setLangState(l); };

  const crearTrabajador = async (e) => {
    e.preventDefault();
    setMsgNuevo(null);
    try {
      await api.post('/trabajadores', nuevoForm);
      setMsgNuevo({ tipo: 'ok', texto: `Trabajador "${nuevoForm.nombre}" creado correctamente` });
      setNuevoForm({ nombre: '', username: '', password: '' });
      cargarTrabajadores();
    } catch (err) {
      setMsgNuevo({ tipo: 'error', texto: err.response?.data?.error || 'Error al crear trabajador' });
    }
  };

  const abrirEditar = (trab) => {
    setModalEditar(trab);
    setFormEditar({ nombre: trab.nombre, username: trab.username });
  };

  const guardarEditar = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/trabajadores/${modalEditar.id}`, formEditar);
      setModalEditar(null);
      cargarTrabajadores();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al editar');
    }
  };

  const eliminarTrabajador = async (trab) => {
    if (!window.confirm(`¿Eliminar a ${trab.nombre}?\n\nSe borrarán todos sus fichajes y ausencias. Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/trabajadores/${trab.id}`);
      cargarTrabajadores();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const toggleActivo = async (trab) => {
    try {
      await api.put(`/trabajadores/${trab.id}`, { activo: !trab.activo });
      cargarTrabajadores();
    } catch {}
  };

  const guardarAusencia = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ausencias', { usuario_id: modalAusencia.usuario_id, ...formAusencia });
      setModalAusencia(null);
      setFormAusencia({ fecha: '', justificada: false, motivo_tipo: '', motivo: '' });
      cargarAusencias();
    } catch (err) { alert(err.response?.data?.error || 'Error al guardar ausencia'); }
  };

  const toggleJustificada = async (ausencia) => {
    try { await api.put(`/ausencias/${ausencia.id}`, { justificada: !ausencia.justificada, motivo: ausencia.motivo }); cargarAusencias(); } catch {}
  };

  const eliminarAusencia = async (id) => {
    if (!window.confirm('¿Eliminar esta ausencia?')) return;
    try { await api.delete(`/ausencias/${id}`); cargarAusencias(); } catch {}
  };

  const resetPassword = async (trabajador) => {
    if (!window.confirm(`¿Restablecer contraseña de ${trabajador.nombre}?`)) return;
    try {
      const { data } = await api.post(`/trabajadores/${trabajador.id}/reset-password`);
      setResetInfo({ nombre: trabajador.nombre, tempPassword: data.tempPassword });
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const copiarPassword = async () => {
    try { await navigator.clipboard.writeText(resetInfo.tempPassword); alert('Copiada'); }
    catch { alert(resetInfo.tempPassword); }
  };

  const crearFichajeManual = async (e) => {
    e.preventDefault();
    if (!formFichajeManual.usuario_id || !formFichajeManual.fecha_hora) { alert('Rellena todos los campos'); return; }
    try {
      await api.post('/fichajes/manual', { usuario_id: Number(formFichajeManual.usuario_id), tipo: formFichajeManual.tipo, fecha_hora: formFichajeManual.fecha_hora });
      setModalFichajeManual(false);
      setFormFichajeManual({ usuario_id: '', tipo: 'entrada', fecha_hora: '' });
      cargarHoy();
    } catch (err) { alert(err.response?.data?.error || 'Error al crear fichaje'); }
  };

  const eliminarFichaje = async (id) => {
    if (!window.confirm('¿Eliminar este fichaje?')) return;
    try { await api.delete(`/fichajes/${id}`); cargarHoy(); } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const descargar = async (formato, usuario_id, nombre) => {
    try {
      const { data: blob } = await api.get(`/exportar/${formato}?usuario_id=${usuario_id}&mes=${mesSeleccionado}`, { responseType: 'blob' });
      const enlace = document.createElement('a');
      enlace.href  = URL.createObjectURL(blob);
      enlace.download = `fichajes_${nombre.replace(/ /g, '_')}_${mesSeleccionado}.${formato === 'excel' ? 'xlsx' : 'pdf'}`;
      enlace.click();
      URL.revokeObjectURL(enlace.href);
    } catch (err) { alert('Error al exportar: ' + err.message); }
  };

  const formatHora  = (iso) => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const formatFecha = (iso) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  const trabajadoresSolo = trabajadores.filter(tr => tr.rol === 'trabajador' && tr.activo);

  return (
    <div className="panel-fondo">
      <div className="panel-wrap">

        <div className="cabecera">
          <div>
            <div className="cabecera-empresa">🏭 Kouira S.L</div>
            <div className="cabecera-nombre">Panel de administración</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select className="lang-select" value={lang} onChange={(e) => cambiarLang(e.target.value)}>
              <option value="es">ES</option>
              <option value="ar">AR</option>
            </select>
            <button className="btn-logout" onClick={logout}>Salir</button>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'hoy'          ? 'activo' : ''}`} onClick={() => setTab('hoy')}>Hoy</button>
          <button className={`tab ${tab === 'resumen'      ? 'activo' : ''}`} onClick={() => setTab('resumen')}>Resumen</button>
          <button className={`tab ${tab === 'ausencias'    ? 'activo' : ''}`} onClick={() => setTab('ausencias')}>Ausencias</button>
          <button className={`tab ${tab === 'trabajadores' ? 'activo' : ''}`} onClick={() => setTab('trabajadores')}>Equipo</button>
        </div>

        {/* HOY */}
        {tab === 'hoy' && (
          <div className="seccion">
            <div className="seccion-header">
              <div className="seccion-titulo" style={{ margin: 0 }}>
                Fichajes de hoy — {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <button className="btn-nuevo" onClick={() => { setFormFichajeManual({ usuario_id: '', tipo: 'entrada', fecha_hora: new Date().toISOString().slice(0,16) }); setModalFichajeManual(true); }}>
                + Fichaje manual
              </button>
            </div>
            {fichajesHoy.length === 0 ? <div className="vacio">No hay fichajes hoy</div> : (
              <div className="tabla-wrap">
                {fichajesHoy.map((f) => (
                  <div key={f.id} className="fila-fichaje">
                    <span className="fila-nombre">{f.nombre}</span>
                    <span className={`fila-tipo ${f.tipo}`}>{f.tipo}</span>
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
            <div className="seccion-header">
              <div className="seccion-titulo" style={{ margin: 0 }}>Resumen mensual</div>
              <input type="month" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="input-mes" />
            </div>
            {resumen.length === 0 ? <div className="vacio">Sin datos</div> : (
              <div className="tabla-wrap">
                {resumen.filter(r => r.nombre !== 'Administrador').map((r) => (
                  <div key={r.id} className="fila-resumen">
                    <div className="resumen-nombre">{r.nombre}</div>
                    <div className="resumen-dias">{r.dias_trabajados} días</div>
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
            <div className="seccion-header">
              <div className="seccion-titulo" style={{ margin: 0 }}>Ausencias</div>
              <input type="month" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="input-mes" />
            </div>
            <div className="seccion-titulo" style={{ marginBottom: 8, marginTop: 12 }}>Registrar nueva ausencia</div>
            {trabajadoresSolo.length === 0 ? <div className="vacio" style={{ fontSize: 12 }}>Cargando...</div> : (
              <div className="chips-trabajadores">
                {trabajadoresSolo.map(trab => (
                  <button key={trab.id} className="btn-trabajador"
                    onClick={() => { setModalAusencia({ usuario_id: trab.id, nombre: trab.nombre }); setFormAusencia({ fecha: new Date().toISOString().slice(0,10), justificada: false, motivo_tipo: '', motivo: '' }); }}>
                    + {trab.nombre.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              {ausencias.length === 0 ? <div className="vacio">No hay ausencias este mes</div> : (
                <div className="tabla-wrap">
                  {ausencias.map((a) => (
                    <div key={a.id} className="fila-ausencia">
                      <div className="ausencia-top">
                        <span className="fila-nombre">{a.nombre}</span>
                        <span className="fila-hora">{formatFecha(a.fecha)}</span>
                        <span className={`fila-tipo ${a.justificada ? 'entrada' : 'salida'}`}>
                          {a.justificada ? 'justificada' : 'injustificada'}
                        </span>
                      </div>
                      {a.motivo && <div className="ausencia-motivo">📝 {a.motivo}</div>}
                      <div className="ausencia-acciones">
                        <button className="btn-mini" onClick={() => toggleJustificada(a)}>
                          {a.justificada ? 'Marcar injust.' : 'Justificar'}
                        </button>
                        <button className="btn-mini rojo" onClick={() => eliminarAusencia(a.id)}>✕ Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EQUIPO */}
        {tab === 'trabajadores' && (
          <div className="seccion">
            <div className="seccion-titulo">Equipo</div>
            <div className="tabla-wrap" style={{ marginBottom: 20 }}>
              {trabajadores.filter(tr => tr.rol === 'trabajador').map((trab) => (
                <div key={trab.id} className="fila-trabajador">
                  <div className="trabajador-info">
                    <div className="trabajador-nombre">{trab.nombre}</div>
                    <div className="trabajador-user">@{trab.username}</div>
                  </div>
                  <span className={`fila-tipo ${trab.activo ? 'entrada' : 'salida'}`}>
                    {trab.activo ? 'activo' : 'inactivo'}
                  </span>
                  <div className="trabajador-acciones">
                    <button className="btn-mini" onClick={() => abrirEditar(trab)} title="Editar">✏️</button>
                    <button className="btn-mini" onClick={() => resetPassword(trab)} title="Restablecer contraseña">🔑</button>
                    <button className="btn-mini" onClick={() => toggleActivo(trab)} title={trab.activo ? 'Desactivar' : 'Activar'}>
                      {trab.activo ? '⏸' : '▶️'}
                    </button>
                    <button className="btn-mini rojo" onClick={() => eliminarTrabajador(trab)} title="Eliminar">🗑️</button>
                  </div>
                </div>
              ))}
            </div>

            {resetInfo && (
              <div className="reset-info">
                <div className="reset-info-titulo">✅ Contraseña temporal — {resetInfo.nombre}</div>
                <p className="reset-info-texto">Dásela al trabajador. Deberá cambiarla al entrar.</p>
                <div className="reset-info-codigo">
                  <code>{resetInfo.tempPassword}</code>
                  <button className="btn-mini" onClick={copiarPassword}>Copiar</button>
                </div>
                <button className="btn-mini" style={{ marginTop: 8 }} onClick={() => setResetInfo(null)}>✕ Cerrar</button>
              </div>
            )}

            <div className="seccion-titulo" style={{ marginTop: 20 }}>Añadir trabajador</div>
            <form onSubmit={crearTrabajador} className="form-nuevo">
              <input placeholder="Nombre completo" value={nuevoForm.nombre} onChange={(e) => setNuevoForm({ ...nuevoForm, nombre: e.target.value })} required />
              <input placeholder="Usuario (ej. ana.garcia)" value={nuevoForm.username} onChange={(e) => setNuevoForm({ ...nuevoForm, username: e.target.value })} required />
              <input type="password" placeholder="Contraseña inicial" value={nuevoForm.password} onChange={(e) => setNuevoForm({ ...nuevoForm, password: e.target.value })} required />
              {msgNuevo && <div className={`alerta ${msgNuevo.tipo}`}>{msgNuevo.texto}</div>}
              <button type="submit" className="btn-login">Crear trabajador</button>
            </form>
          </div>
        )}

        {/* MODAL EDITAR TRABAJADOR */}
        {modalEditar && (
          <div className="modal-fondo" onClick={() => setModalEditar(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-titulo">✏️ Editar trabajador</div>
              <form onSubmit={guardarEditar} className="form-nuevo">
                <label className="form-label">Nombre completo</label>
                <input value={formEditar.nombre} onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })} required className="form-input" />
                <label className="form-label">Usuario</label>
                <input value={formEditar.username} onChange={(e) => setFormEditar({ ...formEditar, username: e.target.value })} required className="form-input" />
                <div className="modal-btns">
                  <button type="button" className="btn-logout" onClick={() => setModalEditar(null)}>Cancelar</button>
                  <button type="submit" className="btn-login">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL FICHAJE MANUAL */}
        {modalFichajeManual && (
          <div className="modal-fondo" onClick={() => setModalFichajeManual(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-titulo">Fichaje manual</div>
              <form onSubmit={crearFichajeManual} className="form-nuevo">
                <label className="form-label">Trabajador</label>
                <select value={formFichajeManual.usuario_id} onChange={(e) => setFormFichajeManual({ ...formFichajeManual, usuario_id: e.target.value })} required className="form-select">
                  <option value="">— Selecciona —</option>
                  {trabajadoresSolo.map(trab => (
                    <option key={trab.id} value={trab.id}>{trab.nombre}</option>
                  ))}
                </select>
                <label className="form-label">Tipo</label>
                <select value={formFichajeManual.tipo} onChange={(e) => setFormFichajeManual({ ...formFichajeManual, tipo: e.target.value })} className="form-select">
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                </select>
                <label className="form-label">Fecha y hora</label>
                <input type="datetime-local" value={formFichajeManual.fecha_hora} onChange={(e) => setFormFichajeManual({ ...formFichajeManual, fecha_hora: e.target.value })} required className="form-input" />
                <div className="modal-btns">
                  <button type="button" className="btn-logout" onClick={() => setModalFichajeManual(false)}>Cancelar</button>
                  <button type="submit" className="btn-login">Crear fichaje</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL AUSENCIA */}
        {modalAusencia && (
          <div className="modal-fondo" onClick={() => setModalAusencia(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-titulo">Registrar ausencia — {modalAusencia.nombre}</div>
              <form onSubmit={guardarAusencia} className="form-nuevo">
                <label className="form-label">Fecha</label>
                <input type="date" value={formAusencia.fecha} onChange={(e) => setFormAusencia({ ...formAusencia, fecha: e.target.value })} required className="form-input" />
                <label className="checkbox-label">
                  <input type="checkbox" checked={formAusencia.justificada} onChange={(e) => {
                    const checked = e.target.checked;
                    setFormAusencia({ ...formAusencia, justificada: checked, motivo_tipo: checked && !formAusencia.motivo_tipo ? 'baja_medica' : formAusencia.motivo_tipo });
                  }} />
                  Ausencia justificada
                </label>
                <select value={formAusencia.motivo_tipo} onChange={(e) => setFormAusencia({ ...formAusencia, motivo_tipo: e.target.value })} className="form-select">
                  {motivoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input placeholder="Motivo (opcional)" value={formAusencia.motivo} onChange={(e) => setFormAusencia({ ...formAusencia, motivo: e.target.value })} className="form-input" />
                <div className="modal-btns">
                  <button type="button" className="btn-logout" onClick={() => setModalAusencia(null)}>Cancelar</button>
                  <button type="submit" className="btn-login">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
