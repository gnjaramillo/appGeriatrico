const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 
const { io } = require('../utils/handleSocket'); 
const moment = require('moment-timezone');
const { matchedData } = require('express-validator');
const { medicamentosModel, inventarioMedicamentosSedeModel, movimientosStockSedeModel } = require('../models');




// vinculacion inicial medicamento a inventario sede, registran primer movimiento con stock igual o mayor a cero  (admin sede y enfermera)
const vincularMedicamentoInvSede = async (req, res) => {
    const t = await sequelize.transaction(); // Iniciar transacción
  
    try {
      const { med_id } = req.params;
      const se_id = req.session.se_id;
      const usuario_id = req.session.per_id;
  
      const data = matchedData(req);
      const { cantidad, med_origen } = data;
  
      if (cantidad === undefined || cantidad < 0) {
        await t.rollback();
        return res.status(400).json({ message: "La cantidad no puede ser negativa" });
      }
  
      let inventario = await inventarioMedicamentosSedeModel.findOne({
        where: { se_id, med_id },
        transaction: t,
      });
  
      if (inventario) {
        await t.rollback();
        return res.status(400).json({ message: "El medicamento ya se encuentra en el inventario. Realice un nuevo ingreso desde el módulo de stock." });
      }
  
      inventario = await inventarioMedicamentosSedeModel.create({
        se_id,
        med_id,
        med_total_unidades_disponibles: cantidad,
      }, { transaction: t });
  
      const movimiento = await movimientosStockSedeModel.create({
        med_sede_id: inventario.med_sede_id,
        se_id,
        med_id,
        usuario_id,
        cantidad,
        tipo: "Entrada",
        med_origen,
        med_destino: null,
        fecha: new Date(),
      }, { transaction: t });
  
      await t.commit(); // Éxito


      // 🔴 Emitir evento por socket
    io.emit('stockActualizado', {
        med_sede_id: inventario.med_sede_id,
        cantidadAgregada: cantidad,
        nuevoStock: inventario.med_total_unidades_disponibles,
        mensaje: "Nuevo medicamento vinculado al inventario.",
      });
  
      return res.status(201).json({
        message: "Medicamento agregado al inventario sede y registrado el primer movimiento de stock.",
        inventario,
        movimiento,
      });
  
    } catch (error) {
      // Solo intenta rollback si la transacción no está terminada
      if (!t.finished) await t.rollback(); 
      console.error("Error en vincularMedicamentoInvSede:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
};



// ver los medicamentos del inventario de la sede (admin sede, enfermera)
const obtenerMedicamentosInvSede = async (req, res) => {
    try {
        const se_id = req.session.se_id; // Obtener la sede desde la sesión

        if (!se_id) {
            return res.status(400).json({ message: "Sede no especificada en la sesión del usuario." });
        }

        // Consultar los medicamentos de la sede
        const medicamentos = await inventarioMedicamentosSedeModel.findAll({
            where: { se_id },
            include: [
                {
                    model: medicamentosModel,
                    as: "medicamento",
                    attributes: ["med_id", "med_nombre", "med_presentacion", "unidades_por_presentacion", "med_descripcion"]
                }
            ],
            attributes: [
                "med_sede_id", 
                "med_total_unidades_disponibles",
            ],
            order: [[{ model: medicamentosModel, as: "medicamento" }, "med_nombre", "ASC"]] // 🔹 Corrección aquí
        });

        const medicamentosMapeados = medicamentos.map(med => ({
            med_sede_id: med.med_sede_id,
            med_id: med.medicamento.med_id,
            med_total_unidades_disponibles: med.med_total_unidades_disponibles,
            med_nombre: med.medicamento.med_nombre,
            med_presentacion: med.medicamento.med_presentacion,
            unidades_por_presentacion: med.medicamento.unidades_por_presentacion,
            med_descripcion: med.medicamento.med_descripcion
        }));
        
        
        
        return res.status(200).json({ message: "Lista de medicamentos", medicamentos: medicamentosMapeados });
        

        // return res.status(200).json({ message: "Lista de medicamentos", medicamentos });
    } catch (error) {
        console.error("Error al obtener los medicamentos:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    }
};



// registrar entrada stock desde la lista de medicamentos del inventario de la sede (admin sede, enfermera)
const entradaStockMedicamentoInvSede = async (req, res) => {
    const t = await sequelize.transaction();
  
    try {
      const { med_sede_id } = req.params;
      const usuario_id = req.session.per_id;
      const se_id = req.session.se_id;
  
      const data = matchedData(req);
      const { cantidad, med_origen } = data;
  
      // Validación
      if (cantidad === undefined || cantidad <= 0) {
        await t.rollback();
        return res.status(400).json({ message: "La cantidad debe ser mayor a 0." });
      }
  
      // Buscar el inventario
      const inventario = await inventarioMedicamentosSedeModel.findByPk(med_sede_id);
  
      if (!inventario) {
        await t.rollback();
        return res.status(404).json({ message: "Inventario no encontrado." });
      }
  
      // Verificar que pertenezca a la sede del usuario
      if (inventario.se_id !== se_id) {
        await t.rollback();
        return res.status(403).json({ message: "No tienes permiso para modificar este inventario." });
      }
  
      // Actualizar stock
      inventario.med_total_unidades_disponibles += cantidad;
      await inventario.save({ transaction: t });
  
      // Registrar el movimiento
      await movimientosStockSedeModel.create({
        med_sede_id,
        se_id,
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
        med_sede_id,
        cantidadAgregada: cantidad,
        nuevoStock: inventario.med_total_unidades_disponibles,
      });
      
      return res.status(200).json({ message: "Ingreso de stock registrado correctamente.", inventario });
  
    } catch (error) {
      if (!t.finished) await t.rollback();
      console.error("Error al agregar stock:", error);
      return res.status(500).json({ message: "Error interno del servidor." });
    }
};




// registrar salida stock desde la lista de medicamentos del inventario de la sede (admin sede, enfermera)
const salidaStockMedicamentoInvSede = async (req, res) => {
    const t = await sequelize.transaction();
  
    try {
      const { med_sede_id } = req.params;
      const usuario_id = req.session.per_id;
      const se_id = req.session.se_id;
  
      const data = matchedData(req);
      const { cantidad, med_destino } = data;
  
      // Validación
      if (cantidad === undefined || cantidad <= 0) {
        await t.rollback();
        return res.status(400).json({ message: "La cantidad debe ser mayor a 0." });
      }
  
      // Buscar el inventario
      const inventario = await inventarioMedicamentosSedeModel.findByPk(med_sede_id);
  
      if (!inventario) {
        await t.rollback();
        return res.status(404).json({ message: "Inventario no encontrado." });
      }
  
      // Verificar que pertenezca a la sede del usuario
      if (inventario.se_id !== se_id) {
        await t.rollback();
        return res.status(403).json({ message: "No tienes permiso para modificar este inventario." });
      }

      med_total_unidades_disponibles = inventario.med_total_unidades_disponibles
  
      // Verificar stock disponible
      if (cantidad > inventario.med_total_unidades_disponibles) {
        await t.rollback();
        return res.status(400).json({ message: `La cantidad solicitada supera el stock actual del medicamento, que actualmente es de ${med_total_unidades_disponibles} unidades.` });

    }
  
      // Actualizar stock
      inventario.med_total_unidades_disponibles -= cantidad;
      await inventario.save({ transaction: t });
  
      // Registrar el movimiento
      await movimientosStockSedeModel.create({
        med_sede_id,
        se_id,
        med_id: inventario.med_id,
        usuario_id,
        cantidad,
        tipo: "Salida",
        med_origen: null,
        med_destino,
        fecha: new Date()
      }, { transaction: t });
  
      await t.commit();
  
      // Emitir evento
      io.emit('stockActualizado', {
        med_sede_id,
        cantidadRetirada: cantidad,
        nuevoStock: inventario.med_total_unidades_disponibles,
      });
  
      return res.status(200).json({ message: "Salida de stock registrada correctamente.", inventario });
  
    } catch (error) {
      if (!t.finished) await t.rollback();
      console.error("Error al disminuir stock:", error);
      return res.status(500).json({ message: "Error interno del servidor." });
    }
};






module.exports = { 
    vincularMedicamentoInvSede,     
    obtenerMedicamentosInvSede,  
    entradaStockMedicamentoInvSede, 
    salidaStockMedicamentoInvSede, 
};

