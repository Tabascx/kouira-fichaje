import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './Panel.css';
import { t, getLang, setLang } from '../i18n';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PanelAdmin() {
  const { logout } = useAuth();
  const [tab, setTab]                   = useState('hoy');
  const [fichajesHoy, setFichajesHoy]   = useState([]);
  const [resumen, setResumen]           = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [ausencias, setAusencias]       = useState([]);
  const [nuevoForm, setNuevoForm]       = useState({ nombre: '', username: '', password: '' });
  const [msgNuevo, setMsgNuevo]         = useState(null);
  const [modalAusencia, setModalAusencia]   = useState(null);
  const [formAusencia, setFormAusencia]     = useState({ fecha: '', justificada: false, motivo_tipo: '', motivo: '' });
  const [resetInfo, setResetInfo]           = useState(null);
  const [formFichajeManual, setFormFichajeManual] = useState({ usuario_id: '', tipo: 'entrada', fecha_hora: new Date().toISOString().slice(0,16) });
  const [msgFichaje, setMsgFichaje]         = useState(null);
  const [modalEditar, setModalEditar]       = useState(null);
  const [formEditar, setFormEditar]         = useState({ nombre: '', username: '' });
  const [lang, setLangState]               = useState(getLang());

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
      setMsgNuevo({ tipo: 'ok', texto: t('crear_trabajador_exito') });
      setNuevoForm({ nombre: '', username: '', password: '' });
      cargarTrabajadores();
    } catch (err) {
      setMsgNuevo({ tipo: 'error', texto: err.response?.data?.error || t('error_crear_trabajador') });
    }
  };

  const abrirEditar = (trab) => { setModalEditar(trab); setFormEditar({ nombre: trab.nombre, username: trab.username }); };

  const guardarEditar = async (e) => {
    e.preventDefault();
    try { await api.put(`/trabajadores/${modalEditar.id}`, formEditar); setModalEditar(null); cargarTrabajadores(); }
    catch (err) { alert(err.response?.data?.error || t('error_crear_trabajador')); }
  };

  const eliminarTrabajador = async (trab) => {
    if (!window.confirm(`${t('eliminar')} ${trab.nombre}?`)) return;
    try { await api.delete(`/trabajadores/${trab.id}`); cargarTrabajadores(); }
    catch (err) { alert(err.response?.data?.error || t('error_registrar')); }
  };

  const toggleActivo = async (trab) => {
    try { await api.put(`/trabajadores/${trab.id}`, { activo: !trab.activo }); cargarTrabajadores(); } catch {}
  };

  const guardarAusencia = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ausencias', { usuario_id: modalAusencia.usuario_id, ...formAusencia });
      setModalAusencia(null);
      setFormAusencia({ fecha: '', justificada: false, motivo_tipo: '', motivo: '' });
      cargarAusencias();
    } catch (err) { alert(err.response?.data?.error || t('error_guardar_ausencia')); }
  };

  const toggleJustificada = async (ausencia) => {
    try { await api.put(`/ausencias/${ausencia.id}`, { justificada: !ausencia.justificada, motivo: ausencia.motivo }); cargarAusencias(); } catch {}
  };

  const eliminarAusencia = async (id) => {
    if (!window.confirm(t('confirmar_eliminar_ausencia'))) return;
    try { await api.delete(`/ausencias/${id}`); cargarAusencias(); } catch {}
  };

  const resetPassword = async (trabajador) => {
    if (!window.confirm(t('confirmar_restablecer_pass'))) return;
    try { const { data } = await api.post(`/trabajadores/${trabajador.id}/reset-password`); setResetInfo({ nombre: trabajador.nombre, tempPassword: data.tempPassword }); }
    catch (err) { alert(err.response?.data?.error || t('error_registrar')); }
  };

  const copiarPassword = async () => {
    try { await navigator.clipboard.writeText(resetInfo.tempPassword); alert(t('copiada')); }
    catch { alert(resetInfo.tempPassword); }
  };

  const registrarFichajeManual = async () => {
    if (!formFichajeManual.usuario_id || !formFichajeManual.fecha_hora) { alert(t('error_registrar')); return; }
    try {
      await api.post('/fichajes/manual', { usuario_id: Number(formFichajeManual.usuario_id), tipo: formFichajeManual.tipo, fecha_hora: formFichajeManual.fecha_hora });
      setMsgFichaje({ tipo: 'ok', texto: t('crear_trabajador_exito') });
      setFormFichajeManual({ usuario_id: '', tipo: 'entrada', fecha_hora: new Date().toISOString().slice(0,16) });
      cargarHoy();
      setTimeout(() => setMsgFichaje(null), 3000);
    } catch (err) {
      setMsgFichaje({ tipo: 'error', texto: err.response?.data?.error || t('error_registrar') });
    }
  };

  const eliminarFichaje = async (id) => {
    if (!window.confirm(t('confirmar_eliminar_fichaje'))) return;
    try { await api.delete(`/fichajes/${id}`); cargarHoy(); }
    catch (err) { alert(err.response?.data?.error || t('error_registrar')); }
  };

  const descargar = async (formato, usuario_id, nombre) => {
    try {
      const { data: blob } = await api.get(`/exportar/${formato}?usuario_id=${usuario_id}&mes=${mesSeleccionado}`, { responseType: 'blob' });
      const enlace = document.createElement('a');
      enlace.href  = URL.createObjectURL(blob);
      enlace.download = `fichajes_${nombre.replace(/ /g, '_')}_${mesSeleccionado}.${formato === 'excel' ? 'xlsx' : 'pdf'}`;
      enlace.click();
      URL.revokeObjectURL(enlace.href);
    } catch (err) { alert(`${t('error_descarga')}: ${err.message}`); }
  };

  const locale = getLang() === 'ar' ? 'ar' : 'es-ES';
  const formatHora  = (iso) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const formatFecha = (iso) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const trabajadoresSolo = trabajadores.filter(tr => tr.rol === 'trabajador' && tr.activo);
  const presentesHoy = new Set(fichajesHoy.filter(f => f.tipo === 'entrada').map(f => f.usuario_id)).size;

  return (
      <div className="panel-fondo" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="panel-wrap">

          <div className="cabecera">
            <div>
              <div className="cabecera-empresa">🏭 {t('empresa')}</div>
              <div className="cabecera-nombre">{t('panel_admin')}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select className="lang-select" value={lang} onChange={(e) => cambiarLang(e.target.value)}>
                <option value="es">ES</option>
                <option value="ar">AR</option>
              </select>
              <button className="btn-logout" onClick={logout}>{t('salir')}</button>
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
              <>
                <div className="stats-grid" style={{ marginBottom: 12 }}>
                  <div className="stat-card">
                    <div className="stat-label">{t('fichados_hoy')}</div>
                    <div className="stat-valor" style={{ color: '#1D9E75' }}>{presentesHoy}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">{t('faltan_fichar')}</div>
                    <div className="stat-valor" style={{ color: '#E24B4A' }}>{trabajadoresSolo.length - presentesHoy}</div>
                  </div>
                </div>

                <div className="seccion">
                  <div className="seccion-titulo">
                    {t('fichajes_hoy')} — {new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
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

                <div className="seccion fichaje-manual-seccion">
                  <div className="fichaje-manual-header">
                    <div className="fichaje-manual-icono">✏️</div>
                    <div>
                      <div className="fichaje-manual-titulo">{t('fichaje_manual')}</div>
                      <div className="fichaje-manual-sub">{t('hora_fichaje')}</div>
                    </div>
                  </div>
                  <div className="fichaje-manual-form">
                    <select value={formFichajeManual.usuario_id} onChange={(e) => setFormFichajeManual({ ...formFichajeManual, usuario_id: e.target.value })} className="form-select">
                      <option value="">— {t('usuario_del_fichaje')} —</option>
                      {trabajadoresSolo.map(trab => <option key={trab.id} value={trab.id}>{trab.nombre}</option>)}
                    </select>
                    <div className="fichaje-manual-fila">
                      <select value={formFichajeManual.tipo} onChange={(e) => setFormFichajeManual({ ...formFichajeManual, tipo: e.target.value })} className="form-select">
                        <option value="entrada">{t('entrada')}</option>
                        <option value="salida">{t('salida')}</option>
                      </select>
                      <input type="datetime-local" value={formFichajeManual.fecha_hora} onChange={(e) => setFormFichajeManual({ ...formFichajeManual, fecha_hora: e.target.value })} className="form-input" />
                    </div>
                    {msgFichaje && <div className={`alerta ${msgFichaje.tipo}`}>{msgFichaje.texto}</div>}
                    <button className="btn-login" onClick={registrarFichajeManual}>{t('crear_fichaje_manual')}</button>
                  </div>
                </div>
              </>
          )}

          {tab === 'resumen' && (
              <div className="seccion">
                <div className="seccion-header">
                  <div className="seccion-titulo" style={{ margin: 0 }}>{t('resumen_mensual')}</div>
                  <input type="month" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="input-mes" />
                </div>
                {resumen.length === 0 ? <div className="vacio">{t('sin_datos_mes')}</div> : (
                    <>
                      {/* GRÁFICO */}
                      <div style={{ width: '100%', height: 200, marginBottom: 16 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={resumen.filter(r => r.nombre !== 'Administrador').map(r => ({
                            nombre: r.nombre.split(' ')[0],
                            dias: Number(r.dias_trabajados),
                            entradas: Number(r.total_entradas),
                          }))} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                                formatter={(value, name) => [value, name === 'dias' ? t('dias') : t('entrada')]}
                                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                            />
                            <Legend formatter={(value) => value === 'dias' ? t('dias') : t('entrada')} />
                            <Bar dataKey="dias" fill="#185FA5" radius={[4,4,0,0]} name="dias" />
                            <Bar dataKey="entradas" fill="#1D9E75" radius={[4,4,0,0]} name="entradas" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* TABLA */}
                      <div className="tabla-wrap">
                        {resumen.filter(r => r.nombre !== 'Administrador').map((r) => (
                            <div key={r.id} className="fila-resumen">
                              <div className="resumen-nombre">{r.nombre}</div>
                              <div className="resumen-dias">{r.dias_trabajados} {t('dias')}</div>
                              <div className="btns-exportar">
                                <button className="btn-exportar excel" onClick={() => descargar('excel', r.id, r.nombre)}>⬇ Excel</button>
                                <button className="btn-exportar pdf" onClick={() => descargar('pdf', r.id, r.nombre)}>⬇ PDF</button>
                              </div>
                            </div>
                        ))}
                      </div>
                    </>
                )}
              </div>
          )}

          {/* AUSENCIAS */}
          {tab === 'ausencias' && (
              <div className="seccion">
                <div className="seccion-header">
                  <div className="seccion-titulo" style={{ margin: 0 }}>{t('ausencias')}</div>
                  <input type="month" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="input-mes" />
                </div>
                <div className="seccion-titulo" style={{ marginBottom: 8, marginTop: 12 }}>{t('registrar_nueva_ausencia')}</div>
                {trabajadoresSolo.length === 0 ? <div className="vacio" style={{ fontSize: 12 }}>{t('entrando')}</div> : (
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
                  {ausencias.length === 0 ? <div className="vacio">{t('sin_ausencias')}</div> : (
                      <div className="tabla-wrap">
                        {ausencias.map((a) => (
                            <div key={a.id} className="fila-ausencia">
                              <div className="ausencia-top">
                                <span className="fila-nombre">{a.nombre}</span>
                                <span className="fila-hora">{formatFecha(a.fecha)}</span>
                                <span className={`fila-tipo ${a.justificada ? 'entrada' : 'salida'}`}>
                          {a.justificada ? t('justificada') : t('injustificada')}
                        </span>
                              </div>
                              {a.motivo && <div className="ausencia-motivo">📝 {a.motivo}</div>}
                              <div className="ausencia-acciones">
                                <button className="btn-mini" onClick={() => toggleJustificada(a)}>
                                  {a.justificada ? t('marcar_injusta') : t('justificar_btn')}
                                </button>
                                <button className="btn-mini rojo" onClick={() => eliminarAusencia(a.id)}>✕ {t('eliminar')}</button>
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
                <div className="seccion-titulo">{t('trabajadores_lista')}</div>
                <div className="tabla-wrap" style={{ marginBottom: 20 }}>
                  {trabajadores.filter(tr => tr.rol === 'trabajador').map((trab) => (
                      <div key={trab.id} className="fila-trabajador">
                        <div className="trabajador-info">
                          <div className="trabajador-nombre">{trab.nombre}</div>
                          <div className="trabajador-user">@{trab.username}</div>
                        </div>
                        <span className={`fila-tipo ${trab.activo ? 'entrada' : 'salida'}`}>
                    {trab.activo ? t('activo') : t('inactivo')}
                  </span>
                        <div className="trabajador-acciones">
                          <button className="btn-mini" onClick={() => abrirEditar(trab)} title={t('cambiar_pass')}>✏️</button>
                          <button className="btn-mini" onClick={() => resetPassword(trab)} title={t('restablecer_pass')}>🔑</button>
                          <button className="btn-mini" onClick={() => toggleActivo(trab)}>{trab.activo ? '⏸' : '▶️'}</button>
                          <button className="btn-mini rojo" onClick={() => eliminarTrabajador(trab)}>🗑️</button>
                        </div>
                      </div>
                  ))}
                </div>

                {resetInfo && (
                    <div className="reset-info">
                      <div className="reset-info-titulo">✅ {t('contrasena_temporal_lista')} — {resetInfo.nombre}</div>
                      <p className="reset-info-texto">{t('restablecer_info')}</p>
                      <div className="reset-info-codigo">
                        <code>{resetInfo.tempPassword}</code>
                        <button className="btn-mini" onClick={copiarPassword}>{t('copiar')}</button>
                      </div>
                      <button className="btn-mini" style={{ marginTop: 8 }} onClick={() => setResetInfo(null)}>✕ {t('cancelar')}</button>
                    </div>
                )}

                <div className="seccion-titulo" style={{ marginTop: 20 }}>{t('crear_trabajador')}</div>
                <form onSubmit={crearTrabajador} className="form-nuevo">
                  <input placeholder={t('nombre_completo')} value={nuevoForm.nombre} onChange={(e) => setNuevoForm({ ...nuevoForm, nombre: e.target.value })} required />
                  <input placeholder={t('usuario')} value={nuevoForm.username} onChange={(e) => setNuevoForm({ ...nuevoForm, username: e.target.value })} required />
                  <input type="password" placeholder={t('contrasena_inicial')} value={nuevoForm.password} onChange={(e) => setNuevoForm({ ...nuevoForm, password: e.target.value })} required />
                  {msgNuevo && <div className={`alerta ${msgNuevo.tipo}`}>{msgNuevo.texto}</div>}
                  <button type="submit" className="btn-login">{t('crear_trabajador')}</button>
                </form>
              </div>
          )}

          {/* MODAL EDITAR */}
          {modalEditar && (
              <div className="modal-fondo" onClick={() => setModalEditar(null)}>
                <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-titulo">✏️ {t('cambiar_pass')}</div>
                  <form onSubmit={guardarEditar} className="form-nuevo">
                    <label className="form-label">{t('nombre_completo')}</label>
                    <input value={formEditar.nombre} onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })} required className="form-input" />
                    <label className="form-label">{t('usuario')}</label>
                    <input value={formEditar.username} onChange={(e) => setFormEditar({ ...formEditar, username: e.target.value })} required className="form-input" />
                    <div className="modal-btns">
                      <button type="button" className="btn-logout" onClick={() => setModalEditar(null)}>{t('cancelar')}</button>
                      <button type="submit" className="btn-login">{t('guardar')}</button>
                    </div>
                  </form>
                </div>
              </div>
          )}

          {/* MODAL AUSENCIA */}
          {modalAusencia && (
              <div className="modal-fondo" onClick={() => setModalAusencia(null)}>
                <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-titulo">{t('registrar_ausencia')} — {modalAusencia.nombre}</div>
                  <form onSubmit={guardarAusencia} className="form-nuevo">
                    <label className="form-label">{t('fecha')}</label>
                    <input type="date" value={formAusencia.fecha} onChange={(e) => setFormAusencia({ ...formAusencia, fecha: e.target.value })} required className="form-input" />
                    <label className="checkbox-label">
                      <input type="checkbox" checked={formAusencia.justificada} onChange={(e) => {
                        const checked = e.target.checked;
                        setFormAusencia({ ...formAusencia, justificada: checked, motivo_tipo: checked && !formAusencia.motivo_tipo ? 'baja_medica' : formAusencia.motivo_tipo });
                      }} />
                      {t('ausencia_justificada')}
                    </label>
                    <select value={formAusencia.motivo_tipo} onChange={(e) => setFormAusencia({ ...formAusencia, motivo_tipo: e.target.value })} className="form-select">
                      {motivoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <input placeholder={t('motivo')} value={formAusencia.motivo} onChange={(e) => setFormAusencia({ ...formAusencia, motivo: e.target.value })} className="form-input" />
                    <div className="modal-btns">
                      <button type="button" className="btn-logout" onClick={() => setModalAusencia(null)}>{t('cancelar')}</button>
                      <button type="submit" className="btn-login">{t('guardar')}</button>
                    </div>
                  </form>
                </div>
              </div>
          )}

        </div>
      </div>
  );
}