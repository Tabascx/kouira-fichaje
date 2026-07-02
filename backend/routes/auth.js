const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/connection');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
  }

  try {
    const resultado = await pool.query(
        'SELECT * FROM usuarios WHERE username = $1 AND activo = true',
        [username]
    );

    const usuario = resultado.rows[0];
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const passwordCorrecta = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecta) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const ahora = new Date();
    const finJornada = new Date(ahora);
    finJornada.setHours(16, 0, 0, 0);
    if (ahora >= finJornada) finJornada.setDate(finJornada.getDate() + 1);
    const tiempoExp = Math.floor((finJornada - ahora) / 1000);

    const token = jwt.sign(
        { id: usuario.id, username: usuario.username, rol: usuario.rol, nombre: usuario.nombre, password_cambiada: usuario.password_cambiada },
        process.env.JWT_SECRET,
        { expiresIn: tiempoExp }
    );

    res.json({
      token,
      usuario: {
        id:                usuario.id,
        nombre:            usuario.nombre,
        username:          usuario.username,
        rol:               usuario.rol,
        password_cambiada: usuario.password_cambiada,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;