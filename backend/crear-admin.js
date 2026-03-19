/**
 * Script para crear el primer usuario administrador
 * Ejecutar UNA SOLA VEZ:  node crear-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');

async function crearAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const existe = await Usuario.findOne({ rol: 'admin' });
    if (existe) {
      console.log('⚠️  Ya existe un administrador:', existe.email);
      process.exit(0);
    }

    const admin = await Usuario.create({
      nombre: 'Admin',
      apellido: 'Sistema',
      email: 'admin@universidad.edu.ar',
      password: 'Admin1234!',   // ← CAMBIÁ ESTO después del primer login
      rol: 'admin'
    });

    console.log('✅ Administrador creado exitosamente:');
    console.log('   Email:    ', admin.email);
    console.log('   Password: Admin1234!  ← ¡Cambiala en producción!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

crearAdmin();
