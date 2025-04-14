
const { matchedData } = require('express-validator');
const { sequelize } = require('../config/mysql');
const { io } = require('../utils/handleSocket'); 
const moment = require('moment-timezone');

const {  formulacionMedicamentosModel,  detalleAdministracionMedicamentoModel, medicamentosModel} = require('../models');
const { descontarStockPorAdministracion } = require('../utils/handleDescontarMedicamento');

const {
  inventarioMedicamentosSedeModel,
  inventarioMedicamentosPacienteModel,
} = require('../models');




// registrar dosis efectivamente suministradas de una formulacion especifica (enfermera)
const registrarAdministracionDosis = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { admin_id } = req.params;
    const se_id = req.session.se_id;
    const usuario_id = req.session.per_id;
    const data = matchedData(req);
    const { origen_inventario, detalle_hora, detalle_observaciones } = data;

    const formulacion = await formulacionMedicamentosModel.findByPk(admin_id, { transaction: t });
    if (!formulacion) throw new Error("Formulación no encontrada");

    const dosisActuales = await detalleAdministracionMedicamentoModel.count({
      where: { admin_id },
      transaction: t
    });

    if (dosisActuales >= formulacion.admin_total_dosis_periodo) {
      throw new Error("Ya se administraron todas las dosis");
    }

    const numeroDosis = dosisActuales + 1;
    const med_id = formulacion.med_id;
    const pac_id = formulacion.pac_id;

    let inventarioId, inv_med_sede_id = null, inv_med_pac_id = null;

    if (origen_inventario === 'sede') {
      const inventario = await inventarioMedicamentosSedeModel.findOne({
        where: { se_id, med_id },
        transaction: t
      });
      if (!inventario) throw new Error("Inventario de sede no encontrado");
      inventarioId = inventario.med_sede_id;
      inv_med_sede_id = inventarioId;

    } else if (origen_inventario === 'paciente') {
      const inventario = await inventarioMedicamentosPacienteModel.findOne({
        where: { pac_id, med_id },
        transaction: t
      });
      if (!inventario) throw new Error("Inventario del paciente no encontrado");
      inventarioId = inventario.med_pac_id;
      inv_med_pac_id = inventarioId;
    } else {
      throw new Error("Origen de inventario inválido");
    }

    const nuevaDosis = await detalleAdministracionMedicamentoModel.create({
      admin_id,
      inv_med_sede_id,
      inv_med_pac_id,
      detalle_numero_dosis: numeroDosis,
      detalle_fecha: new Date(),
      detalle_hora,
      detalle_observaciones,
    }, { transaction: t });

    const resultadoDescuento = await descontarStockPorAdministracion({
      med_id,
      admin_id,
      usuarioId: usuario_id,
      inventarioOrigen: origen_inventario,
      inventarioId,
      se_id,
      pac_id,
      numeroDosis,
      transaction: t
    });

    if (resultadoDescuento.error) throw new Error(resultadoDescuento.message);

    // Actualizar estado
    if (numeroDosis === 1) formulacion.admin_estado = 'En Curso';
    if (numeroDosis >= formulacion.admin_total_dosis_periodo) formulacion.admin_estado = 'Completado';
    await formulacion.save({ transaction: t });

    await t.commit();

    io.emit('dosis-administrada', {
      pac_id,
      med_id,
      numeroDosis,
      admin_id,
      detalle: nuevaDosis,
      estado_formulacion: formulacion.admin_estado
    });

    return res.status(200).json({
      message: "Dosis registrada correctamente",
      detalle: nuevaDosis,
      descuento: resultadoDescuento,
    });

  } catch (error) {
    await t.rollback();
    console.error("💥 Error registrar dosis:", error);
    return res.status(500).json({
      message: "Error al registrar dosis",
      error: error.message
    });
  }
};




/* const obtenerDosisDelDia = async (req, res) => {
  try {
    const hoy = moment().tz("America/Bogota").format("YYYY-MM-DD");
    const { pac_id } = req.params;

    // Obtiene todas las formulaciones del paciente
    const formulas = await formulacionMedicamentosModel.findAll({
      where: { pac_id },
      attributes: ['admin_id'],
    });

    // Extrae los IDs de formulación para buscar en detalle
    const adminIds = formulas.map(f => f.admin_id);

    const dosisHoy = await detalleAdministracionMedicamentoModel.findAll({
      where: {
        detalle_fecha: hoy,
        admin_id: adminIds,
      },
      include: [
        {
          model: formulacionMedicamentosModel,
          as: "formulacion",
          attributes: [
            "admin_id",
            "med_id",
            "admin_dosis_por_toma",
            "admin_tipo_cantidad",
            "admin_metodo"
          ],
          include: [
            {
              model: medicamentosModel,
              as: "medicamentos_formulados",
              attributes: ["med_nombre", "med_presentacion"]
            }
          ]
        }
      ],
      order: [["detalle_hora", "ASC"]]
    });

    const resultado = dosisHoy.map(d => ({
      admin_id: d.formulacion.admin_id,
      med_id: d.formulacion.med_id,
      med_nombre: d.formulacion.medicamentos_formulados.med_nombre,
      med_presentacion: d.formulacion.medicamentos_formulados.med_presentacion,
      detalle_numero_dosis: d.detalle_numero_dosis,
      detalle_fecha: d.detalle_fecha,
      detalle_hora: d.detalle_hora,
      admin_dosis_por_toma: d.formulacion.admin_dosis_por_toma,
      admin_tipo_cantidad: d.formulacion.admin_tipo_cantidad,
      admin_metodo: d.formulacion.admin_metodo,
    }));

    res.status(200).json({ dosis: resultado });
  } catch (error) {
    console.error("Error al obtener las dosis del día:", error);
    res.status(500).json({ message: "Error al obtener las dosis del día." });
  }
};
 */




// vista enfermera, admin sede y acudiente.. ver detalle cada dosis de la formula
const obtenerDetallesDeAdministracionPorFormula = async (req, res) => {
  try {
    const { admin_id } = req.params;

    // Obtener la formulación
    const formulacion = await formulacionMedicamentosModel.findByPk(admin_id, {
      include: [
        {
          model: medicamentosModel,
          as: "medicamentos_formulados",
          attributes: ["med_nombre"],
        },
        {
          model: detalleAdministracionMedicamentoModel,
          as: "medicamento_administrado",
          attributes: ["detalle_numero_dosis", "detalle_fecha", "detalle_hora", "detalle_observaciones"],
        }
      ]
    });

    if (!formulacion) {
      return res.status(404).json({ message: "Formulación no encontrada" });
    }

    const resultado = {
      admin_id: formulacion.admin_id,
      pac_id: formulacion.pac_id,
      med_id: formulacion.med_id,
      medicamentos_formulados: formulacion.medicamentos_formulados,
      // admin_fecha_inicio: formulacion.admin_fecha_inicio,
      // admin_fecha_fin: formulacion.admin_fecha_fin,
      admin_dosis_por_toma: formulacion.admin_dosis_por_toma,
      // admin_tipo_cantidad: formulacion.admin_tipo_cantidad,
      // admin_metodo: formulacion.admin_metodo,
      // admin_estado: formulacion.admin_estado,
      detalles_administracion: formulacion.medicamento_administrado
    };

    res.status(200).json({ resultado });
  } catch (error) {
    console.error("Error al obtener los detalles de la formulación:", error);
    res.status(500).json({ message: "Error al obtener los detalles de la formulación." });
  }
};


module.exports = { registrarAdministracionDosis, obtenerDetallesDeAdministracionPorFormula };

