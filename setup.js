/**
 * Script que detecta la IP local automáticamente y genera el .env del frontend
 * Ejecutar desde la carpeta raíz del proyecto: node setup.js
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function obtenerIPLocal() {
  const interfaces = os.networkInterfaces();
  for (const nombre of Object.keys(interfaces)) {
    for (const iface of interfaces[nombre]) {
      // Buscar IPv4 que no sea loopback
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const ip = obtenerIPLocal();
const puerto = 5000;
const apiUrl = `http://${ip}:${puerto}/api`;

console.log('');
console.log('🔍 Detectando configuración de red...');
console.log(`📡 IP detectada: ${ip}`);
console.log(`🔗 URL del backend: ${apiUrl}`);
console.log('');

// Crear frontend/.env
const envFrontend = `# Generado automáticamente por setup.js
# IP detectada: ${ip}
REACT_APP_API_URL=${apiUrl}
`;

const envPath = path.join(__dirname, 'frontend', '.env');
fs.writeFileSync(envPath, envFrontend);
console.log(`✅ Archivo frontend/.env creado con IP ${ip}`);

// Actualizar CORS en backend server.js
const serverPath = path.join(__dirname, 'backend', 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Reemplazar el bloque CORS con la IP actual
const corsRegex = /app\.use\(cors\(\{[\s\S]*?\}\)\);/;
const nuevosCors = `app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://${ip}:3000'
  ],
  credentials: true
}));`;

if (corsRegex.test(serverContent)) {
  serverContent = serverContent.replace(corsRegex, nuevosCors);
  fs.writeFileSync(serverPath, serverContent);
  console.log(`✅ CORS actualizado en backend/server.js para IP ${ip}`);
} else {
  console.log('⚠️  No se pudo actualizar CORS automáticamente. Hacelo manualmente.');
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 Configuración lista. Ahora ejecutá:');
console.log('');
console.log('   Terminal 1 (backend):');
console.log('   cd backend && npm run dev');
console.log('');
console.log('   Terminal 2 (frontend):');
console.log('   cd frontend && npm start');
console.log('');
console.log(`🌐 La app estará disponible en:`);
console.log(`   → Esta PC:       http://localhost:3000`);
console.log(`   → Otras PCs:     http://${ip}:3000`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');