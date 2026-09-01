const express = require('express');
const pool = require('../db/connection');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/justificaciones?usuario=<id>
// If usuario param is provided, only admin can request others' justifications. Otherwise returns current user's justifications.
router.get('/', verificarToken, async (req, res) => {
  const usuarioQuery = req.query.usuario ? Number(req.query.usuario) : null;
  try {
    if (usuarioQuery && req.usuario.rol !== 'admin' && req.usuario.id !== usuarioQuery) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const userId = usuarioQuery || req.usuario.id;
    const resultado = await pool.query(
      `SELECT j.id, j.fichaje_id, j.usuario_id, j.motivo_tipo, j.motivo_text, j.creado_en, j.ip, j.user_agent, u.nombre as autor_nombre
       FROM justificaciones j
       LEFT JOIN usuarios u ON u.id = j.usuario_id
       WHERE j.usuario_id = $1
       ORDER BY j.creado_en DESC`,
      [userId]
    );

    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener justificaciones' });
  }
});

module.exports = router;
