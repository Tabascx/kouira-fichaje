-- Ejecuta esto una sola vez en tu base de datos
ALTER TABLE ausencias ADD CONSTRAINT ausencias_usuario_fecha_unique UNIQUE (usuario_id, fecha);
