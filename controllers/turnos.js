const { Op } = require("sequelize");
const { sequelize } = require("../config/mysql");
const { convertirHoraA24Horas, calcularHorasTotales } = require('../utils/handleTime'); 
const { matchedData } = require("express-validator");
const {
  enfermeraModel,
  sedeModel,
  rolModel,
  turnoModel,
  personaModel,
  sedePersonaRolModel,
} = require("../models");




/* const asignarTurnoEnfermeria = async (req, res) => {
    try {
      const se_id = req.session.se_id;
      const { enf_id } = req.params;
      const data = matchedData(req);
  
      let {
        tur_fecha_inicio,
        tur_fecha_fin,
        tur_hora_inicio,
        tur_hora_fin,
        tur_total_horas,
        tur_tipo_turno,
      } = data;
  
      if (!se_id) {
        return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
      }
  
      // 🔹 Convertir las horas al formato 24h antes de validarlas
      tur_hora_inicio = convertirHoraA24Horas(tur_hora_inicio);
      tur_hora_fin = convertirHoraA24Horas(tur_hora_fin);
  
      // 🔹 Buscar todos los turnos en conflicto en la misma sede
      const conflictosEnMismaSede = await turnoModel.findAll({
        where: {
          enf_id,
          se_id,
          tur_fecha_inicio: { [Op.lte]: tur_fecha_fin },
          tur_fecha_fin: { [Op.gte]: tur_fecha_inicio },
          [Op.or]: [
            { tur_hora_inicio: { [Op.lt]: tur_hora_fin, [Op.gte]: tur_hora_inicio } },
            { tur_hora_fin: { [Op.gt]: tur_hora_inicio, [Op.lte]: tur_hora_fin } },
            { tur_hora_inicio: { [Op.lte]: tur_hora_inicio }, tur_hora_fin: { [Op.gte]: tur_hora_fin } },
            { tur_hora_inicio: { [Op.gte]: tur_hora_inicio }, tur_hora_fin: { [Op.lte]: tur_hora_fin } },
          ],
        },
      });
  
      if (conflictosEnMismaSede.length > 0) {
        return res.status(400).json({
          message: "Conflicto en la misma sede: La enfermera ya tiene un turno asignado en esta sede durante este horario.",
          conflictos: conflictosEnMismaSede, // 🔹 Retorna los turnos en conflicto
        });
      }
  
      // 🔹 Buscar todos los turnos en conflicto en otras sedes
      const conflictosEnOtraSede = await turnoModel.findAll({
        where: {
          enf_id,
          se_id: { [Op.ne]: se_id },
          tur_fecha_inicio: { [Op.lte]: tur_fecha_fin },
          tur_fecha_fin: { [Op.gte]: tur_fecha_inicio },
          [Op.or]: [
            { tur_hora_inicio: { [Op.lt]: tur_hora_fin, [Op.gte]: tur_hora_inicio } },
            { tur_hora_fin: { [Op.gt]: tur_hora_inicio, [Op.lte]: tur_hora_fin } },
            { tur_hora_inicio: { [Op.lte]: tur_hora_inicio }, tur_hora_fin: { [Op.gte]: tur_hora_fin } },
            { tur_hora_inicio: { [Op.gte]: tur_hora_inicio }, tur_hora_fin: { [Op.lte]: tur_hora_fin } },
          ],
        },
      });
  
      if (conflictosEnOtraSede.length > 0) {
        return res.status(400).json({
          message: "Conflicto en otra sede: La enfermera ya tiene un turno asignado en otra sede durante este horario.",
          conflictos: conflictosEnOtraSede, // 🔹 Retorna los turnos en conflicto
        });
      }
  
      // 🔹 Crear el turno
      const nuevoTurno = await turnoModel.create({
        enf_id,
        se_id,
        tur_fecha_inicio,
        tur_fecha_fin,
        tur_hora_inicio,
        tur_hora_fin,
        tur_total_horas,
        tur_tipo_turno,
      });
  
      return res.status(201).json({ message: "Turno asignado con éxito", data: nuevoTurno });
    } catch (error) {
      console.error("Error al asignar turno:", error);
      return res.status(500).json({ message: "Error en el servidor." });
    }
  }; */
  

// asignar turnos enfermeria (admin sede)
const asignarTurnoEnfermeria = async (req, res) => {
  try {
    const se_id = req.session.se_id;
    const { enf_id } = req.params;
    const data = matchedData(req);

    let {
      tur_fecha_inicio,
      tur_fecha_fin,
      tur_hora_inicio,
      tur_hora_fin,
      tur_tipo_turno,
    } = data;

    if (!se_id) {
      return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
    }

    console.log("⏳ Validando datos recibidos...", { tur_hora_inicio, tur_hora_fin });

    // 🔹 Calcular las horas totales ANTES de convertirlas a 24h
    const tur_total_horas = calcularHorasTotales(tur_hora_inicio, tur_hora_fin);

    // 🔹 Convertir las horas al formato 24h
    tur_hora_inicio = convertirHoraA24Horas(tur_hora_inicio);
    tur_hora_fin = convertirHoraA24Horas(tur_hora_fin);

    console.log("✅ Horas convertidas a 24h:", { tur_hora_inicio, tur_hora_fin });
    console.log("✅ Horas totales:", tur_total_horas);

    // 🔹 Buscar todos los turnos en conflicto en la misma sede
    const conflictosEnMismaSede = await turnoModel.findAll({
      where: {
        enf_id,
        se_id,
        tur_fecha_inicio: { [Op.lte]: tur_fecha_fin },
        tur_fecha_fin: { [Op.gte]: tur_fecha_inicio },
        [Op.or]: [
          { tur_hora_inicio: { [Op.lt]: tur_hora_fin, [Op.gte]: tur_hora_inicio } },
          { tur_hora_fin: { [Op.gt]: tur_hora_inicio, [Op.lte]: tur_hora_fin } },
          { tur_hora_inicio: { [Op.lte]: tur_hora_inicio }, tur_hora_fin: { [Op.gte]: tur_hora_fin } },
          { tur_hora_inicio: { [Op.gte]: tur_hora_inicio }, tur_hora_fin: { [Op.lte]: tur_hora_fin } },
        ],
      },
    });

    if (conflictosEnMismaSede.length > 0) {
      return res.status(400).json({
        message: "⛔ Conflicto en la misma sede: La enfermera ya tiene un turno durante el transcurso de este horario.",
        conflictos: conflictosEnMismaSede,
      });
    }

    // 🔹 Buscar todos los turnos en conflicto en otras sedes
    const conflictosEnOtraSede = await turnoModel.findAll({
      where: {
        enf_id,
        se_id: { [Op.ne]: se_id }, // Excluir la sede actual
        tur_fecha_inicio: { [Op.lte]: tur_fecha_fin },
        tur_fecha_fin: { [Op.gte]: tur_fecha_inicio },
        [Op.or]: [
          { tur_hora_inicio: { [Op.lt]: tur_hora_fin, [Op.gte]: tur_hora_inicio } },
          { tur_hora_fin: { [Op.gt]: tur_hora_inicio, [Op.lte]: tur_hora_fin } },
          { tur_hora_inicio: { [Op.lte]: tur_hora_inicio }, tur_hora_fin: { [Op.gte]: tur_hora_fin } },
          { tur_hora_inicio: { [Op.gte]: tur_hora_inicio }, tur_hora_fin: { [Op.lte]: tur_hora_fin } },
        ],
      },
    });

    if (conflictosEnOtraSede.length > 0) {
      return res.status(400).json({
        message: "⛔ Conflicto en otra sede: La enfermera ya tiene un turno durante el transcurso de este horario.",
        conflictos: conflictosEnOtraSede,
      });
    }

    // 🔹 Crear el turno
    const nuevoTurno = await turnoModel.create({
      enf_id,
      se_id,
      tur_fecha_inicio,
      tur_fecha_fin,
      tur_hora_inicio,
      tur_hora_fin,
      tur_total_horas, // Ahora está calculado automáticamente
      tur_tipo_turno,
    });

    return res.status(201).json({ message: "✅ Turno asignado con éxito", data: nuevoTurno });
  } catch (error) {
    console.error("❌ Error al asignar turno:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};






module.exports = {  asignarTurnoEnfermeria };
