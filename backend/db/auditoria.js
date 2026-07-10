const pool = require('./connection');

/**
 * Registra una acción en la tabla de auditoría
 * @param {object} params
 * @param {string} params.accion - 'crear', 'editar', 'eliminar'
 * @param {string} params.tabla - 'fichajes', 'ausencias', 'usuarios'
 * @param {number} params.registro_id
 * @param {number} params.usuario_id - quien hizo la acción
 * @param {object} params.datos_anterior - datos antes del cambio
 * @param {string} params.razon - motivo opcional
 * @param {object} params.req - request de express (para IP y user-agent)
 */
async function registrarAuditoria({ accion, tabla, registro_id, usuario_id, datos_anterior = null, razon = null, req = null }) {
    try {
        const ip         = req?.ip || null;
        const user_agent = req?.headers?.['user-agent'] || null;
        await pool.query(
            `INSERT INTO auditoria (accion, tabla, registro_id, usuario_id, datos_anterior, razon, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [accion, tabla, registro_id, usuario_id, datos_anterior ? JSON.stringify(datos_anterior) : null, razon, ip, user_agent]
        );
    } catch (err) {
        console.error('Error al registrar auditoría:', err.message);
        // No lanzamos el error — la auditoría no debe bloquear la operación principal
    }
}

module.exports = { registrarAuditoria };