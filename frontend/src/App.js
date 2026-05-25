import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import PanelTrabajador from './pages/PanelTrabajador';
import PanelAdmin from './pages/PanelAdmin';

// Ruta protegida: si no hay sesión, manda al login
function RutaPrivada({ children, soloAdmin = false }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/" />;
  if (soloAdmin && usuario.rol !== 'admin') return <Navigate to="/trabajador" />;
  return children;
}

function AppRoutes() {
  const { usuario } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          usuario
            ? <Navigate to={usuario.rol === 'admin' ? '/admin' : '/trabajador'} />
            : <Login />
        }
      />
      <Route
        path="/trabajador"
        element={<RutaPrivada><PanelTrabajador /></RutaPrivada>}
      />
      <Route
        path="/admin"
        element={<RutaPrivada soloAdmin><PanelAdmin /></RutaPrivada>}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
