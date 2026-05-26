const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/connection');

const router = express.Router();

// POST /api/auth/login
// Recibe { username, password } y devuelve un token JWT si los datos son correctos
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
  }

  try {
    // Buscar el usuario en la base de datos
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE username = $1 AND activo = true',
      [username]
    );

    const usuario = resultado.rows[0];
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Comparar la contraseña con el hash guardado
    const passwordCorrecta = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecta) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Generar el token JWT
    // Expira a las 16:00 (fin de jornada) del mismo día
    const ahora = new Date();
    const finJornada = new Date(ahora);
    finJornada.setHours(16, 0, 0, 0);
    
    // Si ya pasaron las 16h, expira mañana a las 16h
    if (ahora >= finJornada) {
      finJornada.setDate(finJornada.getDate() + 1);
    }

    const tiempoExp = Math.floor((finJornada - ahora) / 1000); // en segundos
    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, rol: usuario.rol, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: tiempoExp }
    );

    res.json({
      token,
      usuario: {
        id:       usuario.id,
        nombre:   usuario.nombre,
        username: usuario.username,
        rol:      usuario.rol,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
