
const { matchedData } = require('express-validator');
const {  formulacionMedicamentosModel,  detalleAdministracionMedicamentoModel,} = require('../models');
const { descontarStockPorAdministracion } = require('../utils/handleDescontarMedicamento');

const {
  inventarioMedicamentosSedeModel,
  inventarioMedicamentosPacienteModel,
} = require('../models');





const registrarAdministracionDosis = async (req, res) => {
  try {

    const { admin_id } = req.params;
    const se_id = req.session.se_id;
    const usuario_id = req.session.per_id;



    const data = matchedData(req);
    const {      
      // inv_med_sede_id, 
      // inv_med_pac_id, 
      origen_inventario, // 'sede' o 'paciente'
      detalle_hora,
      detalle_observaciones,
    } = data;

    // 1. Obtener formulación
    const formulacion = await formulacionMedicamentosModel.findByPk(admin_id);
    if (!formulacion) {
      return res.status(404).json({ message: "Formulación no encontrada" });
    }

    // 2. Validar si ya se completó
    const dosisActuales = await detalleAdministracionMedicamentoModel.count({
      where: { admin_id }
    });


    if (dosisActuales >= formulacion.admin_total_dosis_periodo) {
      return res.status(400).json({ message: "Ya se administraron todas las dosis" });
    }

    const numeroDosis = dosisActuales + 1;

    // 3. Buscar el inventario correspondiente
    let inventarioId;
    let inv_med_sede_id = null;
    let inv_med_pac_id = null;

    const med_id = formulacion.med_id;
    const pac_id = formulacion.pac_id;

    if (origen_inventario === 'sede') {
      const inventario = await inventarioMedicamentosSedeModel.findOne({
        where: { se_id, med_id }
      });
      if (!inventario) {
        return res.status(404).json({ message: "Inventario de sede no encontrado para este medicamento" });
      }

      inventarioId = inventario.med_sede_id;
      inv_med_sede_id = inventarioId;

    } else if (origen_inventario === 'paciente') {
      const inventario = await inventarioMedicamentosPacienteModel.findOne({
        where: { pac_id, med_id }
      });
      if (!inventario) {
        return res.status(404).json({ message: "Inventario del paciente no encontrado para este medicamento" });
      }
      inventarioId = inventario.med_pac_id;
      inv_med_pac_id = inventarioId;
    } else {
      return res.status(400).json({ message: "Origen de inventario inválido" });
    }

    // 4. Registrar en detalle_administracion_medicamento
    const nuevaDosis = await detalleAdministracionMedicamentoModel.create({
      admin_id,
      inv_med_sede_id, 
      inv_med_pac_id,
      detalle_numero_dosis: numeroDosis,
      detalle_fecha: new Date(),
      detalle_hora,
      detalle_observaciones,
    });

    // 5. Descontar del inventario
    const resultadoDescuento = await descontarStockPorAdministracion({
      med_id,
      usuarioId: usuario_id,
      inventarioOrigen: origen_inventario,
      inventarioId,
      se_id,
      pac_id,
      numeroDosis,
    });

    //  Actualizar estado de la formulación si ya se  inició o se completó
    if (numeroDosis === 1 ) {
      formulacion.admin_estado = 'En Curso';
      await formulacion.save();
    }


    if (numeroDosis >= formulacion.admin_total_dosis_periodo) {
      formulacion.admin_estado = 'Completada';
      await formulacion.save();
    }

    return res.status(200).json({
      message: "Dosis registrada correctamente",
      detalle: nuevaDosis,
      descuento: resultadoDescuento,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al registrar dosis", error: error.message });
  }
}

module.exports = { registrarAdministracionDosis };
