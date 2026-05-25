const jwt = require('jsonwebtoken');

// Este middleware protege las rutas — si no hay token válido, rechaza la petición
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // formato: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado: no hay token' });
  }

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = datos; // guardamos los datos del usuario para usarlos en la ruta
    next();
  } catch {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

// Solo permite acceso a admins
function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo el administrador puede hacer esto' });
  }
  next();
}

module.exports = { verificarToken, soloAdmin };
