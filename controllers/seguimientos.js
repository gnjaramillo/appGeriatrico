
const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 
const { matchedData } = require('express-validator');
const { subirImagenACloudinary } = require('../utils/handleCloudinary'); 
const { pacienteModel, seguimientoModel, sedePersonaRolModel, enfermeraModel } = require('../models');






// solo se registrar una vez por paciente y se pueden actualizar aqui mismo cuando los datos ya existen (enfermera)
const registrarSeguimientoPaciente = async (req, res) => {
    const transaction = await sequelize.transaction(); 
    try {
        const { pac_id } = req.params;
        const per_id_enfermera = req.session.per_id;
        const se_id_sesion = req.session.se_id;
        const data = matchedData(req);

        if (!pac_id) {
            return res.status(400).json({ message: "Se requiere el ID del paciente." });
        }

        if (!se_id_sesion) {
            return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
        }

        // Obtener ID de la enfermera desde la persona en sesión
        const enfermera = await enfermeraModel.findOne({ where: { per_id: per_id_enfermera } });
        if (!enfermera) {
            return res.status(403).json({ message: "No eres una enfermera registrada." });
        }
        const enf_id = enfermera.enf_id;

        // Verificar si el paciente existe
        const paciente = await pacienteModel.findOne({ where: { pac_id } });
        if (!paciente) {
            return res.status(404).json({ message: "Paciente no encontrado." });
        }

        const per_id_paciente = paciente.per_id;

        // Verificar si la persona tiene rol de paciente en la sede y si está activo
        const rolesPaciente = await sedePersonaRolModel.findAll({
            where: { se_id: se_id_sesion, per_id: per_id_paciente, rol_id: 4 },
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

        // 🔹 Crear un nuevo seguimiento 
        const nuevoSeguimiento = await seguimientoModel.create(
            { pac_id, enf_id, ...data },
            { transaction }
        );

        // 🔹 Subir la foto si está presente en la solicitud (opcional)
        if (req.file) {
            try {
                const resultado = await subirImagenACloudinary(req.file, "seguimientos_Paciente");
                await nuevoSeguimiento.update({ seg_foto: resultado.secure_url }, { transaction });
            } catch (error) {
                console.error("Error al subir la imagen:", error);
                await transaction.rollback(); // 🔹 Deshacer todo si la imagen falla
                return res.status(500).json({ message: "Error al subir la imagen" });
            }
        }

        await transaction.commit(); // 🔹 Confirmar transacción

        return res.status(201).json({
            message: "Seguimiento registrado con éxito.",
            datos: nuevoSeguimiento,
        });

    } catch (error) {
        await transaction.rollback(); // 🔹 Deshacer cualquier cambio en caso de error
        console.error("Error al registrar seguimiento:", error);
        return res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
        });
    }
};


module.exports = {registrarSeguimientoPaciente};
