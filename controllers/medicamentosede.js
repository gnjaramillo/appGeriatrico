const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 
const { io } = require('../utils/handleSocket'); 
const moment = require('moment-timezone');
const { matchedData } = require('express-validator');
const {  inventarioMedicamentosSedeModel, vinculacionMedicamentoSedeModel  } = require('../models');



// Vincula un medicamento a la sede y lo agrega al inventario si es la primera vez.

const vincularMedicamentoSede = async (req, res) => {
  try {
    const { med_id } = req.params;  // Medicamento desde la URL
    const se_id = req.user.se_id;   // Sede desde la sesión del usuario

    // 1️⃣ Verificar si ya está vinculado a la sede
    let vinculacion = await vinculacionMedicamentoSedeModel.findOne({
      where: { se_id, med_id },
    });

    if (!vinculacion) {
      // Si no está vinculado, creamos la vinculación
      vinculacion = await vinculacionMedicamentoSedeModel.create({ se_id, med_id });
    }

    // 2️⃣ Verificar si ya existe en el inventario
    let inventario = await inventarioMedicamentosSedeModel.findOne({
      where: { se_id, med_id },
    });

    if (!inventario) {
      // Si no existe, lo creamos con stock inicial en 0
      inventario = await inventarioMedicamentosSedeModel.create({
        se_id,
        med_id,
        med_total_unidades_disponibles: 0, // Inicialmente sin stock
      });
    }

    return res.status(200).json({
      message: "Medicamento vinculado y registrado en inventario (si no existía)",
      vinculacion,
      inventario,
    });

  } catch (error) {
    console.error("Error en vincularMedicamentoASede:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = { vincularMedicamentoSede };

