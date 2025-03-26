
const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 
const moment = require('moment-timezone');
const { matchedData } = require('express-validator');
const { pacienteModel, cuidadoEnfermeriaModel, sedePersonaRolModel } = require('../models');






// registrar cuidados una sola vez por paciente (solo si no existen), de lo contrario solo se actualiza (Admin sede)
const registrarCuidadosEnfermeria = async (req, res) => {
    try {
        const { pac_id } = req.params; // Obtener pac_id desde la URL
        const data = matchedData(req);
        const { ...datosCuidados } = data;
        const se_id_sesion = req.session.se_id; 

        if (!pac_id) {
            return res.status(400).json({ message: "Se requiere el ID del paciente." });
        }

        if (!se_id_sesion) {
            return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
        }

        const paciente = await pacienteModel.findOne({ where: { pac_id } });
        if (!paciente) {
            return res.status(404).json({ message: "Paciente no encontrado." });
        }

        const per_id = paciente.per_id;

        // Verificar si el paciente tiene el rol activo en la sede
        const tieneRolActivo = await sedePersonaRolModel.findOne({
            where: { se_id: se_id_sesion, per_id, rol_id: 4, sp_activo: true }
        });

        if (!tieneRolActivo) {
            return res.status(403).json({ message: "El usuario no tiene un rol de paciente activo en esta sede." });
        }

        // Verificar si ya existen cuidados registrados
        const cuidadosExistentes = await cuidadoEnfermeriaModel.findOne({ where: { pac_id } });
        if (cuidadosExistentes) {
            return res.status(400).json({ message: "Ya existen cuidados registrados para este paciente." });
        }

        // Registrar nuevos cuidados
        const nuevoCuidado = await cuidadoEnfermeriaModel.create({
            pac_id,
            ...datosCuidados,
        });

        return res.status(201).json({
            message: "Cuidados de enfermería registrados con éxito.",
            datos: nuevoCuidado,
        });

    } catch (error) {
        console.error("Error al registrar cuidados de enfermería:", error);
        return res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
        });
    }
};



// Controlador para actualizar cuidados de enfermería
const actualizarCuidadosEnfermeria = async (req, res) => {
    try {
        const { pac_id } = req.params;
        const data = matchedData(req);
        const { ...datosCuidados } = data;
        const se_id_sesion = req.session.se_id; 

        if (!pac_id) {
            return res.status(400).json({ message: "Se requiere el ID del paciente." });
        }

        if (!se_id_sesion) {
            return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
        }

        const paciente = await pacienteModel.findOne({ where: { pac_id } });
        if (!paciente) {
            return res.status(404).json({ message: "Paciente no encontrado." });
        }

        const per_id = paciente.per_id;

        // Verificar si el paciente tiene el rol activo en la sede
        const tieneRolActivo = await sedePersonaRolModel.findOne({
            where: { se_id: se_id_sesion, per_id, rol_id: 4, sp_activo: true }
        });

        if (!tieneRolActivo) {
            return res.status(403).json({ message: "El usuario no tiene un rol de paciente activo en esta sede." });
        }

        // Verificar si existen cuidados registrados para este paciente
        const cuidadosExistentes = await cuidadoEnfermeriaModel.findOne({ where: { pac_id } });
        if (!cuidadosExistentes) {
            return res.status(404).json({ message: "No existen cuidados registrados para este paciente." });
        }

        // Actualizar los cuidados
        await cuidadoEnfermeriaModel.update(datosCuidados, { where: { pac_id } });

        return res.status(200).json({
            message: "Cuidados de enfermería actualizados con éxito.",
            datos: { pac_id, ...datosCuidados },
        });

    } catch (error) {
        console.error("Error al actualizar cuidados de enfermería:", error);
        return res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
        });
    }
};





// ver los cuidados de enfermeria de un paciente (enfermera y acudiente )
const obtenerCuidadosEnfermeria = async (req, res) => {
    try {
        const { pac_id } = req.params;  // Obtener el ID del paciente
        const se_id_sesion = req.session.se_id;  // Obtener la sede de la sesión

        if (!pac_id) {
            return res.status(400).json({ message: "Se requiere el ID del paciente." });
        }

        if (!se_id_sesion) {
            return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
        }

        // Buscar el paciente
        const paciente = await pacienteModel.findOne({ where: { pac_id } });

        if (!paciente) {
            return res.status(404).json({ message: "Paciente no encontrado." });
        }


        // Buscar los cuidados de enfermería del paciente
        const cuidados = await cuidadoEnfermeriaModel.findOne({ where: { pac_id } });

        if (!cuidados) {
            return res.status(404).json({ message: "No hay cuidados de enfermería registrados para este paciente." });
        }

        return res.status(200).json({
            message: "Cuidados de enfermería obtenidos con éxito.",
            datos: cuidados,
        });

    } catch (error) {
        console.error("Error al obtener cuidados de enfermería:", error);
        return res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
        });
    }
};









module.exports = {registrarCuidadosEnfermeria ,actualizarCuidadosEnfermeria, obtenerCuidadosEnfermeria};
