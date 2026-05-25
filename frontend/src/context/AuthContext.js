import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// Envuelve toda la app — guarda quién está logueado
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    // Al arrancar, recupera el usuario del localStorage si ya había sesión
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

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado — en cualquier componente haz: const { usuario } = useAuth()
export function useAuth() {
  return useContext(AuthContext);
}
