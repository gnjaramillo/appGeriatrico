
const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 

const { matchedData } = require('express-validator');
const { pacienteModel, sedePersonaRolModel, recomendacionModel } = require('../models');






/* const registrarRecomendacion = async (req, res) => {
    try {
        const { pac_id } = req.params; 
        const data = matchedData(req); 
        const { ...datosRecomendacion } = data;
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

        // Obtener todos los roles de paciente de la persona en la sede
        const rolesPaciente = await sedePersonaRolModel.findAll({
            where: { se_id: se_id_sesion, per_id, rol_id: 4 },
            attributes: ["sp_activo"],
        });

        if (rolesPaciente.length === 0) {
            return res.status(404).json({
                message: "La persona no tiene un rol de paciente en esta sede.",
            });
        }

        const tieneRolActivo = rolesPaciente.some((rol) => rol.sp_activo === true);

        if (!tieneRolActivo) {
            return res.status(403).json({
                message: "El usuario tiene el rol de paciente en esta sede, pero está inactivo.",
            });
        }

        // Verificar si ya existen recomendaciones registradas para el paciente
        const recomendacionExistente = await recomendacionModel.findOne({ where: { pac_id } });

        if (recomendacionExistente) {
            // Si existe, actualizarla
            await recomendacionModel.update(datosRecomendacion, { where: { pac_id } });

            return res.status(200).json({
                message: "Recomendaciones actualizadas con éxito.",
                datos: { pac_id, ...datosRecomendacion },
            });
        } else {
            // Si no existen, crear nueva recomendación
            const nuevaRecomendacion = await recomendacionModel.create({
                pac_id,
                ...datosRecomendacion,
            });

            return res.status(201).json({
                message: "Recomendaciones registradas con éxito.",
                datos: nuevaRecomendacion,
            });
        }
    } catch (error) {
        console.error("Error al registrar recomendaciones:", error);
        return res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
        });
    }
};
 */



// solo se registrar una vez por paciente (admin sede)
const registrarRecomendacion = async (req, res) => {
    try {
        const { pac_id } = req.params;
        const data = matchedData(req);
        const { ...datosRecomendacion } = data;
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

        // Verificar si la persona tiene rol de paciente activo en la sede
        const rolesPaciente = await sedePersonaRolModel.findAll({
            where: { se_id: se_id_sesion, per_id, rol_id: 4 },
            attributes: ["sp_activo"],
        });

        if (rolesPaciente.length === 0 || !rolesPaciente.some(rol => rol.sp_activo === true)) {
            return res.status(403).json({ message: "El paciente no tiene un rol activo en esta sede." });
        }

        // Verificar si ya existe una recomendación para el paciente
        const recomendacionExistente = await recomendacionModel.findOne({ where: { pac_id } });
        

        if (recomendacionExistente) {
            return res.status(409).json({
                message: "El paciente ya tiene recomendaciones registradas. Usa el endpoint de actualización.",
            });
        }

        // Crear nueva recomendación
        const nuevaRecomendacion = await recomendacionModel.create({
            pac_id,
            ...datosRecomendacion,
        });

        return res.status(201).json({
            message: "Recomendaciones registradas con éxito.",
            datos: nuevaRecomendacion,
        });
    } catch (error) {
        console.error("Error al registrar recomendaciones:", error);
        return res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
        });
    }
};



// actaulizar recomendacion del paciente (admin sede)
const actualizarRecomendacion = async (req, res) => {
    try {
        const { pac_id } = req.params;
        const data = matchedData(req);
        const { ...datosRecomendacion } = data;
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

        // Verificar si la persona tiene rol de paciente activo en la sede
        const rolesPaciente = await sedePersonaRolModel.findAll({
            where: { se_id: se_id_sesion, per_id, rol_id: 4 },
            attributes: ["sp_activo"],
        });

        if (rolesPaciente.length === 0 || !rolesPaciente.some(rol => rol.sp_activo === true)) {
            return res.status(403).json({ message: "El paciente no tiene un rol activo en esta sede." });
        }

        // Verificar si la recomendación existe antes de actualizar
        const recomendacionExistente = await recomendacionModel.findOne({ where: { pac_id } });

        if (!recomendacionExistente) {
            return res.status(404).json({
                message: "No hay recomendaciones registradas para este paciente. Usa el endpoint de registro.",
            });
        }

        // Actualizar recomendación
        await recomendacionModel.update(datosRecomendacion, { where: { pac_id } });

        return res.status(200).json({
            message: "Recomendaciones actualizadas con éxito.",
            datos: { pac_id, ...datosRecomendacion },
        });
    } catch (error) {
        console.error("Error al actualizar recomendaciones:", error);
        return res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
        });
    }
};



// ver las recomendaciones de un paciente (enfermera, admin sede, acudiente )
const obtenerRecomendaciones = async (req, res) => {
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

        // Buscar las recomendaciones del paciente
        const recomendaciones = await recomendacionModel.findOne({ where: { pac_id } });

        if (!recomendaciones) {
            return res.status(404).json({ message: "No hay recomendaciones registradas para este paciente." });
        }

        return res.status(200).json({
            message: "Recomendaciones obtenidas con éxito.",
            datos: recomendaciones,
        });

    } catch (error) {
        console.error("Error al obtener recomendaciones:", error);
        return res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
        });
    }
};






module.exports = { registrarRecomendacion, actualizarRecomendacion, obtenerRecomendaciones };




