# Kouira S.L — App de Fichajes

Sistema web de control de presencia para empleados.

## Tecnologías

- **Frontend**: React
- **Backend**: Node.js + Express
- **Base de datos**: PostgreSQL
- **Autenticación**: JWT + bcrypt

## Estructura

```
kouira-fichaje/
├── backend/
│   ├── db/
│   │   ├── connection.js    # Conexión a PostgreSQL
│   │   └── schema.sql       # Tablas de la base de datos
│   ├── middleware/
│   │   └── auth.js          # Verificación de tokens JWT
│   ├── routes/
│   │   ├── auth.js          # Login
│   │   ├── fichajes.js      # Registrar entrada/salida
│   │   └── trabajadores.js  # Gestión de empleados
│   ├── .env.example         # Variables de entorno (copia como .env)
│   └── index.js             # Servidor principal
└── frontend/
    └── src/
        ├── pages/           # Pantallas (Login, Trabajador, Admin)
        ├── components/      # Componentes reutilizables
        └── context/         # Estado global (usuario logueado)
```

## Instalación

> Nota: en esta copia del repositorio el backend está completo y listo para arrancar, pero el frontend no viene con un proyecto React funcional completo. Si solo necesitas levantar la API, sigue los pasos del backend.

### 1. Base de datos

```bash
createdb kouira_fichaje
psql kouira_fichaje < backend/db/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edita .env con tus datos de PostgreSQL
# Si tu frontend no corre en http://localhost:3000, ajusta FRONTEND_ORIGIN en .env
npm install
npm run dev
```

El backend responde en `http://localhost:3001` por defecto y también expone `GET /` y `GET /api/health` para comprobar que está vivo.

### 3. Frontend

```bash
cd frontend
npm install
# Si cambiaste el puerto o el host del backend, define REACT_APP_API_URL antes de arrancar.
# Ejemplo en PowerShell: $env:REACT_APP_API_URL='http://localhost:3001/api'
npm start
```

El frontend usa `REACT_APP_API_URL` si está definida; si no, apunta por defecto a `http://localhost:3001/api`.

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/login | Iniciar sesión |
| POST | /api/fichajes | Registrar entrada/salida |
| GET | /api/fichajes/mios | Historial del trabajador |
| GET | /api/fichajes/hoy | Todos los fichajes de hoy (admin) |
| GET | /api/fichajes/resumen | Resumen mensual (admin) |
| GET | /api/trabajadores | Listar trabajadores (admin) |
| POST | /api/trabajadores | Crear trabajador (admin) |

## Variables de entorno

Además de los datos de PostgreSQL y JWT, puedes configurar:

- `PORT`: puerto del backend, por defecto `3001`
- `FRONTEND_ORIGIN`: origen permitido por CORS, por defecto `http://localhost:3000`

## Usuario inicial

El `schema.sql` crea un usuario administrador inicial:

- `username`: `admin`
- `password`: `admin`

Úsalo solo para pruebas y cámbialo en cuanto entres por primera vez.
