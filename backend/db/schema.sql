-- ============================================
--  Kouira S.L — Base de datos de fichajes
-- ============================================

-- Tabla de usuarios (trabajadores + admin)
CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  username    VARCHAR(50)  UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,         -- bcrypt hash, nunca en texto plano
  rol         VARCHAR(10)  NOT NULL DEFAULT 'trabajador', -- 'trabajador' o 'admin'
  activo      BOOLEAN      NOT NULL DEFAULT true,
  creado_en   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Tabla de fichajes (cada entrada y salida)
CREATE TABLE IF NOT EXISTS fichajes (
  id              SERIAL PRIMARY KEY,
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
  tipo            VARCHAR(10) NOT NULL,  -- 'entrada' o 'salida'
  fecha_hora      TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_origen       VARCHAR(45)           -- opcional, para auditoría
);

-- Tabla de ausencias (cuando falta y si está justificada)
CREATE TABLE IF NOT EXISTS ausencias (
  id              SERIAL PRIMARY KEY,
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
  fecha           DATE NOT NULL,
  justificada     BOOLEAN NOT NULL DEFAULT false,
  motivo          TEXT,
  creado_en       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de auditoría (histórico de cambios en fichajes)
CREATE TABLE IF NOT EXISTS auditoria (
  id              SERIAL PRIMARY KEY,
  accion          VARCHAR(20) NOT NULL,  -- 'eliminar', 'crear', 'modificar'
  tabla           VARCHAR(20) NOT NULL,  -- 'fichajes', 'ausencias'
  registro_id     INTEGER NOT NULL,      -- ID del fichaje o ausencia afectada
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),  -- admin que hizo el cambio
  datos_anterior  JSONB,                 -- datos antes del cambio
  razon           TEXT,                  -- motivo opcional
  creado_en       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas rápidas por fecha
CREATE INDEX IF NOT EXISTS idx_fichajes_usuario ON fichajes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_fichajes_fecha   ON fichajes(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_ausencias_fecha  ON ausencias(fecha);

-- Usuario admin de ejemplo (password: 'admin' — cámbialo en producción)
INSERT INTO usuarios (nombre, username, password, rol)
VALUES ('Administrador', 'admin', '$2b$10$Wm8/EgqHqQZz3OoSgSqsiu7A8TpysvkVx0Hd2OJMDPcQJqNaRpBf.', 'admin')
ON CONFLICT (username) DO NOTHING;
