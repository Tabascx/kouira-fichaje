import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './Login.css';
import { t, getLang, setLang } from '../i18n';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const getLoginError = (err) => {
    if (!err.response) return t('error_conexion');
    if (err.response.status === 401) return t('credenciales_invalidas');
    return err.response?.data?.error || t('error_conexion');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const { data } = await api.post('/auth/login', { username, password });
      login(data.token, data.usuario);
      navigate(data.usuario.rol === 'admin' ? '/admin' : '/trabajador');
    } catch (err) {
      setError(getLoginError(err));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-fondo">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-icono">🏭</span>
          <h1>{t('empresa')}</h1>
          <p>{t('control')}</p>
        </div>

        <div className="login-ayuda">
          <strong>{t('ayuda_login_titulo')}</strong>
          <p>{t('ayuda_login')}</p>
        </div>

        <div style={{ position: 'absolute', right: 12, top: 12 }}>
          <select value={getLang()} onChange={(e) => setLang(e.target.value)}>
            <option value="es">ES</option>
            <option value="ar">AR</option>
          </select>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="campo">
            <label>{t('usuario_label')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('placeholder_usuario')}
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="campo">
            <label>{t('contrasena_label')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('placeholder_contrasena')}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="error-msg" role="alert" aria-live="polite">{error}</div>}

          <button type="submit" disabled={cargando} className="btn-login">
            {cargando ? t('entrando') : t('entrar')}
          </button>
        </form>
      </div>
    </div>
  );
}
