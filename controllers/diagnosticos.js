const { matchedData } = require("express-validator");
const { pacienteModel, sedePersonaRolModel, diagnosticoModel } = require('../models');



// Registrar diagnóstico (admin sede)
const registrarDiagnostico = async (req, res) => {
    try {
        const { pac_id } = req.params;
        const data = matchedData(req);
        const { diag_fecha, diag_descripcion } = data;
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

        // Verificar si la persona tiene rol de paciente en la sede
        const rolesPaciente = await sedePersonaRolModel.findAll({
            where: { se_id: se_id_sesion, per_id, rol_id: 4 },
            attributes: ["sp_activo"],
        });

        if (rolesPaciente.length === 0) {
            return res.status(404).json({ message: "La persona no tiene un rol de paciente en esta sede." });
        }

        const tieneRolActivo = rolesPaciente.some((rol) => rol.sp_activo === true);

        if (!tieneRolActivo) {
            return res.status(403).json({ message: "El usuario tiene el rol de paciente en esta sede, pero está inactivo." });
        }

        // Verificar si ya existe un diagnóstico
        const diagnosticoExistente = await diagnosticoModel.findOne({ where: { pac_id } });

        if (diagnosticoExistente) {
            return res.status(409).json({ message: "Ya existe un diagnóstico para este paciente. Debes actualizarlo en lugar de registrarlo nuevamente." });
        }

        // Crear un nuevo diagnóstico
        const nuevoDiagnostico = await diagnosticoModel.create({
            pac_id,
            diag_fecha,
            diag_descripcion,
        });

        return res.status(201).json({
            message: "Diagnóstico registrado con éxito.",
            datos: nuevoDiagnostico,
        });

    } catch (error) {
        console.error("Error al registrar diagnóstico:", error);
        return res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
        });
    }
};



// Actualizar diagnóstico (admin sede y enfermera)
const actualizarDiagnostico = async (req, res) => {
    try {
        const { pac_id } = req.params;
        const data = matchedData(req);
        const { diag_fecha, diag_descripcion } = data;
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

        // Verificar si la persona tiene rol de paciente en la sede
        const rolesPaciente = await sedePersonaRolModel.findAll({
            where: { se_id: se_id_sesion, per_id, rol_id: 4 },
            attributes: ["sp_activo"],
        });

        if (rolesPaciente.length === 0) {
            return res.status(404).json({ message: "La persona no tiene un rol de paciente en esta sede." });
        }

        const tieneRolActivo = rolesPaciente.some((rol) => rol.sp_activo === true);

        if (!tieneRolActivo) {
            return res.status(403).json({ message: "El usuario tiene el rol de paciente en esta sede, pero está inactivo." });
        }

        // Verificar si el diagnóstico existe
        const diagnosticoExistente = await diagnosticoModel.findOne({ where: { pac_id } });

        if (!diagnosticoExistente) {
            return res.status(404).json({ message: "No existe un diagnóstico para este paciente. Debes registrarlo primero." });
        }

        // Actualizar el diagnóstico
        await diagnosticoModel.update({ diag_fecha, diag_descripcion }, { where: { pac_id } });

        return res.status(200).json({
            message: "Diagnóstico actualizado con éxito.",
            datos: { pac_id, diag_fecha, diag_descripcion },
        });

    } catch (error) {
        console.error("Error al actualizar diagnóstico:", error);
        return res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
        });
    }
};



// Obtener diagnóstico de un paciente
const obtenerDiagnostico = async (req, res) => {
    try {
        const { pac_id } = req.params;
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

        const diagnostico = await diagnosticoModel.findOne({ where: { pac_id } });

        if (!diagnostico) {
            return res.status(404).json({ message: "No hay diagnóstico registrado para este paciente." });
        }

        return res.status(200).json({
            message: "Diagnóstico obtenido con éxito.",
            datos: diagnostico,
        });
    } catch (error) {
        console.error("Error al obtener diagnóstico:", error);
        return res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
        });
    }
};



module.exports = { registrarDiagnostico,actualizarDiagnostico, obtenerDiagnostico };
