const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 
const { io } = require('../utils/handleSocket'); 
const moment = require('moment-timezone');
const { matchedData } = require('express-validator');
const {  inventarioMedicamentosPacienteModel, pacienteModel, medicamentosModel, sedePersonaRolModel, movimientosStockPacienteModel } = require('../models');





/* vinculacion inicial medicamento a inventario paciente, registran primer movimiento 
con stock igual o mayor a cero  (admin sede y enfermera) */

const vincularMedicamentoInvPac = async (req, res) => {
    const t = await sequelize.transaction(); // Iniciar transacción
  
    try {
    const { med_id, pac_id } = req.params;;
      const se_id = req.session.se_id;
      const usuario_id = req.session.per_id;
  
      const data = matchedData(req);
      const { cantidad, med_origen } = data;
  
      if (cantidad === undefined || cantidad < 0) {
        await t.rollback();
        return res.status(400).json({ message: "La cantidad no puede ser negativa" });
      }

        // Verificar existencia del paciente   
      const paciente = await pacienteModel.findOne({ where: { pac_id } });
      if (!paciente) {
          return res.status(404).json({ message: "Paciente no encontrado." });
      }

      const per_id = paciente.per_id;

      // Verificar si la persona tiene rol de paciente en la sede
      const rolesPaciente = await sedePersonaRolModel.findAll({
          where: { se_id, per_id, rol_id: 4 },
          attributes: ["sp_activo"],
      });

      if (rolesPaciente.length === 0) {
          return res.status(404).json({ message: "La persona no tiene un rol de paciente en esta sede." });
      }

      const tieneRolActivo = rolesPaciente.some((rol) => rol.sp_activo === true);

      if (!tieneRolActivo) {
          return res.status(403).json({ message: "El usuario tiene el rol de paciente en esta sede, pero está inactivo." });
      }

    // Verificar si ya está registrado en el inventario
      let inventario = await inventarioMedicamentosPacienteModel.findOne({
        where: { pac_id, med_id },
        transaction: t,
      });
  
      if (inventario) {
        await t.rollback();
        return res.status(400).json({ message: "El medicamento ya se encuentra en el inventario. Realice un nuevo ingreso desde el módulo de stock." });
      }

      // Crear inventario con stock inicial
      inventario = await inventarioMedicamentosPacienteModel.create({
        pac_id,
        med_id,
        med_total_unidades_disponibles: cantidad,
      }, { transaction: t });
  
      // Registrar movimiento inicial
      const movimiento = await movimientosStockPacienteModel.create({
        med_pac_id: inventario.med_pac_id,
        pac_id,
        med_id,
        usuario_id,
        cantidad,
        tipo: "Entrada",
        med_origen,
        med_destino: null,
        fecha: new Date(),
      }, { transaction: t });
  
      await t.commit(); // Éxito

      const datosCompletos = (await inventarioMedicamentosPacienteModel.findOne({
        where: { med_pac_id: inventario.med_pac_id },
        include: [{
          model: medicamentosModel,
          as: "medicamento",
          attributes: [
            "med_id",
            "med_nombre",
            "med_presentacion",
            "unidades_por_presentacion",
            "med_descripcion"
          ]
        }]
      })).toJSON();  

      const payload = {
        med_pac_id: datosCompletos.med_pac_id,
        med_id: datosCompletos.med_id,
        nombre: datosCompletos.medicamento.med_nombre,
        presentacion: datosCompletos.medicamento.med_presentacion,
        unidades_por_presentacion: datosCompletos.medicamento.unidades_por_presentacion,
        descripcion: datosCompletos.medicamento.med_descripcion,
        unidades_disponibles: datosCompletos.med_total_unidades_disponibles
      };



      // 🔴 Emitir evento por socket
      io.to(`paciente-${pac_id}`).emit("nuevo-medicamento-inventario-paciente", payload);

/*       io.emit('stockPacienteActualizado', {
        med_pac_id: inventario.med_pac_id,
        cantidadAgregada: cantidad,
        nuevoStock: inventario.med_total_unidades_disponibles,
        mensaje: "Nuevo medicamento vinculado al inventario del paciente.",
      });
 */
  
      return res.status(201).json({
        message: "Medicamento agregado al inventario paciente y  primer movimiento de stock registrado.",
        inventario,
        movimiento,
      });
  
    } catch (error) {
      // Solo intenta rollback si la transacción no está terminada
      if (!t.finished) await t.rollback(); 
      console.error("Error en vincularMedicamentoInvPac:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
};




// ver los medicamentos del inventario del paciente (admin sede, enfermera)
const obtenerMedicamentosInvPaciente = async (req, res) => {
    try {
        const se_id = req.session.se_id; // Obtener la sede desde la sesión
        const { pac_id } = req.params;


        if (!se_id) {
            return res.status(400).json({ message: "Sede no especificada en la sesión del usuario" });
        }

        const paciente = await pacienteModel.findOne({ where: { pac_id } });

        if (!paciente) {
            return res.status(404).json({ message: "Paciente no encontrado." });
        }


        const medicamentos = await inventarioMedicamentosPacienteModel.findAll({
            where: { pac_id },

            include: [
                {
                    model: pacienteModel,
                    as: "paciente",
                    attributes: ["pac_id"]
                },
                {
                    model: medicamentosModel,
                    as: "medicamento",
                    attributes: ["med_id", "med_nombre", "med_presentacion", "unidades_por_presentacion", "med_descripcion"]
                }
            ],
            attributes: [
                "med_pac_id", 
                "med_total_unidades_disponibles",
            ],
            order: [[{ model: medicamentosModel, as: "medicamento" }, "med_nombre", "ASC"]] // 🔹 Corrección aquí
        });

        const medicamentosMapeados = medicamentos.map(med => ({
            med_pac_id: med.med_pac_id,
            med_id: med.medicamento.med_id,
            med_total_unidades_disponibles: med.med_total_unidades_disponibles,
            med_nombre: med.medicamento.med_nombre,
            med_presentacion: med.medicamento.med_presentacion,
            unidades_por_presentacion: med.medicamento.unidades_por_presentacion,
            med_descripcion: med.medicamento.med_descripcion,
            pac_id: med.paciente.pac_id,

        }));
        
        
        
        return res.status(200).json({ message: "Lista de medicamentos", medicamentos: medicamentosMapeados });





    } catch (error) {
        console.error("Error al obtener los medicamentos:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};




// registrar entrada stock desde la lista de medicamentos del inventario del paciente (admin sede, enfermera)
const entradaStockMedicamentoInvPaciente = async (req, res) => {
    const t = await sequelize.transaction();
  
    try {
      const { med_pac_id } = req.params;
      const usuario_id = req.session.per_id;
      const se_id = req.session.se_id;
  
      const data = matchedData(req);
      const { cantidad, med_origen } = data;
  
      if (cantidad === undefined || cantidad <= 0) {
        await t.rollback();
        return res.status(400).json({ message: "La cantidad debe ser mayor a 0." });
      }
  
      const inventario = await inventarioMedicamentosPacienteModel.findByPk(med_pac_id, {
        // include: [{ model: pacienteModel, as: "paciente" }]
        include: [
            {
                model: pacienteModel,
                as: "paciente",
                attributes: ["pac_id"]
            }
        ],
      });
  
      if (!inventario) {
        await t.rollback();
        return res.status(404).json({ message: "Inventario del paciente no encontrado." });
      }
  
      const pac_id = inventario.pac_id;
      const paciente = await pacienteModel.findByPk(pac_id);
  
      if (!paciente) {
        await t.rollback();
        return res.status(404).json({ message: "Paciente no encontrado." });
      }
  
      const per_id = paciente.per_id;
  
      // Verificar rol activo del paciente en la sede
      const rolesPaciente = await sedePersonaRolModel.findAll({
        where: { se_id, per_id, rol_id: 4 },
        attributes: ["sp_activo"]
      });
  
      if (rolesPaciente.length === 0 || !rolesPaciente.some(r => r.sp_activo === true)) {
        await t.rollback();
        return res.status(403).json({ message: "El paciente no tiene un rol activo en esta sede." });
      }
  
      // Actualizar stock
      inventario.med_total_unidades_disponibles += cantidad;
      await inventario.save({ transaction: t });
  
      // Registrar el movimiento
      await movimientosStockPacienteModel.create({
        med_pac_id,
        pac_id,
        med_id: inventario.med_id,
        usuario_id,
        cantidad,
        tipo: "Entrada",
        med_origen,
        med_destino: null,
        fecha: new Date()
      }, { transaction: t });
  
      await t.commit();
  
      io.emit('stockActualizado', {
        med_pac_id,
        cantidadAgregada: cantidad,
        nuevoStock: inventario.med_total_unidades_disponibles,
      });
  
      return res.status(200).json({ message: "Ingreso de stock registrado correctamente.", inventario });
  
    } catch (error) {
      if (!t.finished) await t.rollback();
      console.error("Error al agregar stock al inventario del paciente:", error);
      return res.status(500).json({ message: "Error interno del servidor." });
    }
};




// registrar salida stock desde la lista de medicamentos del inventario del paciente (admin sede, enfermera)
const salidaStockMedicamentoInvPaciente = async (req, res) => {
    const t = await sequelize.transaction();
  
    try {
      const { med_pac_id } = req.params;
      const usuario_id = req.session.per_id;
      const se_id = req.session.se_id;
  
      const data = matchedData(req);
      const { cantidad, med_destino } = data;

      // ⚠️ Validar que no se use "Administración" como destino desde este flujo
      if (med_destino === 'Administración Paciente') {
        await t.rollback();
        return res.status(400).json({
          message: "Para registrar una administración de medicamento, debes hacerlo desde el módulo correspondiente del paciente.",
        });
      }
  
      // Validación de cantidad
      if (cantidad === undefined || cantidad <= 0) {
        await t.rollback();
        return res.status(400).json({ message: "La cantidad debe ser mayor a 0." });
      }
  
      // Buscar inventario del paciente
      const inventario = await inventarioMedicamentosPacienteModel.findByPk(med_pac_id, {
        // include: [{ model: pacienteModel, as: "paciente" }]
        include: [
            {
                model: pacienteModel,
                as: "paciente",
                attributes: ["pac_id"]
            }
        ],

      });
  
      if (!inventario) {
        await t.rollback();
        return res.status(404).json({ message: "Inventario del paciente no encontrado." });
      }
  
      const pac_id = inventario.pac_id;
      const paciente = await pacienteModel.findByPk(pac_id);
      if (!paciente) {
        await t.rollback();
        return res.status(404).json({ message: "Paciente no encontrado." });
      }
  
      const per_id = paciente.per_id;
  
      // Verificar que el paciente tenga rol activo en la sede
      const rolesPaciente = await sedePersonaRolModel.findAll({
        where: { se_id, per_id, rol_id: 4 },
        attributes: ["sp_activo"]
      });
  
      if (rolesPaciente.length === 0 || !rolesPaciente.some(r => r.sp_activo === true)) {
        await t.rollback();
        return res.status(403).json({ message: "El paciente no tiene un rol activo en esta sede." });
      }
  
      const stockDisponible = inventario.med_total_unidades_disponibles;
  
      if (cantidad > stockDisponible) {
        await t.rollback();
        return res.status(400).json({ message: `La cantidad solicitada supera el stock actual del medicamento, que actualmente es de ${stockDisponible} unidades.` });
      }
  
      // Actualizar stock
      inventario.med_total_unidades_disponibles -= cantidad;
      await inventario.save({ transaction: t });
  
      // Registrar el movimiento
      await movimientosStockPacienteModel.create({
        med_pac_id,
        pac_id,
        med_id: inventario.med_id,
        usuario_id,
        cantidad,
        tipo: "Salida",
        med_origen: null,
        med_destino,
        fecha: new Date()
      }, { transaction: t });
  
      await t.commit();
  
      // Emitir evento por socket
      io.emit('stockActualizado', {
        med_pac_id,
        cantidadRetirada: cantidad,
        nuevoStock: inventario.med_total_unidades_disponibles,
      });
  
      return res.status(200).json({ message: "Salida de stock registrada correctamente.", inventario });
  
    } catch (error) {
      if (!t.finished) await t.rollback();
      console.error("Error al disminuir stock del paciente:", error);
      return res.status(500).json({ message: "Error interno del servidor." });
    }
};






module.exports = { vincularMedicamentoInvPac, obtenerMedicamentosInvPaciente, entradaStockMedicamentoInvPaciente, salidaStockMedicamentoInvPaciente  };

