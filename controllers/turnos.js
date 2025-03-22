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




// vista para cada enfermera, para q visualice sus turnos asignados
const verMisTurnosEnfermeria = async (req, res) => {
  try {
    const se_id = req.session.se_id; 
    const ge_id = req.session.ge_id; 
    const enf_id = req.session.enf_id; 

    // Obtener todos los turnos de la enfermera con la sede asociada
    const misTurnos = await turnoModel.findAll({
      where: { enf_id },
      include: [
        {
          model: sedeModel,
          as: "sede",
          attributes: ["se_id", "se_nombre"], // Traer id y nombre de la sede
        },
      ],
      order: [["tur_fecha_inicio", "ASC"], ["tur_hora_inicio", "ASC"]], // Ordena por fecha y hora
    });

    // 🔹 Agrupar turnos por sede
    const turnosAgrupados = misTurnos.reduce((acc, turno) => {
      const sedeId = turno.sede.se_id;
      const sedeNombre = turno.sede.se_nombre;

      if (!acc[sedeId]) {
        acc[sedeId] = { sede_nombre: sedeNombre, turnos: [] };
      }

      acc[sedeId].turnos.push({
        tur_id: turno.tur_id,
        tur_fecha_inicio: turno.tur_fecha_inicio,
        tur_fecha_fin: turno.tur_fecha_fin,
        tur_hora_inicio: turno.tur_hora_inicio,
        tur_hora_fin: turno.tur_hora_fin,
        tur_total_horas: turno.tur_total_horas,
        tur_tipo_turno: turno.tur_tipo_turno,
      });

      return acc;
    }, {});

    return res.status(200).json({
      message: "Turnos asignados:",
      turnos_por_sede: Object.values(turnosAgrupados), // Convertir el objeto en array
    });

  } catch (error) {
    console.error("❌ Error al obtener turnos:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};



// ver turnos de todas las enfermeras(os) en la sede del admin (admin sede)
const verTurnosSede = async (req, res) => {
  try {
    const se_id = req.session.se_id;

    if (!se_id) {
      return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
    }

    // Obtener todos los turnos de la sede, incluyendo datos de la enfermera y su persona asociada
    const turnos = await turnoModel.findAll({
      where: { se_id },
      include: [
        {
          model: enfermeraModel,
          as: "enfermera",
          include: [
            {
              model: personaModel,
              as: "persona",
              attributes: ["per_nombre_completo", "per_documento"],
            },
          ],
        },
      ],
      order: [
        ["tur_fecha_inicio", "ASC"],
        ["tur_hora_inicio", "ASC"],
      ],
    });

    // Agrupar por fecha para facilitar la visualización
    const turnosAgrupados = {};
    turnos.forEach(turno => {
      const fecha = turno.tur_fecha_inicio;
      if (!turnosAgrupados[fecha]) {
        turnosAgrupados[fecha] = [];
      }

      const turnoModificado = {
        ...turno.toJSON(),
        enfermera: {
          enf_id: turno.enfermera.enf_id,
          enf_codigo: turno.enfermera.enf_codigo,
          datos_enfermera: turno.enfermera.persona, // Renombramos "persona" a "datos_enfermera"
        },
      };



      turnosAgrupados[fecha].push(turnoModificado);
    });



    return res.status(200).json({
      message: "📅 Turnos asignados en la sede",
      turnos: turnosAgrupados,
    });
  } catch (error) {
    console.error("❌ Error al obtener turnos de la sede:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};





// eliminar turno enfermeria (admin sede)
const eliminarTurnoEnfermeria = async (req, res) => {
  try {
    const { tur_id } = req.params;
    const se_id = req.session.se_id; // Sede del admin

    if (!se_id) {
      return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
    }

    // Buscar el turno y validar que pertenece a la sede del admin
    const turnoExiste = await turnoModel.findOne({ where: { tur_id } });

    if (!turnoExiste) {
      return res.status(404).json({ message: "⛔ turno no encontrado." });
    }

    // Buscar el turno y validar que pertenece a la sede del admin
    const turno = await turnoModel.findOne({ where: { tur_id, se_id } });

    if (!turno) {
      return res.status(404).json({ message: "⛔ No se puede eliminar un turno que pertenece a otra sede." });
    }

    // Eliminar el turno
    await turno.destroy();

    return res.status(200).json({ message: "✅ Turno eliminado correctamente." });
  } catch (error) {
    console.error("❌ Error al eliminar turno:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};




module.exports = {  asignarTurnoEnfermeria, verMisTurnosEnfermeria, verTurnosSede, eliminarTurnoEnfermeria };
