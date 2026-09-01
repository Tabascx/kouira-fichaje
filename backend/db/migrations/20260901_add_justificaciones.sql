-- Migration: create justificaciones table
CREATE TABLE IF NOT EXISTS justificaciones (
  id SERIAL PRIMARY KEY,
  fichaje_id INTEGER REFERENCES fichajes(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id),
  motivo_tipo TEXT,
  motivo_text TEXT NOT NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_justificaciones_fichaje_id ON justificaciones(fichaje_id);
