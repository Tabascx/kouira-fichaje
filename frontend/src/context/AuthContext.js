import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  });

  const login = (token, datosUsuario) => {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  const actualizarUsuario = (datos) => {
    const nuevo = { ...usuario, ...datos };
    localStorage.setItem('usuario', JSON.stringify(nuevo));
    setUsuario(nuevo);
  };

  return (
      <AuthContext.Provider value={{ usuario, login, logout, actualizarUsuario }}>
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}