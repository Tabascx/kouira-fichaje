const express = require('express');
const pool    = require('../db/connection');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/ausencias/mias?mes=2026-05 — ausencias del trabajador autenticado
router.get('/mias', verificarToken, async (req, res) => {
  const mes = req.query.mes || new Date().toISOString().slice(0, 7);
  try {
    const resultado = await pool.query(
      `SELECT a.*
       FROM ausencias a
       WHERE a.usuario_id = $1
         AND TO_CHAR(a.fecha, 'YYYY-MM') = $2
       ORDER BY a.fecha DESC`,
      [req.usuario.id, mes]
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tus ausencias' });
  }
});

// GET /api/ausencias?mes=2026-05 — listar ausencias del mes (admin)
router.get('/', verificarToken, soloAdmin, async (req, res) => {
  const mes = req.query.mes || new Date().toISOString().slice(0, 7);
  try {
    const resultado = await pool.query(
      `SELECT a.*, u.nombre
       FROM ausencias a
       JOIN usuarios u ON u.id = a.usuario_id
       WHERE TO_CHAR(a.fecha, 'YYYY-MM') = $1
       ORDER BY a.fecha DESC`,
      [mes]
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener ausencias' });
  }
});

// POST /api/ausencias — registrar ausencia (admin justifica, o auto al detectar falta)
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { usuario_id, fecha, justificada = false, motivo_tipo = null, motivo = '' } = req.body;
  if (!usuario_id || !fecha) return res.status(400).json({ error: 'usuario_id y fecha son obligatorios' });

  try {
    const resultado = await pool.query(
      `INSERT INTO ausencias (usuario_id, fecha, justificada, motivo_tipo, motivo)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (usuario_id, fecha) DO UPDATE
         SET justificada = $3, motivo_tipo = $4, motivo = $5
       RETURNING *`,
      [usuario_id, fecha, justificada, motivo_tipo, motivo]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar ausencia' });
  }
});

// PUT /api/ausencias/:id — actualizar justificación
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  const { justificada, motivo_tipo = null, motivo = '' } = req.body;
  try {
    await pool.query(
      'UPDATE ausencias SET justificada = $1, motivo_tipo = $2, motivo = $3 WHERE id = $4',
      [justificada, motivo_tipo, motivo, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar ausencia' });
  }
});

// DELETE /api/ausencias/:id — eliminar ausencia
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM ausencias WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar ausencia' });
  }
});

module.exports = router;
