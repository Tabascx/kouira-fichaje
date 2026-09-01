-- Migration: Añade motivo_tipo a ausencias, ip/user_agent a auditoria y UNIQUE(usuario_id, fecha)

DO $$
BEGIN
  -- añadir motivo_tipo si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='ausencias' AND column_name='motivo_tipo'
  ) THEN
    ALTER TABLE ausencias ADD COLUMN motivo_tipo VARCHAR(50);
  END IF;

  -- añadir ip y user_agent a auditoria
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='auditoria' AND column_name='ip'
  ) THEN
    ALTER TABLE auditoria ADD COLUMN ip VARCHAR(45);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='auditoria' AND column_name='user_agent'
  ) THEN
    ALTER TABLE auditoria ADD COLUMN user_agent TEXT;
  END IF;

  -- añadir restricción UNIQUE para ausencias (usuario_id, fecha)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ausencias_usuario_fecha_unique'
  ) THEN
    ALTER TABLE ausencias ADD CONSTRAINT ausencias_usuario_fecha_unique UNIQUE (usuario_id, fecha);
  END IF;
END$$;
