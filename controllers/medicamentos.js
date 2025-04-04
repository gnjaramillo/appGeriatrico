const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 
const { io } = require('../utils/handleSocket'); 
const moment = require('moment-timezone');
const { matchedData } = require('express-validator');
const {  medicamentosModel, inventarioMedicamentosSedeModel, inventarioMedicamentosPacienteModel  } = require('../models');







// registrar medicamento, sin stock inicial (admin sede)
const registrarMedicamento = async (req, res) => {
    try {
        const data = matchedData(req);
        const { med_nombre, med_presentacion, unidades_por_presentacion, med_descripcion } = data;


        const nuevoMedicamento = await medicamentosModel.create({
            med_nombre,
            med_presentacion,
            unidades_por_presentacion, // Debe ser un número válido
            med_descripcion: med_descripcion || null
        });

        return res.status(201).json({ 
            message: "Medicamento registrado exitosamente. Validar que los datos sean correctos, una vez el medicamento se vincule a un inventario, solo podrá ser actualizado en la descripción.", medicamento: nuevoMedicamento });
    } catch (error) {
        console.error("Error al registrar el medicamento:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};




// ver los medicamentos del inventario de la sede (admin sede)
const obtenerMedicamentos = async (req, res) => {
    try {
        const se_id = req.session.se_id; // Obtener la sede desde la sesión

        if (!se_id) {
            return res.status(400).json({ message: "Sede no especificada en la sesión del usuario" });
        }

        // Consultar los medicamentos de la sede
        const medicamentos = await medicamentosModel.findAll({
            order: [["med_nombre", "ASC"]] // Ordenar por nombre
        });

        return res.status(200).json({ message: "Lista de medicamentos", medicamentos });
    } catch (error) {
        console.error("Error al obtener los medicamentos:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};





// solo permite actualizar ciertos campos dependiendo del stock ( admin sede)
const actualizarMedicamento = async (req, res) => {
    try {
        const data = matchedData(req);
        const { med_id } = req.params;

        if (!data || !med_id) {
            return res.status(400).json({ message: "Datos inválidos o ID de medicamento no proporcionado" });
        }

        const medicamento = await medicamentosModel.findOne({ where: { med_id } });

        if (!medicamento) {
            return res.status(404).json({ message: "Medicamento no encontrado" });
        }

        // Verificar si el medicamento está en algún inventario
        const medicamentosede = await inventarioMedicamentosSedeModel.findOne({ where: { med_id } });
        const medicamentopac = await inventarioMedicamentosPacienteModel.findOne({ where: { med_id } });

        // Si el medicamento tiene stock, restringir ciertos cambios
        if ((medicamentosede || medicamentopac) && (data.med_nombre || data.med_presentacion || data.unidades_por_presentacion)) {
            return res.status(400).json({ 
                message: "No se pueden modificar nombre, presentación o unidades si el medicamento ya tiene stock."
            });
        }

        // Actualizar solo los campos permitidos
        await medicamento.update(data);

        // Obtener los datos actualizados
        const medicamentoActualizado = await medicamentosModel.findOne({ where: { med_id } });

        // Emitir evento WebSocket
        io.emit("medicamentoActualizado", medicamentoActualizado);

        return res.status(200).json({ 
            message: "Medicamento actualizado correctamente", 
            data: medicamentoActualizado
        });

    } catch (error) {
        console.error("Error al actualizar el medicamento:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};










module.exports = { registrarMedicamento , obtenerMedicamentos, actualizarMedicamento };

