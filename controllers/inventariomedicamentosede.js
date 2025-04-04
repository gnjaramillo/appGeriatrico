const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 
const { io } = require('../utils/handleSocket'); 
const moment = require('moment-timezone');
const { matchedData } = require('express-validator');
const { medicamentosModel, inventarioMedicamentosSedeModel } = require('../models');







// vincular medicamento al inventario de la sede, con un stock inicial (admin sede)
const registrarMedicamentoStockInvSede = async (req, res) => {
    try {
        const { med_id } = req.params;
        const data = matchedData(req);
        const { med_total_unidades_disponibles, med_origen, med_observaciones  } = data;
        const se_id = req.session.se_id; 

        if (!se_id) {
            return res.status(400).json({ message: "Sede no especificada en la sesión del usuario" });
        }

         // Validar que el medicamento exista
         const medicamento = await medicamentosModel.findByPk(med_id);
         if (!medicamento) {
             return res.status(404).json({ message: "El medicamento no existe." });
         }

         // Verificar si ya está registrado en la sede
         const existeInventario = await inventarioMedicamentosSedeModel.findOne({
            where: { se_id, med_id }
        });

        if (existeInventario) {
            return res.status(400).json({ message: "El medicamento ya está registrado en la sede. Solo puedes actualizar el stock." });
        }

        
        // Registrar el medicamento con la cantidad inicial indicada
        const nuevoMedicamento = await inventarioMedicamentosSedeModel.create({
            se_id,
            med_id,
            med_total_unidades_disponibles, 
            med_origen,
            med_observaciones: med_observaciones || ""
        });


        return res.status(201).json({ message: "Medicamento registrado exitosamente en la sede con stock inicial.", medicamento: nuevoMedicamento });
    } catch (error) {
        console.error("Error al registrar el medicamento:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};




// ver los medicamentos del inventario de la sede (admin sede)
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



// añadir stock a un medicamento de la sede
const agregarStockMedicamento = async (req, res) => {
    try {
        const data = matchedData(req);
        const { med_sede_id } = req.params;
        let { med_total_unidades_disponibles } = data;  // `med_cantidad` como let para poder modificarlo
        const se_id = req.session.se_id;

        if (!se_id) {
            return res.status(400).json({ message: "Sede no especificada en la sesión del usuario" });
        }

        // Buscar el medicamento en la sede
        const medicamento = await inventarioMedicamentosSedeModel.findOne({
            where: { med_sede_id, se_id }
        });

        if (!medicamento) {
            return res.status(404).json({ message: "Medicamento no encontrado en la sede." });
        }

        // Validar que la presentación NO se modifique
        if (data.med_presentacion && data.med_presentacion !== medicamento.med_presentacion) {
            return res.status(400).json({
                message: "No se puede cambiar la presentación del medicamento al agregar stock.",
            });
        }

        medicamento.med_total_unidades_disponibles += med_total_unidades_disponibles;


        // ✅ Guardar los cambios
        await medicamento.save();

        // 🔥 Emitir evento de stock actualizado
        io.emit("stockActualizado", { med_sede_id, med_total_unidades_disponibles: medicamento.med_total_unidades_disponibles });

        return res.status(200).json({ message: "Stock actualizado exitosamente", medicamento });
    } catch (error) {
        console.error("Error al actualizar el stock del medicamento:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};




// solo permite actualizar ciertos campos dependiendo del stock ( admin sede)
const actualizarMedicamento = async (req, res) => {
    try {
        const data = matchedData(req);
        const { med_sede_id } = req.params;
        const { med_nombre, med_presentacion, unidades_por_presentacion, med_descripcion } = data;
        const se_id = req.session.se_id;

        if (!se_id) {
            return res.status(400).json({ message: "Sede no especificada en la sesión del usuario" });
        }

        // Buscar el medicamento en la sede
        const medicamento = await inventarioMedicamentosSedeModel.findOne({
            where: { med_sede_id, se_id }
        });

        if (!medicamento) {
            return res.status(404).json({ message: "Medicamento no encontrado en la sede." });
        }

        // ⚠️ Si el medicamento tiene stock, NO permitir cambios en presentación ni unidades por presentación
        if (medicamento.med_total_unidades_disponibles > 0) {
            if (med_presentacion && med_presentacion !== medicamento.med_presentacion) {
                return res.status(400).json({
                    message: "No se puede cambiar la presentación de un medicamento con stock disponible.",
                });
            }

            if (unidades_por_presentacion && unidades_por_presentacion !== medicamento.unidades_por_presentacion) {
                return res.status(400).json({
                    message: "No se pueden cambiar las unidades por presentación de un medicamento con stock disponible.",
                });
            }
        } else {
            // Si no tiene stock, permitir cambios en presentación y unidades por presentación
            medicamento.med_presentacion = med_presentacion || medicamento.med_presentacion;
            medicamento.unidades_por_presentacion = unidades_por_presentacion || medicamento.unidades_por_presentacion;
        }

        // Actualizar siempre nombre y descripción si hay cambios
        let cambios = false;
        if (med_nombre && med_nombre !== medicamento.med_nombre) {
            medicamento.med_nombre = med_nombre;
            cambios = true;
        }

        if (med_descripcion !== undefined && med_descripcion !== medicamento.med_descripcion) {
            medicamento.med_descripcion = med_descripcion;
            cambios = true;
        }

        if (!cambios) {
            return res.status(200).json({ message: "No se realizaron cambios en el medicamento.", medicamento });
        }

        // Guardar cambios
        await medicamento.save();

        // 🔥 Emitir evento de WebSocket
        io.emit("medicamentoActualizado", { med_sede_id, medicamento });

        return res.status(200).json({ message: "Medicamento actualizado correctamente", medicamento });
    } catch (error) {
        console.error("Error al actualizar el medicamento:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};








module.exports = { registrarMedicamentoStockInvSede , obtenerMedicamentosInvSede,  agregarStockMedicamento, actualizarMedicamento };

