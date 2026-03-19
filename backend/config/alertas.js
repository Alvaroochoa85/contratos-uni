const Contrato = require('../models/Contrato');
const Alerta = require('../models/Alerta');

const verificarAlertas = async () => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const en15dias = new Date(hoy.getTime() + 15 * 24 * 60 * 60 * 1000);
    en15dias.setHours(23, 59, 59, 999);

    // Contratos con vencimiento en los próximos 15 días
    const contratosProximos = await Contrato.find({
      fechaVencimientoContrato: { $gte: hoy, $lte: en15dias },
      estado: { $ne: 'Cancelado' }
    });

    for (const contrato of contratosProximos) {
      const diasRestantes = Math.ceil(
        (new Date(contrato.fechaVencimientoContrato) - hoy) / (1000 * 60 * 60 * 24)
      );

      // Actualizar estado del contrato
      await Contrato.findByIdAndUpdate(contrato._id, { estado: 'Por Vencer' });

      // Crear alerta si no existe una activa para este contrato
      const alertaExiste = await Alerta.findOne({
        contrato: contrato._id,
        tipo: 'contrato',
        leida: false
      });

      if (!alertaExiste) {
        await Alerta.create({
          contrato: contrato._id,
          tipo: 'contrato',
          diasRestantes,
          fechaVencimiento: contrato.fechaVencimientoContrato
        });
        console.log(`🔔 Alerta contrato creada: ${contrato.apellido}, ${contrato.nombre} - ${diasRestantes} días`);
      } else {
        // Actualizar días restantes
        await Alerta.findByIdAndUpdate(alertaExiste._id, { diasRestantes });
      }
    }

    // Contratos vencidos
    await Contrato.updateMany(
      { fechaVencimientoContrato: { $lt: hoy }, estado: { $in: ['Vigente', 'Por Vencer'] } },
      { estado: 'Vencido' }
    );

    // Seguros con vencimiento en los próximos 15 días
    const segurosProximos = await Contrato.find({
      fechaVencimientoSeguro: { $gte: hoy, $lte: en15dias },
      estado: { $ne: 'Cancelado' }
    });

    for (const contrato of segurosProximos) {
      const diasRestantes = Math.ceil(
        (new Date(contrato.fechaVencimientoSeguro) - hoy) / (1000 * 60 * 60 * 24)
      );

      const alertaExiste = await Alerta.findOne({
        contrato: contrato._id,
        tipo: 'seguro',
        leida: false
      });

      if (!alertaExiste) {
        await Alerta.create({
          contrato: contrato._id,
          tipo: 'seguro',
          diasRestantes,
          fechaVencimiento: contrato.fechaVencimientoSeguro
        });
        console.log(`🔔 Alerta seguro creada: ${contrato.apellido}, ${contrato.nombre} - ${diasRestantes} días`);
      } else {
        await Alerta.findByIdAndUpdate(alertaExiste._id, { diasRestantes });
      }
    }

    console.log(`✅ Verificación de alertas completada. ${contratosProximos.length} contratos y ${segurosProximos.length} seguros próximos.`);
  } catch (err) {
    console.error('❌ Error al verificar alertas:', err.message);
  }
};

module.exports = { verificarAlertas };
