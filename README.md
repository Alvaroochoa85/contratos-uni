# 🎓 UniContratos — Sistema de Gestión de Contratos Universitarios

Sistema completo para registrar y gestionar contratos de personal y empresas en la universidad, con alertas automáticas de vencimiento.

---

## 📋 Características

- **Login seguro** con JWT y bcrypt (roles: admin / operador / visualizador)
- **Gestión completa** de contratos: alta, edición, eliminación, búsqueda y filtros
- **Alertas automáticas** 15 días antes del vencimiento de contrato y seguro
- **Dashboard** con estadísticas y gráficos
- **Exportar CSV** de todos los contratos
- **Paginación** y búsqueda en tiempo real
- **Cron job** diario a las 8 AM para verificar vencimientos

---

## 🛠️ Tecnologías

- **Backend:** Node.js, Express, MongoDB/Mongoose, JWT, bcrypt, node-cron
- **Frontend:** React 18, React Router 6, Axios, Recharts, date-fns

---

## 🚀 Instalación paso a paso

### Requisitos previos
- Node.js v18 o superior
- MongoDB instalado y corriendo (o una URI de MongoDB Atlas)

---

### 1. Clonar / descomprimir el proyecto

```bash
# Si lo descargaste como ZIP, descomprimilo y entrá a la carpeta:
cd contratos-uni
```

---

### 2. Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear el archivo de configuración
cp .env.example .env
```

Editá el archivo `.env` con tus datos:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/contratos_universidad
JWT_SECRET=cambia_esto_por_una_clave_muy_larga_y_segura_2024
JWT_EXPIRES_IN=8h
NODE_ENV=development
```

---

### 3. Crear el primer usuario administrador

```bash
# Dentro de la carpeta backend:
node crear-admin.js
```

Esto crea:
- **Email:** admin@universidad.edu.ar
- **Password:** Admin1234!

⚠️ **Cambiá la contraseña después del primer login** (desde el panel de usuarios).

---

### 4. Iniciar el Backend

```bash
# Desarrollo (con hot-reload)
npm run dev

# Producción
npm start
```

El servidor corre en: `http://localhost:5000`

---

### 5. Configurar e iniciar el Frontend

```bash
# En otra terminal, desde la raíz del proyecto:
cd frontend

# Instalar dependencias
npm install

# Iniciar
npm start
```

La app abre en: `http://localhost:3000`

---

## 👤 Roles y permisos

| Acción | Visualizador | Operador | Admin |
|--------|-------------|----------|-------|
| Ver contratos | ✅ | ✅ | ✅ |
| Crear/editar contratos | ❌ | ✅ | ✅ |
| Eliminar contratos | ❌ | ❌ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |

---

## 🔔 Sistema de alertas

- El sistema verifica automáticamente **todos los días a las 8:00 AM**
- Se genera una alerta cuando faltan **15 días o menos** para el vencimiento
- Las alertas se muestran en el sidebar con un badge rojo
- En la página de Alertas se separan en **Urgentes** (≤7 días) y **Próximas** (8-15 días)
- Se pueden marcar como leídas individualmente o todas juntas

---

## 📁 Estructura del proyecto

```
contratos-uni/
├── backend/
│   ├── server.js              # Servidor principal + cron
│   ├── crear-admin.js         # Script inicial (ejecutar 1 vez)
│   ├── .env.example           # Variables de entorno
│   ├── models/
│   │   ├── Usuario.js
│   │   ├── Contrato.js
│   │   └── Alerta.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── contratos.js
│   │   └── alertas.js
│   ├── middleware/
│   │   └── auth.js
│   └── config/
│       └── alertas.js         # Lógica de verificación
└── frontend/
    ├── public/index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── index.css
        ├── context/AuthContext.js
        ├── components/Layout.js
        └── pages/
            ├── Login.js
            ├── Dashboard.js
            ├── Contratos.js
            ├── FormContrato.js
            ├── Alertas.js
            └── Usuarios.js
```

---

## 🔒 Seguridad implementada

- Contraseñas hasheadas con **bcrypt** (12 rondas)
- Tokens **JWT** con expiración de 8 horas
- **Rate limiting**: 100 req/15min general, 10 req/15min en login
- **Helmet.js** para headers de seguridad HTTP
- Validación de datos en backend con **express-validator**
- CORS restringido al origen del frontend

---

## ❓ Soporte

Si necesitás ayuda con la instalación o tenés algún problema, revisá:
1. Que MongoDB esté corriendo: `mongod --version`
2. Que Node.js sea v18+: `node --version`
3. Que el archivo `.env` esté bien configurado
4. Los logs del servidor para mensajes de error
