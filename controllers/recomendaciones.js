
const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 

const { matchedData } = require('express-validator');
const { pacienteModel, sedePersonaRolModel, recomendacionModel } = require('../models');






// solo se registrar una vez por paciente y se pueden actualizar aqui mismo cuando los datos ya existen (enfermera)
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





// ver las recomendaciones de un paciente (enfermera )
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






module.exports = { registrarRecomendacion, obtenerRecomendaciones };




