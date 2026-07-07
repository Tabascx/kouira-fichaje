const express = require('express');
const pool    = require('../db/connection');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', verificarToken, async (req, res) => {
  const { tipo } = req.body;
  const usuario_id = req.usuario.id;
  if (!['entrada', 'salida'].includes(tipo)) return res.status(400).json({ error: 'tipo debe ser "entrada" o "salida"' });
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

router.get('/mios', verificarToken, async (req, res) => {
  try {
    const resultado = await pool.query(
        'SELECT * FROM fichajes WHERE usuario_id = $1 ORDER BY fecha_hora DESC LIMIT 50',
        [req.usuario.id]
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener fichajes' });
  }
});

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

router.get('/resumen', verificarToken, soloAdmin, async (req, res) => {
  const mes = req.query.mes || new Date().toISOString().slice(0, 7);
  try {
    const resultado = await pool.query(
        `WITH pares AS (
          SELECT
            u.id, u.nombre, f.fecha_hora, f.tipo,
            LAG(f.fecha_hora) OVER (PARTITION BY u.id ORDER BY f.fecha_hora) AS anterior,
              LAG(f.tipo)       OVER (PARTITION BY u.id ORDER BY f.fecha_hora) AS tipo_anterior
          FROM usuarios u
                 LEFT JOIN fichajes f ON f.usuario_id = u.id AND TO_CHAR(f.fecha_hora, 'YYYY-MM') = $1
          WHERE u.rol = 'trabajador' AND u.activo = true
        )
         SELECT
           id, nombre,
           COUNT(DISTINCT DATE(fecha_hora)) AS dias_trabajados,
           ROUND(COALESCE(SUM(
                              CASE WHEN tipo = 'salida' AND tipo_anterior = 'entrada'
                                     THEN EXTRACT(EPOCH FROM (fecha_hora - anterior)) / 3600
                                   ELSE 0 END
                          ), 0), 1) AS horas_trabajadas
         FROM pares
         GROUP BY id, nombre
         ORDER BY nombre`,
        [mes]
    );
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

router.get('/historial/:usuario_id', verificarToken, soloAdmin, async (req, res) => {
  const { usuario_id } = req.params;
  const mes = req.query.mes || new Date().toISOString().slice(0, 7);
  try {
    const resultado = await pool.query(
        `SELECT * FROM fichajes
         WHERE usuario_id = $1 AND TO_CHAR(fecha_hora, 'YYYY-MM') = $2
         ORDER BY fecha_hora DESC`,
        [usuario_id, mes]
    );
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

router.post('/manual', verificarToken, soloAdmin, async (req, res) => {
  const { usuario_id, tipo, fecha_hora } = req.body;
  if (!usuario_id || !tipo || !fecha_hora) return res.status(400).json({ error: 'usuario_id, tipo y fecha_hora son obligatorios' });
  if (!['entrada', 'salida'].includes(tipo)) return res.status(400).json({ error: 'tipo debe ser "entrada" o "salida"' });
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

router.delete('/mio/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.usuario.id;
  try {
    const fichajeRes = await pool.query('SELECT * FROM fichajes WHERE id = $1', [id]);
    if (fichajeRes.rowCount === 0) return res.status(404).json({ error: 'Fichaje no encontrado' });
    const fichaje = fichajeRes.rows[0];
    if (fichaje.usuario_id !== usuario_id) return res.status(403).json({ error: 'No autorizado' });
    const hoy = new Date().toISOString().slice(0, 10);
    const diaFichaje = new Date(fichaje.fecha_hora).toISOString().slice(0, 10);
    if (diaFichaje !== hoy) return res.status(403).json({ error: 'Solo puedes eliminar fichajes del día de hoy' });
    await pool.query('DELETE FROM fichajes WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar fichaje' });
  }
});

router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params;
  const admin_id = req.usuario.id;
  try {
    const fichajeRes = await pool.query('SELECT * FROM fichajes WHERE id = $1', [id]);
    if (fichajeRes.rowCount === 0) return res.status(404).json({ error: 'Fichaje no encontrado' });
    const fichaje = fichajeRes.rows[0];
    await pool.query('DELETE FROM fichajes WHERE id = $1', [id]);
    await pool.query(
        `INSERT INTO auditoria (accion, tabla, registro_id, usuario_id, datos_anterior)
         VALUES ('eliminar', 'fichajes', $1, $2, $3)`,
        [id, admin_id, JSON.stringify(fichaje)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar fichaje' });
  }
});

router.get('/auditoria/historial', verificarToken, soloAdmin, async (req, res) => {
  try {
    const resultado = await pool.query(
        `SELECT a.*, u.nombre AS admin_nombre
         FROM auditoria a
                JOIN usuarios u ON u.id = a.usuario_id
         ORDER BY a.creado_en DESC LIMIT 100`
    );
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener auditoría' });
  }
});

module.exports = router;