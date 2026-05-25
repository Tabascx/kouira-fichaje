# KOUIRA FICHAJE - GUÍA DE PRUEBA Y USO

## ✅ LO QUE ESTÁ LISTO

### 1. **Eliminar fichajes errados**
- En el panel admin, pestaña "Hoy"
- Cada fichaje tiene un botón rojo con "✕" para eliminarlo
- Solo el admin puede eliminar

### 2. **Crear fichaje manual (admin)**
- En el panel admin, pestaña "Hoy"
- Botón "+ Fichaje manual"
- Elige trabajador, tipo (entrada/salida) y fecha/hora exacta
- Crea el fichaje al pasado si el trabajador olvidó fichar

### 3. **Cambio obligatorio de contraseña al entrar**
- Cuando un trabajador entra con contraseña temporal
- Aparece un modal "Cambiar contraseña"
- Debe rellenarla antes de poder fichar
- Solo se pide una vez (se guarda en localStorage)

### 4. **App en iPhone como PWA**
- Manifest actualizado con nombre "Kouira" y tema azul
- Frontend apunta a `192.168.1.20:3002` en archivo `.env`
- Backend escucha en `0.0.0.0` y CORS permite IPs locales 192.168.x.x

---

## 🚀 CÓMO PROBAR EN IPHONE 11

### Paso 1: Asegúrate de que PC e iPhone están en la misma Wi-Fi
- Ambos deben estar en la red local
- IP del PC: `192.168.1.20` (ya configurada)

### Paso 2: Arranca el backend
```powershell
cd C:\Users\Kouir\Downloads\kouira-fichaje-backend\kouira-fichaje\backend
npm run dev
```

Debe mostrar:
```
Servidor corriendo en:
  - http://localhost:3002
  - http://192.168.1.20:3002
```

### Paso 3: Arranca el frontend
En otra terminal:
```powershell
cd C:\Users\Kouir\Downloads\kouira-fichaje-backend\kouira-fichaje\frontend
npm start
```

Espera a que compile. Verás:
```
Compiled successfully!
Local:      http://localhost:3000
```

### Paso 4: En el iPhone, abre Safari
Escribe en la barra de direcciones:
```
http://192.168.1.20:3000
```

### Paso 5: Añade como app en la pantalla de inicio (opcional pero recomendado)
1. En Safari, toca el botón de compartir
2. Selecciona "Añadir a la pantalla de inicio"
3. Dale un nombre (ej: "Kouira")
4. Toca "Añadir"

Ahora tienes la app en tu pantalla de inicio como si fuera una app nativa.

---

## 📋 CONTRASEÑAS ACTUALES PARA TRABAJADORES

| Trabajador | Usuario | Contraseña Temporal |
|-----------|---------|-------------------|
| Mahjoub Kouira | mahjoub.kouira | 00hcnol897 |
| Haytham Samouni | haytham.samouni | a3dbcc6847 |
| Mouhsin Kouira | mouhsin.kouira | 3lrdvues34 |

> **Importante**: Al entrar, el trabajador debe cambiar la contraseña. Luego puede fichar normalmente.

---

## 🔐 ADMIN

Usuario: `admin`  
Contraseña: `admin`

Panel admin: ver todos los fichajes de hoy, crear manuales, eliminar, restablecer contraseñas, etc.

---

## 📱 PRUEBAS EN EL IPHONE

### 1. Login y cambio de contraseña
```
1. Entra con mahjoub.kouira / 00hcnol897
2. Aparece modal "Cambiar contraseña"
3. Pon contraseña nueva (ej: "mahjoub123")
4. Confirma
```

### 2. Fichar entrada
```
1. Panel del trabajador
2. Toca botón "Registrar entrada"
3. Debe mostrar "Entrada registrada a las HH:MM"
4. El botón pasa a deshabilitado (hasta salida)
```

### 3. Fichar salida
```
1. Toca "Registrar salida"
2. Muestra "Salida registrada a las HH:MM"
3. Puede ver el historial abajo
```

### 4. Ver horas trabajadas
```
1. Abajo en "Horas trabajadas" muestra el total del día/mes
2. Historial muestra los últimos 20 fichajes
```

---

## ⚙️ PRUEBAS EN EL ADMIN (desde PC)

### 1. Crear fichaje manual
```
1. Panel Admin > Hoy
2. Botón "+ Fichaje manual"
3. Selecciona trabajador (ej: Mahjoub)
4. Tipo: entrada o salida
5. Hora: elige la hora que debería haber entrado
6. Crea
```

### 2. Eliminar fichaje errado
```
1. Hoy > tabla de fichajes
2. Botón rojo "✕" al lado del fichaje
3. Confirma eliminación
```

### 3. Restablecer contraseña (Equipo)
```
1. Panel Admin > Equipo
2. Botón "Restablecer contraseña" al lado del trabajador
3. Se genera nueva temporal
4. Cópiala con el botón "Copiar"
5. Dásela al trabajador
6. El trabajador entra con la nueva y debe cambiarla
```

---

## 🌐 CAMBIAR ENTRE ESPAÑOL Y ÁRABE

En cualquier pantalla, arriba a la derecha hay un selector:
- **ES** = Español
- **AR** = العربية (Árabe)

Todo se traduce al instante.

---

## 🔧 SI ALGO NO FUNCIONA

### "No se pudo conectar con el servidor" en iPhone
1. Verifica que el backend está levantado (`npm run dev`)
2. Verifica que escribiste bien `192.168.1.20:3000` (no `localhost`)
3. Verifica que ambos están en la misma Wi-Fi
4. Recarga la página

### "Error al registrar" en fichar
1. Verifica que el backend está levantado
2. Verifica que tienes internet
3. Mira la consola del navegador (F12 en PC, Safari dev tools en iPhone)

### PWA no se ve como app nativa
1. Asegúrate de añadirlo a la pantalla de inicio desde Safari
2. No funciona en Chrome en iPhone (requiere Safari)

---

## 📊 CARACTERÍSTICAS IMPLEMENTADAS

✅ Login con usuario/contraseña  
✅ Traducción completo (español + árabe)  
✅ Panel admin con todas las pestañas  
✅ Panel trabajador  
✅ Fichar entrada/salida automático  
✅ Crear fichajes manuales (admin)  
✅ Eliminar fichajes (admin)  
✅ Restablecer contraseña temporal (admin)  
✅ Cambio obligatorio de contraseña al primer login  
✅ PWA para instalarse en iPhone como app  
✅ CORS flexible para redes locales  
✅ Historial de fichajes  
✅ Resumen mensual  
✅ Ausencias  

---

## 🎯 PRÓXIMOS PASOS (OPCIONALES)

1. Exportar a Excel/PDF los resúmenes mensuales
2. Dashboard con estadísticas por trabajador
3. Notificaciones cuando se olvida fichar
4. Integración con calendario
5. Desplegar en servidor real (en lugar de localhost)


