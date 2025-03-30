const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 
const moment = require('moment-timezone');
const { matchedData } = require('express-validator');
const { sedeModel, inventarioMedicamentosSedeModel } = require('../models');





// ingresar medicamento al inventario de la sede (admin sede)

const registrarMedicamentoSede = async (req, res) => {
    try {
        const data = matchedData(req);
        const { med_nombre, med_cantidad, med_presentacion, unidades_por_presentacion, med_descripcion } = data;
        const se_id = req.session.se_id; 

        if (!se_id) {
            return res.status(400).json({ message: "Sede no especificada en la sesión del usuario" });
        }

        // Calcular el total de unidades disponibles
        const med_total_unidades_disponibles = med_cantidad * unidades_por_presentacion;

        const nuevoMedicamento = await inventarioMedicamentosSedeModel.create({
            se_id,
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

module.exports = { registrarMedicamentoSede };

