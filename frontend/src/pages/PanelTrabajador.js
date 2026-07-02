import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './Panel.css';
import { t } from '../i18n';

export default function PanelTrabajador() {
  const { usuario, logout, actualizarUsuario } = useAuth();

  const [hora, setHora]           = useState(new Date());
  const [fichajes, setFichajes]   = useState([]);
  const [ausencias, setAusencias] = useState([]);
  const [cargando, setCargando]   = useState(false);
  const [mensaje, setMensaje]     = useState(null);
  const [mostrarCambioPass, setMostrarCambioPass] = useState(false);
  const [formPass, setFormPass]   = useState({ actual: '', nueva: '', confirma: '' });
  const [errorPass, setErrorPass] = useState('');
  const [cargandoPass, setCargandoPass] = useState(false);
  const [tab, setTab]             = useState('fichar');
  const [descargando, setDescargando] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const tick = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    cargarFichajes();
    cargarAusencias();
    if (!usuario.password_cambiada) setMostrarCambioPass(true);
  }, [usuario.id, mesSeleccionado]);

  const cargarFichajes  = async () => { try { const { data } = await api.get('/fichajes/mios'); setFichajes(data); } catch {} };
  const cargarAusencias = async () => { try { const { data } = await api.get(`/ausencias/mias?mes=${mesSeleccionado}`); setAusencias(data); } catch {} };

  const cambiarContrasena = async (e) => {
    e.preventDefault();
    setErrorPass('');
    if (!formPass.actual) { setErrorPass('Debes escribir tu contraseña actual'); return; }
    if (formPass.nueva !== formPass.confirma) { setErrorPass(t('contrasenas_no_coinciden')); return; }
    if (formPass.nueva.length < 4) { setErrorPass('La contraseña debe tener al menos 4 caracteres'); return; }
    setCargandoPass(true);
    try {
      await api.post(`/trabajadores/${usuario.id}/change-password`, { oldPassword: formPass.actual, newPassword: formPass.nueva });
      actualizarUsuario({ password_cambiada: true });
      setMostrarCambioPass(false);
      setFormPass({ actual: '', nueva: '', confirma: '' });
    } catch (err) {
      setErrorPass(err.response?.data?.error || t('error_cambio_contrasena'));
    } finally {
      setCargandoPass(false);
    }
  };

  const fichar = async (tipo) => {
    setCargando(true);
    setMensaje(null);
    try {
      await api.post('/fichajes', { tipo });
      const timeStr = hora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      setMensaje({ tipo: 'ok', texto: tipo === 'entrada' ? `✅ Entrada registrada a las ${timeStr}` : `✅ Salida registrada a las ${timeStr}` });
      cargarFichajes();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || t('error_registrar') });
    } finally {
      setCargando(false);
    }
  };

  const descargarMisPDF = async (formato) => {
    setDescargando(true);
    try {
      const { data: blob } = await api.get(`/exportar/mio/${formato}?mes=${mesSeleccionado}`, { responseType: 'blob' });
      const enlace = document.createElement('a');
      enlace.href  = URL.createObjectURL(blob);
      enlace.download = `mis_fichajes_${mesSeleccionado}.${formato === 'excel' ? 'xlsx' : 'pdf'}`;
      enlace.click();
      URL.revokeObjectURL(enlace.href);
    } catch { alert(t('error_descarga')); }
    finally { setDescargando(false); }
  };

  const ultimoFichaje = fichajes[0];
  const tocaSalida    = ultimoFichaje?.tipo === 'entrada';
  const formatFecha   = (iso) => new Date(iso).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  const formatHora    = (iso) => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const calcularHoras = (list) => {
    const sorted = [...list].sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
    let totalMs = 0, lastEntrada = null;
    for (const f of sorted) {
      if (f.tipo === 'entrada') lastEntrada = new Date(f.fecha_hora);
      else if (f.tipo === 'salida' && lastEntrada) {
        const salida = new Date(f.fecha_hora);
        if (salida > lastEntrada) totalMs += (salida - lastEntrada);
        lastEntrada = null;
      }
    }
    return totalMs;
  };

  const totalMs      = calcularHoras(fichajes);
  const totalHoras   = Math.floor(totalMs / (1000 * 60 * 60));
  const totalMinutos = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
      <div className="panel-fondo">
        <div className="panel-wrap">

          {mostrarCambioPass && (
              <div className="modal-fondo">
                <div className="modal-card">
                  <div className="modal-icono">🔐</div>
                  <div className="modal-titulo">Cambia tu contraseña</div>
                  <p className="modal-desc">Es tu primera vez. Pon una contraseña que recuerdes.</p>
                  <form onSubmit={cambiarContrasena} className="form-nuevo">
                    <input type="password" placeholder="Tu contraseña actual" value={formPass.actual} onChange={(e) => setFormPass({ ...formPass, actual: e.target.value })} autoFocus required />
                    <input type="password" placeholder="Nueva contraseña" value={formPass.nueva} onChange={(e) => setFormPass({ ...formPass, nueva: e.target.value })} required />
                    <input type="password" placeholder="Repite la contraseña" value={formPass.confirma} onChange={(e) => setFormPass({ ...formPass, confirma: e.target.value })} required />
                    {errorPass && <div className="alerta error">{errorPass}</div>}
                    <button type="submit" className="btn-login" disabled={cargandoPass}>
                      {cargandoPass ? 'Guardando...' : 'Guardar contraseña'}
                    </button>
                  </form>
                </div>
              </div>
          )}

          <div className="cabecera">
            <div>
              <div className="cabecera-empresa">🏭 Kouira S.L</div>
              <div className="cabecera-nombre">{usuario.nombre}</div>
            </div>
            <button className="btn-logout" onClick={logout}>{t('salir')}</button>
          </div>

          <div className="tabs">
            <button className={`tab ${tab === 'fichar'    ? 'activo' : ''}`} onClick={() => setTab('fichar')}>⏱ Fichar</button>
            <button className={`tab ${tab === 'resumen'   ? 'activo' : ''}`} onClick={() => setTab('resumen')}>📊 Resumen</button>
            <button className={`tab ${tab === 'historial' ? 'activo' : ''}`} onClick={() => setTab('historial')}>📋 Historial</button>
          </div>

          {tab === 'fichar' && (
              <>
                <div className="fichar-card">
                  <div className="reloj">{hora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                  <div className="fecha-hoy">{hora.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                  {mensaje && <div className={`alerta ${mensaje.tipo}`}>{mensaje.texto}</div>}
                  <div className="botones-fichar">
                    <button className="btn-fichar entrada" onClick={() => fichar('entrada')} disabled={cargando || tocaSalida}>↓ {t('fichar_entrada')}</button>
                    <button className="btn-fichar