const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 
const { io } = require('../utils/handleSocket'); 
const moment = require('moment-timezone');
const { matchedData } = require('express-validator');
const { medicamentosModel, personaModel, movimientosStockSedeModel } = require('../models');




// movimientos de cadda medicamento de la sede
const historialMovimientosMedicamento = async (req, res) => {
    try {
      const { med_sede_id } = req.params;
      const se_id = req.session.se_id;
  
      if (!se_id) {
        return res.status(400).json({ message: "Sede no especificada en la sesión del usuario." });
      }
  
      const movimientos = await movimientosStockSedeModel.findAll({
        where: { med_sede_id },
        include: [
          {
            model: personaModel,
            as: "usuario",
            attributes: ["per_id", "per_nombre_completo", "per_documento"]
          },
        ],
        order: [["fecha", "DESC"]],
      });
  
      const entradas = [];
      const salidas = [];
  
      movimientos.forEach(mov => {
        const baseMovimiento = {
          movimiento_id: mov.mov_se_id,
          tipo: mov.tipo,
          cantidad: mov.cantidad,
          fecha: mov.fecha,
          realizado_por: mov.usuario 
            ? `${mov.usuario.per_nombre_completo} ${mov.usuario.per_documento}` 
            : "Usuario desconocido"
        };
  
        if (mov.tipo === "Entrada") {
          entradas.push({
            ...baseMovimiento,
            origen: mov.med_origen || null
          });
        } else if (mov.tipo === "Salida") {
          salidas.push({
            ...baseMovimiento,
            destino: mov.med_destino || null
          });
        }
      });
  
      return res.status(200).json({
        message: "Historial de movimientos del medicamento.",
        entradas,
        salidas,
      });
  
    } catch (error) {
      console.error("Error al obtener historial de movimientos:", error);
      return res.status(500).json({ message: "Error interno del servidor." });
    }
  };
  




module.exports = { 
    historialMovimientosMedicamento,     
};
