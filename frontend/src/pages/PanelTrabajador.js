import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './Panel.css';
import { t, getLang } from '../i18n';

export default function PanelTrabajador() {
  const { usuario, logout } = useAuth();

  const [hora, setHora]           = useState(new Date());
  const [fichajes, setFichajes]   = useState([]);
  const [cargando, setCargando]   = useState(false);
  const [mensaje, setMensaje]     = useState(null); // { tipo: 'ok'|'error', texto }
  const [mostrarCambioContrasena, setMostrarCambioContrasena] = useState(false);
  const [formCambioPass, setFormCambioPass] = useState({ nueva: '', confirma: '' });
  const [cargandoPass, setCargandoPass] = useState(false);

  // Reloj en tiempo real
  useEffect(() => {
    const tick = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Cargar historial al entrar
  useEffect(() => {
    cargarFichajes();
    // Mostrar modal de cambio si es la primera vez (puedes usar una bandera en localStorage)
    const yaSeAvisoDeCambio = localStorage.getItem(`cambio-pass-${usuario.id}`);
    if (!yaSeAvisoDeCambio) {
      setMostrarCambioContrasena(true);
    }
  }, [usuario.id]);

  const cambiarContraseña = async (e) => {
    e.preventDefault();
    if (formCambioPass.nueva !== formCambioPass.confirma) {
      alert(t('contrasenas_no_coinciden'));
      return;
    }
    if (formCambioPass.nueva.length < 4) {
      alert(t('contrasena_label') + ' muy corta');
      return;
    }
    setCargandoPass(true);
    try {
      await api.post(`/trabajadores/${usuario.id}/change-password`, {
        oldPassword: '',
        newPassword: formCambioPass.nueva,
      });
      localStorage.setItem(`cambio-pass-${usuario.id}`, 'true');
      setMostrarCambioContrasena(false);
      setFormCambioPass({ nueva: '', confirma: '' });
      alert(t('cambio_exitoso'));
    } catch (err) {
      alert(err.response?.data?.error || t('error_cambio_contrasena'));
    } finally {
      setCargandoPass(false);
    }
  };

  const cargarFichajes = async () => {
    try {
      const { data } = await api.get('/fichajes/mios');
      setFichajes(data);
    } catch {
      // silencioso — no bloquea la pantalla
    }
  };

  const fichar = async (tipo) => {
    setCargando(true);
    setMensaje(null);
    try {
      await api.post('/fichajes', { tipo });
      const timeStr = hora.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
      setMensaje({ tipo: 'ok', texto: tipo === 'entrada' ? `${t('entrada_registrada')} ${timeStr}` : `${t('salida_registrada')} ${timeStr}` });
      cargarFichajes();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || t('error_registrar') });
    } finally {
      setCargando(false);
    }
  };

  // Determina si el último fichaje fue entrada (entonces toca salida) o viceversa
  const ultimoFichaje = fichajes[0];
  const tocaSalida = ultimoFichaje?.tipo === 'entrada';

  const locale = getLang() === 'ar' ? 'ar' : 'es-ES';
  const formatFecha = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatHora = (iso) => {
    return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  const tipoTexto = (tipo) => t(tipo) || tipo;

  // Calcula el total de horas trabajadas a partir de la lista de fichajes
  const calcularHorasTotales = (fichajesList) => {
    if (!fichajesList || fichajesList.length === 0) return 0;
    // Ordenar cronológicamente ascendente
    const sorted = [...fichajesList].sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
    let totalMs = 0;
    let lastEntrada = null;
    for (const f of sorted) {
      if (f.tipo === 'entrada') {
        lastEntrada = new Date(f.fecha_hora);
      } else if (f.tipo === 'salida') {
        if (lastEntrada) {
          const salida = new Date(f.fecha_hora);
          if (salida > lastEntrada) totalMs += (salida - lastEntrada);
          lastEntrada = null;
        }
      }
    }
    // devolver horas en milisegundos
    return totalMs;
  };

  const totalMs = calcularHorasTotales(fichajes);
  const totalHoras = Math.floor(totalMs / (1000 * 60 * 60));
  const totalMinutos = Math.floor((totalMs - totalHoras * 1000 * 60 * 60) / (1000 * 60));

  return (
    <div className="panel-fondo">
      <div className="panel-wrap">

        {/* MODAL CAMBIO OBLIGATORIO DE CONTRASEÑA */}
        {mostrarCambioContrasena && (
          <div className="modal-fondo">
            <div className="modal-card">
              <div className="seccion-titulo">{t('cambiar_contrasena_primer_login')}</div>
              <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>{t('cambiar_contrasena_ahora')}</p>
              <form onSubmit={cambiarContraseña} className="form-nuevo">
                <input 
                  type="password" 
                  placeholder={t('nueva_contrasena')} 
                  value={formCambioPass.nueva} 
                  onChange={(e) => setFormCambioPass({ ...formCambioPass, nueva: e.target.value })} 
                  required 
                />
                <input 
                  type="password" 
                  placeholder={t('confirmar_contrasena')} 
                  value={formCambioPass.confirma} 
                  onChange={(e) => setFormCambioPass({ ...formCambioPass, confirma: e.target.value })} 
                  required 
                />
                <button type="submit" className="btn-login" disabled={cargandoPass}>
                  {cargandoPass ? t('entrando') : t('cambiar_contrasena_primer_login')}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Cabecera */}
        <div className="cabecera">
          <div>
            <div className="cabecera-empresa">🏭 {t('empresa')}</div>
            <div className="cabecera-nombre">{usuario.nombre}</div>
          </div>
          <button className="btn-logout" onClick={logout}>{t('salir')}</button>
        </div>

        {/* Reloj y fichaje */}
        <div className="fichar-card">
          <div className="reloj">{hora.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          <div className="fecha-hoy">{hora.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</div>

          {mensaje && (
            <div className={`alerta ${mensaje.tipo}`}>{mensaje.texto}</div>
          )}

          <div className="botones-fichar">
            <button
              className="btn-fichar entrada"
              onClick={() => fichar('entrada')}
              disabled={cargando || tocaSalida}
            >
              ↓ {t('fichar_entrada')}
            </button>
            <button
              className="btn-fichar salida"
              onClick={() => fichar('salida')}
              disabled={cargando || !tocaSalida}
            >
              ↑ {t('fichar_salida')}
            </button>
          </div>

          {ultimoFichaje && (
            <div className="ultimo-fichaje">
              {t('ultimo_registro')}: <strong>{tipoTexto(ultimoFichaje.tipo)}</strong> {t('a_las')} {formatHora(ultimoFichaje.fecha_hora)}
            </div>
          )}
        </div>

        {/* Historial */}
        <div className="seccion">
          <div className="seccion-titulo">{t('horas_trabajadas')} — {totalHoras}h {totalMinutos}m</div>
          {fichajes.length === 0 ? (
            <div className="vacio">{t('no_hay_registros')}</div>
          ) : (
            <div className="tabla-wrap">
              {fichajes.slice(0, 20).map((f) => (
                <div key={f.id} className="fila-fichaje">
                  <span className="fila-fecha">{formatFecha(f.fecha_hora)}</span>
                  <span className={`fila-tipo ${f.tipo}`}>{tipoTexto(f.tipo)}</span>
                  <span className="fila-hora">{formatHora(f.fecha_hora)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
