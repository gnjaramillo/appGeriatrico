const { Op } = require('sequelize');
const { Sequelize } = require("sequelize");
const { sequelize } = require('../config/mysql'); 
const { io } = require('../utils/handleSocket'); 
const moment = require('moment-timezone');
const { matchedData } = require('express-validator');
const { formulacionMedicamentosModel, detalleAdministracionMedicamentoModel,  personaModel,sedePersonaRolModel, medicamentosModel, pacienteModel } = require('../models');



// ingresar formula medica
const registrarDetalleFormulacionMedicamento = async (req, res) => {
    try {
      const { admin_id } = req.params;
      const se_id = req.session.se_id;
      const data = matchedData(req);
      const {
        inv_med_sede_id,
        inv_med_pac_id,
        detalle_fecha,
        detalle_hora,
        detalle_observaciones
} = data;

// Validar que la formulación exista
const formulacion = await formulacionMedicamentosModel.findByPk(admin_id);
if (!formulacion) return res.status(404).json({ error: 'Formulación no encontrada' });

// Obtener el número de dosis aplicada hasta ahora
const dosisAplicadas = await detalleAdministracionMedicamentoModel.count({ where: { admin_id } });
const siguienteDosis = dosisAplicadas + 1;

// Insertar el detalle de administración
const nuevoDetalle = await detalle_administracion_medicamento.create({
    admin_id,
    inv_med_sede_id: inv_med_sede_id || null,
    inv_med_pac_id: inv_med_pac_id || null,
    detalle_numero_dosis: siguienteDosis,
    detalle_fecha,
    detalle_hora,
    detalle_observaciones
  });

  // Descontar inventario según procedencia del medicamento
  await descontarInventario({ inv_med_sede_id, inv_med_pac_id, admin_id });


      // Actualizar el estado de la formulación
    const totalDosisPeriodo = formulacion.admin_total_dosis_periodo;

    const nuevoEstado =
      siguienteDosis === totalDosisPeriodo ? 'Completado' : 'En Curso';

    await formulacion.update({ admin_estado: nuevoEstado });


    res.status(201).json({ mensaje: 'Dosis registrada correctamente', detalle: nuevoDetalle });

} catch (error) {
  console.error('Error al registrar dosis:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
}
};

module.exports = { registrarDosis };