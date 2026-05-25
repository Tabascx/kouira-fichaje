const express = require('express');
const pool    = require('../db/connection');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/fichajes  — registrar entrada o salida
// El trabajador llama a esto cuando pulsa el botón
router.post('/', verificarToken, async (req, res) => {
  const { tipo } = req.body; // 'entrada' o 'salida'
  const usuario_id = req.usuario.id;

  if (!['entrada', 'salida'].includes(tipo)) {
    return res.status(400).json({ error: 'tipo debe ser "entrada" o "salida"' });
  }

  try {
    const resultado = await pool.query(
      'INSERT INTO fichajes (usuario_id, tipo, ip_origen) VALUES ($1, $2, $3) RETURNING *',
      [usuario_id, tipo, req.ip]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar fichaje' });
  }
});

// GET /api/fichajes/mios — historial del trabajador logueado
router.get('/mios', verificarToken, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT * FROM fichajes
       WHERE usuario_id = $1
       ORDER BY fecha_hora DESC
       LIMIT 50`,
      [req.usuario.id]
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener fichajes' });
  }
});

// GET /api/fichajes/hoy — todos los fichajes de hoy (solo admin)
router.get('/hoy', verificarToken, soloAdmin, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT f.*, u.nombre, u.username
       FROM fichajes f
       JOIN usuarios u ON u.id = f.usuario_id
       WHERE DATE(f.fecha_hora) = CURRENT_DATE
       ORDER BY f.fecha_hora DESC`
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener fichajes de hoy' });
  }
});

// GET /api/fichajes/resumen?mes=2026-05 — resumen mensual (solo admin)
router.get('/resumen', verificarToken, soloAdmin, async (req, res) => {
  const mes = req.query.mes || new Date().toISOString().slice(0, 7); // ej: "2026-05"

  try {
    const resultado = await pool.query(
      `SELECT
         u.id,
         u.nombre,
         COUNT(DISTINCT DATE(f.fecha_hora)) AS dias_trabajados,
         COUNT(f.id) FILTER (WHERE f.tipo = 'entrada') AS total_entradas
       FROM usuarios u
       LEFT JOIN fichajes f
         ON f.usuario_id = u.id
         AND TO_CHAR(f.fecha_hora, 'YYYY-MM') = $1
       WHERE u.rol = 'trabajador' AND u.activo = true
       GROUP BY u.id, u.nombre
       ORDER BY u.nombre`,
      [mes]
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

// POST /api/fichajes/manual — crear fichaje manual (solo admin) con fecha/hora custom
router.post('/manual', verificarToken, soloAdmin, async (req, res) => {
  const { usuario_id, tipo, fecha_hora } = req.body;

  if (!usuario_id || !tipo || !fecha_hora) {
    return res.status(400).json({ error: 'usuario_id, tipo y fecha_hora son obligatorios' });
  }

  if (!['entrada', 'salida'].includes(tipo)) {
    return res.status(400).json({ error: 'tipo debe ser "entrada" o "salida"' });
  }

  try {
    const resultado = await pool.query(
      'INSERT INTO fichajes (usuario_id, tipo, fecha_hora, ip_origen) VALUES ($1, $2, $3, $4) RETURNING *',
      [usuario_id, tipo, fecha_hora, 'manual-admin']
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear fichaje manual' });
  }
});

// DELETE /api/fichajes/:id — eliminar un fichaje (solo admin)
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const resultado = await pool.query('DELETE FROM fichajes WHERE id = $1', [id]);
    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Fichaje no encontrado' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar fichaje' });
  }
});

module.exports = router;
