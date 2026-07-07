const express = require('express');
const bcrypt  = require('bcrypt');
const pool    = require('../db/connection');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

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

router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { nombre, username, password, rol = 'trabajador' } = req.body;
  if (!nombre || !username || !password) {
    return res.status(400).json({ error: 'nombre, username y password son obligatorios' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const resultado = await pool.query(
        'INSERT INTO usuarios (nombre, username, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, username, rol',
        [nombre, username, hash, rol]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ese username ya existe' });
    res.status(500).json({ error: 'Error al crear trabajador' });
  }
});

router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  const { nombre, username, activo } = req.body;
  const { id } = req.params;
  try {
    if (username) {
      const existe = await pool.query(
          'SELECT id FROM usuarios WHERE username = $1 AND id != $2',
          [username, id]
      );
      if (existe.rows.length > 0) {
        return res.status(409).json({ error: 'Ese username ya existe' });
      }
    }
    await pool.query(
        `UPDATE usuarios SET
                           nombre   = COALESCE($1, nombre),
                           username = COALESCE($2, username),
                           activo   = COALESCE($3, activo)
         WHERE id = $4`,
        [nombre, username, activo, id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar trabajador' });
  }
});

router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params;
  if (String(req.usuario.id) === String(id)) {
    return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  }
  try {
    await pool.query('DELETE FROM ausencias WHERE usuario_id = $1', [id]);
    await pool.query('DELETE FROM fichajes  WHERE usuario_id = $1', [id]);
    await pool.query('DELETE FROM usuarios  WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar trabajador' });
  }
});

router.post('/:id/change-password', verificarToken, async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'newPassword es obligatorio' });
  if (req.usuario.rol !== 'admin' && String(req.usuario.id) !== String(id)) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  try {
    if (req.usuario.rol !== 'admin') {
      const resultado = await pool.query('SELECT password FROM usuarios WHERE id = $1', [id]);
      const usuario = resultado.rows[0];
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
      const ok = await bcrypt.compare(oldPassword || '', usuario.password);
      if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE usuarios SET password = $1, password_cambiada = true WHERE id = $2', [hash, id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

router.post('/:id/reset-password', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const temp = Math.random().toString(36).slice(-8) + String(Math.floor(Math.random()*90)+10);
    const hash = await bcrypt.hash(temp, 10);
    await pool.query('UPDATE usuarios SET password = $1, password_cambiada = false WHERE id = $2', [hash, id]);
    res.json({ ok: true, tempPassword: temp });
  } catch (err) {
    res.status(500).json({ error: 'Error al resetear contraseña' });
  }
});
// POST /api/trabajadores/:id/aceptar-privacidad
router.post('/:id/aceptar-privacidad', verificarToken, async (req, res) => {
  const { id } = req.params;
  if (String(req.usuario.id) !== String(id)) return res.status(403).json({ error: 'No autorizado' });
  try {
    await pool.query('UPDATE usuarios SET privacidad_aceptada = true WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar consentimiento' });
  }
});
module.exports = router;