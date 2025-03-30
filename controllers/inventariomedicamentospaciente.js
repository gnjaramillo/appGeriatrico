const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 
const moment = require('moment-timezone');
const { matchedData } = require('express-validator');
const {  inventarioMedicamentosPacienteModel, pacienteModel, sedePersonaRolModel } = require('../models');





// ingresar medicamento al inventario de la sede (admin sede)

const registrarMedicamentoPaciente = async (req, res) => {
    try {
        const { pac_id } = req.params;
        const data = matchedData(req);
        const { med_nombre, med_cantidad, med_presentacion, unidades_por_presentacion, med_descripcion } = data;
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
        


        // Calcular el total de unidades disponibles
        const med_total_unidades_disponibles = med_cantidad * unidades_por_presentacion;

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

module.exports = { registrarMedicamentoPaciente };

