const express = require('express');
const bcrypt  = require('bcrypt');
const pool    = require('../db/connection');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/trabajadores — listar todos (solo admin)
router.get('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT id, nombre, username, rol, activo, creado_en FROM usuarios ORDER BY nombre'
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener trabajadores' });
  }
});

// POST /api/trabajadores — crear nuevo trabajador (solo admin)
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { nombre, username, password, rol = 'trabajador' } = req.body;

  if (!nombre || !username || !password) {
    return res.status(400).json({ error: 'nombre, username y password son obligatorios' });
  }

  try {
    // Hash de la contraseña — NUNCA guardamos contraseñas en texto plano
    const hash = await bcrypt.hash(password, 10);

    const resultado = await pool.query(
      'INSERT INTO usuarios (nombre, username, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, username, rol',
      [nombre, username, hash, rol]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // unique violation
      return res.status(409).json({ error: 'Ese username ya existe' });
    }
    res.status(500).json({ error: 'Error al crear trabajador' });
  }
});

// PUT /api/trabajadores/:id — editar trabajador (solo admin)
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  const { nombre, activo } = req.body;
  const { id } = req.params;

  try {
    await pool.query(
      'UPDATE usuarios SET nombre = COALESCE($1, nombre), activo = COALESCE($2, activo) WHERE id = $3',
      [nombre, activo, id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar trabajador' });
  }
});

// POST /api/trabajadores/:id/change-password — cambiar la contraseña
// Si lo hace un admin, puede forzar el cambio. Si lo hace el propio trabajador, debe enviar oldPassword.
router.post('/:id/change-password', verificarToken, async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!newPassword) return res.status(400).json({ error: 'newPassword es obligatorio' });

  // Solo admin o el propio usuario
  if (req.usuario.rol !== 'admin' && String(req.usuario.id) !== String(id)) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  try {
    // Si no es admin, comprobar oldPassword
    if (req.usuario.rol !== 'admin') {
      const resultado = await pool.query('SELECT password FROM usuarios WHERE id = $1', [id]);
      const usuario = resultado.rows[0];
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
      const ok = await bcrypt.compare(oldPassword || '', usuario.password);
      if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hash, id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

// POST /api/trabajadores/:id/reset-password — admin: genera una contraseña temporal y la devuelve una sola vez
router.post('/:id/reset-password', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // Generar contraseña temporal (8 caracteres alfanuméricos)
    const temp = Math.random().toString(36).slice(-8) + String(Math.floor(Math.random()*90)+10);
    const hash = await bcrypt.hash(temp, 10);
    await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hash, id]);
    // Devolvemos la contraseña temporal al admin (mostrar solo una vez)
    res.json({ ok: true, tempPassword: temp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al resetear contraseña' });
  }
});

module.exports = router;
