const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 
const { getIo } = require('../utils/handleSocket'); 
const moment = require('moment-timezone');
const { matchedData } = require('express-validator');
const {  inventarioMedicamentosPacienteModel, pacienteModel, sedePersonaRolModel } = require('../models');





// ingresar medicamento al inventario del paciente, sin stock inicial (admin sede)
const registrarMedicamentoPaciente = async (req, res) => {
    try {
        const { pac_id } = req.params;
        const data = matchedData(req);
        const { med_nombre, med_presentacion, unidades_por_presentacion, med_descripcion } = data;
        const se_id = req.session.se_id; 

        if (!se_id) {
            return res.status(400).json({ message: "Sede no especificada en la sesión del usuario" });
        }
        

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

        // 🚫 No permitir ingresar cantidad al registrar un medicamento
        const med_cantidad = 0;
        const med_total_unidades_disponibles = 0;

        // 🔴 Validar que unidades_por_presentacion sea mayor a 0
        if (unidades_por_presentacion <= 0) {
            return res.status(400).json({ message: "Las unidades por presentación deben ser mayores a 0." });
        }       



        const nuevoMedicamento = await inventarioMedicamentosPacienteModel.create({
            pac_id,
            med_nombre,
            med_cantidad,
            med_presentacion,
            unidades_por_presentacion,
            med_total_unidades_disponibles,
            med_descripcion: med_descripcion || null // Si no se envía, queda como null
        });

        return res.status(201).json({ message: "Medicamento registrado exitosamente", medicamento: nuevoMedicamento });
    } catch (error) {
        console.error("Error al registrar el medicamento:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};


// ver los medicamentos del inventario de la sede (admin sede)
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


        // Consultar los medicamentos de la sede
        const medicamentos = await inventarioMedicamentosPacienteModel.findAll({
            where: { pac_id },
            attributes: [
                "med_pac_id", 
                "pac_id",
                "med_nombre", 
                "med_cantidad", 
                "med_presentacion", 
                "unidades_por_presentacion", 
                "med_total_unidades_disponibles",
                "med_descripcion"
            ],
            order: [["med_nombre", "ASC"]] // Ordenar por nombre
        });

        return res.status(200).json({ message: "Lista de medicamentos", medicamentos });
    } catch (error) {
        console.error("Error al obtener los medicamentos:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};



// añadir stock a un medicamento del paciente previamente registrado con stock cero (admin sede)
/* const agregarStockMedicamentoPac = async (req, res) => {
    try {
        const data = matchedData(req);
        const { med_pac_id } = req.params;
        const {  med_cantidad } = data;
        const se_id = req.session.se_id;

        if (!se_id) {
            return res.status(400).json({ message: "Sede no especificada en la sesión del usuario" });
        }

        // Buscar el medicamento en la sede
        const medicamento = await inventarioMedicamentosPacienteModel.findOne({
            where: { med_pac_id }
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

       // Sumar la cantidad ingresada al stock actual
       medicamento.med_cantidad += med_cantidad;
       medicamento.med_total_unidades_disponibles = medicamento.med_cantidad * medicamento.unidades_por_presentacion;

        // Guardar los cambios
        await medicamento.save();


        // 🔥 Emitir evento de stock actualizado
        getIo().emit("stockActualizado", { med_pac_id, med_cantidad: medicamento.med_cantidad });



        return res.status(200).json({ message: "Stock actualizado exitosamente", medicamento });
    } catch (error) {
        console.error("Error al actualizar el stock del medicamento:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
}; */


const agregarStockMedicamentoPac = async (req, res) => {
    try {
        const data = matchedData(req);
        const { med_pac_id } = req.params;
        let { med_cantidad } = data;  // `med_cantidad` como let para poder modificarlo
        const se_id = req.session.se_id;

        if (!se_id) {
            return res.status(400).json({ message: "Sede no especificada en la sesión del usuario" });
        }

        // Buscar el medicamento en la sede
        const medicamento = await inventarioMedicamentosPacienteModel.findOne({
            where: { med_pac_id }
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

        // ✅ Convertir `med_cantidad` en número decimal seguro
        med_cantidad = parseFloat(med_cantidad);
        if (isNaN(med_cantidad) || med_cantidad <= 0) {
            return res.status(400).json({ message: "Cantidad inválida, debe ser un número positivo." });
        }

        // ✅ Convertir `medicamento.med_cantidad` en número antes de sumarle `med_cantidad`
        medicamento.med_cantidad = parseFloat(medicamento.med_cantidad) + med_cantidad;

        // ✅ Convertir `med_total_unidades_disponibles` también a número
        medicamento.med_total_unidades_disponibles = medicamento.med_cantidad * parseFloat(medicamento.unidades_por_presentacion);

        // ✅ Guardar los cambios
        await medicamento.save();


        // 🔥 Emitir evento de stock actualizado
        getIo().emit("stockActualizado", { med_pac_id, med_cantidad: medicamento.med_cantidad });



        return res.status(200).json({ message: "Stock actualizado exitosamente", medicamento });
    } catch (error) {
        console.error("Error al actualizar el stock del medicamento:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};



// solo permite actualizar ciertos campos dependiendo del stock ( admin sede)
const actualizarMedicamentoPac = async (req, res) => {
    try {
        const data = matchedData(req);
        const { med_pac_id } = req.params;
        const { med_nombre, med_presentacion, unidades_por_presentacion, med_descripcion } = data;
        const se_id = req.session.se_id;

        if (!se_id) {
            return res.status(400).json({ message: "Sede no especificada en la sesión del usuario" });
        }

        // Buscar el medicamento en la sede
        const medicamento = await inventarioMedicamentosPacienteModel.findOne({
            where: { med_pac_id }
        });

        if (!medicamento) {
            return res.status(404).json({ message: "Medicamento no encontrado en la sede." });
        }

        // Si el medicamento tiene stock, no se permite cambiar presentación ni unidades por presentación
        if (medicamento.med_cantidad > 0) {
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
            // Si no tiene stock, actualizar presentación y unidades por presentación
            if (med_presentacion) medicamento.med_presentacion = med_presentacion;
            if (unidades_por_presentacion) medicamento.unidades_por_presentacion = unidades_por_presentacion;

            // Recalcular total de unidades disponibles
            medicamento.med_total_unidades_disponibles = medicamento.med_cantidad * medicamento.unidades_por_presentacion;
        }

        // Actualizar siempre nombre y descripción
        if (med_nombre) medicamento.med_nombre = med_nombre;
        if (med_descripcion !== undefined) medicamento.med_descripcion = med_descripcion;

        // Guardar cambios
        await medicamento.save();

        // 🔥 Emitir evento si usas WebSockets
        getIo().emit("medicamentoActualizado", { med_pac_id, medicamento });

        return res.status(200).json({ message: "Medicamento actualizado correctamente", medicamento });
    } catch (error) {
        console.error("Error al actualizar el medicamento:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};



module.exports = { registrarMedicamentoPaciente, obtenerMedicamentosInvPaciente, agregarStockMedicamentoPac, actualizarMedicamentoPac  };

