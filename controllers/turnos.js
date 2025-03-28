const { Op } = require("sequelize");
const moment = require("moment-timezone");
const { sequelize } = require("../config/mysql");
const { convertirHoraA24Horas, calcularHorasTotales, validarHoraInicioTurno, validarHoraFin, determinarTipoTurno, validarHoraFinTurno } = require('../utils/handleTime'); 
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
      // tur_tipo_turno,
    } = data;

    if (!se_id) {
      return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
    }

    // 🟢 Validar la hora de inicio
    const errorHora = validarHoraInicioTurno(tur_fecha_inicio, tur_hora_inicio);
    if (errorHora) {
      return res.status(400).json({ message: errorHora });
    }

     // 🟢 Validar la hora de fin respecto a la hora de inicio
     const errorHoraFin = validarHoraFin(tur_hora_inicio, tur_hora_fin, tur_fecha_inicio, tur_fecha_fin);
     if (errorHoraFin) {
         return res.status(400).json({ message: errorHoraFin });
     }


    console.log("⏳ Validando datos recibidos...", { tur_hora_inicio, tur_hora_fin });

    
    const tur_total_horas = calcularHorasTotales(tur_hora_inicio, tur_hora_fin, tur_fecha_inicio, tur_fecha_fin);
    
    // 🟢 Calcular automáticamente el tipo de turno

    const tur_tipo_turno = determinarTipoTurno(tur_hora_inicio, tur_hora_fin);




    let advertencia = null;
    if (tur_total_horas > 24) {
      advertencia = "⚠️ Advertencia: Este turno supera las 24 horas.";
    }
    
    tur_hora_inicio = convertirHoraA24Horas(tur_hora_inicio);
    tur_hora_fin = convertirHoraA24Horas(tur_hora_fin);

    console.log("✅ Horas convertidas a 24h:", { tur_hora_inicio, tur_hora_fin });
    console.log("✅ Horas totales:", tur_total_horas );

    // 🔹 Convertir las fechas y horas a Timestamp para comparaciones precisas
    const fechaInicioTimestamp = new Date(`${tur_fecha_inicio}T${tur_hora_inicio}`).getTime();
    const fechaFinTimestamp = new Date(`${tur_fecha_fin}T${tur_hora_fin}`).getTime();

    console.log("📌 Nuevo turno en timestamp:", fechaInicioTimestamp, "-", fechaFinTimestamp);

    // 🔹 Buscar todos los turnos en conflicto en la misma sede
    const turnosExistentes = await turnoModel.findAll({
      where: {
        enf_id,
        se_id,
        tur_fecha_inicio: { [Op.lte]: tur_fecha_fin },
        tur_fecha_fin: { [Op.gte]: tur_fecha_inicio },
      },
    });

    let conflictosEnMismaSede = turnosExistentes.filter(t => {
      const inicioExistente = new Date(`${t.tur_fecha_inicio}T${convertirHoraA24Horas(t.tur_hora_inicio)}`).getTime();
      const finExistente = new Date(`${t.tur_fecha_fin}T${convertirHoraA24Horas(t.tur_hora_fin)}`).getTime();

      console.log("⚠️ Comparando con turno existente (MISMA SEDE):", inicioExistente, "-", finExistente);

      return (
        (fechaInicioTimestamp >= inicioExistente && fechaInicioTimestamp < finExistente) || // Nuevo turno inicia dentro de otro
        (fechaFinTimestamp > inicioExistente && fechaFinTimestamp <= finExistente) || // Nuevo turno termina dentro de otro
        (fechaInicioTimestamp <= inicioExistente && fechaFinTimestamp >= finExistente) // Nuevo turno cubre todo el existente
      );
    });

    // 🔹 Buscar todos los turnos en conflicto en otra sede
    const turnosExistentesOtraSede = await turnoModel.findAll({
      where: {
        enf_id,
        se_id: { [Op.ne]: se_id }, // Excluir la sede actual
        tur_fecha_inicio: { [Op.lte]: tur_fecha_fin },
        tur_fecha_fin: { [Op.gte]: tur_fecha_inicio },
      },
      include: [{ model: sedeModel, as: "sede", attributes: ["se_id", "se_nombre"] }] // Incluir datos de la sede
    });

    let conflictosEnOtraSede = turnosExistentesOtraSede.filter(t => {
      const inicioExistente = new Date(`${t.tur_fecha_inicio}T${convertirHoraA24Horas(t.tur_hora_inicio)}`).getTime();
      const finExistente = new Date(`${t.tur_fecha_fin}T${convertirHoraA24Horas(t.tur_hora_fin)}`).getTime();

      console.log("⚠️ Comparando con turno existente (OTRA SEDE):", inicioExistente, "-", finExistente);

      return (
        (fechaInicioTimestamp >= inicioExistente && fechaInicioTimestamp < finExistente) || // Nuevo turno inicia dentro de otro
        (fechaFinTimestamp > inicioExistente && fechaFinTimestamp <= finExistente) || // Nuevo turno termina dentro de otro
        (fechaInicioTimestamp <= inicioExistente && fechaFinTimestamp >= finExistente) // Nuevo turno cubre todo el existente
      );
    });

/* // 🔹 Asegurar el orden antes de enviar la respuesta
const turnosSede = conflictosEnMismaSede
  .map(turno => ({
    tur_id: turno.tur_id,
    enf_id: turno.enf_id,
    se_id: turno.se_id,
    tur_fecha_inicio: turno.tur_fecha_inicio,
    tur_hora_inicio: turno.tur_hora_inicio,
    tur_fecha_fin: turno.tur_fecha_fin,
    tur_hora_fin: turno.tur_hora_fin,
    tur_total_horas: turno.tur_total_horas,
    tur_tipo_turno: turno.tur_tipo_turno
  }))
  .sort((a, b) => {
    const fechaHoraA = new Date(`${a.tur_fecha_inicio}T${convertirHoraA24Horas(a.tur_hora_inicio)}`).getTime();
    const fechaHoraB = new Date(`${b.tur_fecha_inicio}T${convertirHoraA24Horas(b.tur_hora_inicio)}`).getTime();
    return fechaHoraA - fechaHoraB;
  });

const turnosOtraSede = conflictosEnOtraSede
  .map(turno => ({
    tur_id: turno.tur_id,
    enf_id: turno.enf_id,
    se_id: turno.se_id,
    se_nombre: turno.sede?.se_nombre || "Desconocido", // Agregar nombre de la sede
    tur_fecha_inicio: turno.tur_fecha_inicio,
    tur_hora_inicio: turno.tur_hora_inicio,
    tur_fecha_fin: turno.tur_fecha_fin,
    tur_hora_fin: turno.tur_hora_fin,
    tur_total_horas: turno.tur_total_horas,
    tur_tipo_turno: turno.tur_tipo_turno
  }))
  .sort((a, b) => {
    const fechaHoraA = new Date(`${a.tur_fecha_inicio}T${convertirHoraA24Horas(a.tur_hora_inicio)}`).getTime();
    const fechaHoraB = new Date(`${b.tur_fecha_inicio}T${convertirHoraA24Horas(b.tur_hora_inicio)}`).getTime();
    return fechaHoraA - fechaHoraB;
  });
 */



// 🔹 Si hay conflictos en la misma sede o en otra sede, devolverlos en la respuesta
if (conflictosEnMismaSede.length > 0 || conflictosEnOtraSede.length > 0) {
  return res.status(400).json({
    message: "⛔ Conflictos encontrados en los turnos asignados.",
    conflictos: {
      enEstaSede: conflictosEnMismaSede,
      enOtraSede: conflictosEnOtraSede,
    }
  });
}


    // 🔹 Crear el turno si no hay conflictos
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

    return res.status(201).json({ message: "✅ Turno asignado con éxito", data: nuevoTurno, advertencia: advertencia, });

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
    
    const hoy = moment().startOf("day").format("YYYY-MM-DD");

    // Obtener los turnos de la enfermera desde hoy en adelante
    const misTurnos = await turnoModel.findAll({
      where: {
        enf_id,
        tur_fecha_fin: { [Op.gte]: hoy } // Filtrar desde hoy
      },
      include: [
        {
          model: sedeModel,
          as: "sede",
          attributes: ["se_id", "se_nombre"],
        },
      ],
      order: [["tur_fecha_inicio", "ASC"], ["tur_hora_inicio", "ASC"]],
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
      message: "📅 Mis turnos asignados:",
      turnos_por_sede: Object.values(turnosAgrupados),
    });

  } catch (error) {
    console.error("❌ Error al obtener mis turnos:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};




// vista para cada enfermera, para q visualice histoial de turnos (hasta ayer)
const verMisTurnosEnfermeriaHistorial = async (req, res) => {
  try {
    const se_id = req.session.se_id;
    const ge_id = req.session.ge_id;
    const enf_id = req.session.enf_id;
    
    const hoy = moment().startOf("day").format("YYYY-MM-DD");

    // Obtener los turnos de la enfermera hasta ayer
    const misTurnosPasados = await turnoModel.findAll({
      where: {
        enf_id,
        tur_fecha_fin: { [Op.lt]: hoy } // ✅  turnos que finalizaron hasta ayer
      },
      include: [
        {
          model: sedeModel,
          as: "sede",
          attributes: ["se_id", "se_nombre"],
        },
      ],
      order: [["tur_fecha_inicio", "DESC"], ["tur_hora_inicio", "DESC"]], // Ordenar de más reciente a más antiguo
    });

    // 🔹 Agrupar turnos por sede
    const turnosAgrupados = misTurnosPasados.reduce((acc, turno) => {
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
      message: "📅 Historial de mis turnos:",
      turnos_por_sede: Object.values(turnosAgrupados),
    });

  } catch (error) {
    console.error("❌ Error al obtener mi historial de turnos:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};



// ver turnos de hoy en adelante de todas las enfermeras(os) en la sede del admin (admin sede)
const verTurnosSede = async (req, res) => {
  try {
    const se_id = req.session.se_id;

    if (!se_id) {
      return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
    }

    const hoy = moment().tz("America/Bogota").format("YYYY-MM-DD"); // Fecha de hoy
    const ahora = moment().tz("America/Bogota").format("HH:mm"); // Hora actual en formato 24h

    // Obtener los turnos de la sede desde hoy en adelante
    const turnos = await turnoModel.findAll({
      where: {
        se_id,
        [Op.or]: [
          { tur_fecha_fin: { [Op.gt]: hoy } }, // Turnos con fecha fin después de hoy
          { tur_fecha_fin: hoy, tur_hora_fin: { [Op.gt]: ahora } }, // Turnos de hoy cuya hora fin aún no ha pasado
        ],
      },
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

    // 🔹 Agrupar turnos por fecha
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




// ver histoial (hasta ayer) turnos de todas las enfermeras(os) en la sede del admin (admin sede)
const verTurnosSedeHistorial = async (req, res) => {
  try {
    const se_id = req.session.se_id;

    if (!se_id) {
      return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
    }

    const hoy = moment().startOf("day").format("YYYY-MM-DD");
    const ahora = moment().format("HH:mm:ss"); // Obtener la hora actual

    // Obtener los turnos finalizados hasta ayer o los de hoy con hora fin pasada
    const turnos = await turnoModel.findAll({
      where: {
        se_id,
        [Op.or]: [
          { tur_fecha_fin: { [Op.lt]: hoy } }, // ✅ Turnos con fecha fin antes de hoy
          { 
            tur_fecha_fin: hoy, 
            tur_hora_fin: { [Op.lt]: ahora } // ✅ Turnos de hoy que ya terminaron
          }
        ],
      },
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
        ["tur_fecha_inicio", "DESC"], // Ordenar de más reciente a más antiguo
        ["tur_hora_inicio", "DESC"],
      ],
    });

    // 🔹 Agrupar turnos por fecha
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
      message: "📅 Historial de turnos en la sede",
      turnos: turnosAgrupados,
    });

  } catch (error) {
    console.error("❌ Error al obtener el historial de turnos de la sede:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};



// eliminar turno enfermeria, no se puede eliminar turnos del historial (admin sede)
const eliminarTurnoEnfermeria = async (req, res) => {
  try {
    const { tur_id } = req.params;
    const se_id = req.session.se_id; 
    const ahora = moment().tz("America/Bogota"); // Fecha y hora actual
    const hoy = ahora.clone().startOf("day"); // Fecha actual sin horas

    console.log("🔹 Fecha y hora actuales:", ahora.format("YYYY-MM-DD HH:mm:ss"));

    if (!se_id) {
      return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
    }

    // Buscar el turno
    const turno = await turnoModel.findOne({ where: { tur_id, se_id } });

    if (!turno) {
      return res.status(404).json({ message: "⛔ Turno no pertenece a tu sede." });
    }

    // Convertir fechas y horas a objetos moment
    const fechaInicio = moment(turno.tur_fecha_inicio, "YYYY-MM-DD");
    const horaInicio = moment(turno.tur_hora_inicio, "hh:mm A");

    console.log("🔹 Fecha de inicio del turno:", fechaInicio.format("YYYY-MM-DD"));
    console.log("🔹 Hora de inicio del turno:", horaInicio.format("hh:mm A"));

    //  No permitir eliminar si el turno ya comenzó (fecha de inicio menor a hoy)
    if (fechaInicio.isBefore(hoy)) {
      return res.status(400).json({ message: "⛔ No se pueden eliminar turnos que se encuentran en curso." });
    }

    //  No permitir eliminar si la fecha es hoy pero la hora ya pasó
    if (fechaInicio.isSame(hoy, "day") && ahora.isAfter(horaInicio)) {
      return res.status(400).json({ message: "⛔ No se pueden eliminar turnos con un horario que ya se encuentra en curso." });
    }

    // 🟢 Permitir eliminar si la fecha es mayor a hoy o si es hoy pero aún no ha iniciado
    await turno.destroy();

    return res.status(200).json({ message: "✅ Turno eliminado correctamente." });
  } catch (error) {
    console.error("❌ Error al eliminar turno:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};




// actualizar turno de enfermeria (admin sede)
const actualizarTurnoEnfermeria = async (req, res) => {
  try {
    const se_id = req.session.se_id;
    const { tur_id } = req.params;
    const ahora = new Date(); // Fecha y hora actual
    const hoy = new Date(); // Nueva instancia para hoy a medianoche
    hoy.setHours(0, 0, 0, 0);
    const data = matchedData(req);
    
   
    if (!se_id) {
      return res.status(403).json({ message: "⛔ No tienes una sede asignada en la sesión." });
    }



    const turno = await turnoModel.findOne({ where: { tur_id, se_id } });
    if (!turno) {
      return res.status(404).json({ message: "⛔ Turno no pertenece a tu sede." });
    }




    const tur_hora_inicio = turno.tur_hora_inicio
    const tur_hora_fin = turno.tur_hora_fin    
    const tur_fecha_inicio = turno.tur_fecha_inicio
    const tur_fecha_fin = turno.tur_fecha_fin



    const horaInicio24 = convertirHoraA24Horas(tur_hora_inicio);
    const horaFin24 = convertirHoraA24Horas(tur_hora_fin);
    

    // Convertir fechas y horas a timestamp
    const fechaInicioTimestamp = new Date(`${tur_fecha_inicio}T${horaInicio24}`).getTime();
    const fechaFinTimestamp = new Date(`${tur_fecha_fin}T${horaFin24}`).getTime();

        
    // 🔍 Turno ya finalizó si su fecha de fin es antes de hoy o si es hoy y la hora de fin ya pasó
    const turnoYaTermino = fechaFinTimestamp < ahora.getTime();

    // 🔍 Turno ya inició si su fecha de inicio es antes de hoy o si es hoy y ya pasó la hora de inicio
    const turnoYaInicio = fechaInicioTimestamp < ahora.getTime();
    
    // 🔍 Turno aún no inicia si es hoy pero la hora de inicio aún no ha llegado o es fecha futura
    const turnoAunNoInicia = fechaInicioTimestamp > ahora.getTime();
    
    console.log("📊 Estado del turno:", { turnoYaTermino, turnoYaInicio, turnoAunNoInicia });
    
    
    if (turnoYaTermino) {
      return res.status(400).json({ message: "⛔ No puedes modificar un turno que ya finalizó." });
    }
    

    // 🟢 Validar la hora de fin respecto a la hora de inicio
    const errorHoraFin = validarHoraFin(
      data.tur_hora_inicio || turno.tur_hora_inicio,
      data.tur_hora_fin || turno.tur_hora_fin,
      data.tur_fecha_inicio || turno.tur_fecha_inicio,
      data.tur_fecha_fin || turno.tur_fecha_fin
    );
    if (errorHoraFin) {
      return res.status(400).json({ message: errorHoraFin });
    }
    
    let updateData = {};

    let advertencia = null;

    
    if (turnoYaInicio) {
        console.log("🔍 El turno ya inició. Se restringen cambios en la fecha y hora de inicio.");
        updateData.tur_fecha_inicio = turno.tur_fecha_inicio;
        updateData.tur_hora_inicio = turno.tur_hora_inicio;
        if (data.tur_fecha_fin) updateData.tur_fecha_fin = data.tur_fecha_fin;
        if (data.tur_hora_fin) updateData.tur_hora_fin = data.tur_hora_fin;
        // if (data.tur_tipo_turno) updateData.tur_tipo_turno = data.tur_tipo_turno;
      
        const horasTotales = calcularHorasTotales(
          updateData.tur_hora_inicio || turno.tur_hora_inicio,
          updateData.tur_hora_fin || turno.tur_hora_fin,
          updateData.tur_fecha_inicio || turno.tur_fecha_inicio,
          updateData.tur_fecha_fin || turno.tur_fecha_fin
        );   
          
          
        // 📌 Calcular tipo de turno
        const tur_tipo_turno = determinarTipoTurno(
          updateData.tur_hora_inicio || turno.tur_hora_inicio,
          updateData.tur_hora_fin || turno.tur_hora_fin,
        );


        const errorHoraFin = validarHoraFinTurno(
          data.tur_hora_fin ||  turno.tur_hora_fin,
          data.tur_fecha_fin || turno.tur_fecha_fin,
        );
  
        if (errorHoraFin) {
          return res.status(400).json({ message: errorHoraFin });
        }
  
          
        console.log("🕒 Horas totales calculadas:", horasTotales);
        console.log("🕒 Tipo turno:", tur_tipo_turno);
        // 📌 Asignar las horas totales calculadas
        updateData.tur_total_horas = horasTotales;
        updateData.tur_tipo_turno = tur_tipo_turno;


        if (horasTotales > 24) {
          advertencia = "⚠️ Advertencia: Este turno supera las 24 horas.";
        }
  
  
    }
      

    if (turnoAunNoInicia ) {
        console.log("🔍 El turno aún no inicia. Se permiten cambios en fecha y hora.");
        if (data.tur_fecha_inicio) updateData.tur_fecha_inicio = data.tur_fecha_inicio;
        if (data.tur_fecha_fin) updateData.tur_fecha_fin = data.tur_fecha_fin;
        if (data.tur_hora_inicio) updateData.tur_hora_inicio = data.tur_hora_inicio;
        if (data.tur_hora_fin) updateData.tur_hora_fin = data.tur_hora_fin;
        // if (data.tur_tipo_turno) updateData.tur_tipo_turno = data.tur_tipo_turno;     
        
        
        // 📌 Calcular horas totales del turno
        const horasTotales = calcularHorasTotales(
          updateData.tur_hora_inicio || turno.tur_hora_inicio,
          updateData.tur_hora_fin || turno.tur_hora_fin,
          updateData.tur_fecha_inicio || turno.tur_fecha_inicio,
          updateData.tur_fecha_fin || turno.tur_fecha_fin
        );
        
        
        // 📌 Calcular tipo de turno
      const tur_tipo_turno = determinarTipoTurno(
        updateData.tur_hora_inicio || turno.tur_hora_inicio,
        updateData.tur_hora_fin || turno.tur_hora_fin,
      );



      const errorHoraFin = validarHoraFinTurno(
        data.tur_hora_fin ||  turno.tur_hora_fin,
        data.tur_fecha_fin || turno.tur_fecha_fin,
      );

      if (errorHoraFin) {
        return res.status(400).json({ message: errorHoraFin });
      }


      const errorHora = validarHoraInicioTurno(
        data.tur_fecha_inicio || turno.tur_fecha_inicio,
        data.tur_hora_inicio ||  turno.tur_hora_inicio,
      );  

      if (errorHora) {
        return res.status(400).json({ message: errorHora });
      }


      console.log("🕒 Horas totales calculadas:", horasTotales);
      console.log("🕒 Tipo turno:", tur_tipo_turno);
      // 📌 Asignar las horas totales calculadas
      updateData.tur_total_horas = horasTotales;
      updateData.tur_tipo_turno = tur_tipo_turno;

      if (horasTotales > 24) {
        advertencia = "⚠️ Advertencia: Este turno supera las 24 horas.";
      }
      

    }
    
    

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "⛔ No hay cambios para actualizar." });

    }

    console.log("✅ Datos finales a actualizar:", updateData);



    const nuevaFechaInicio = updateData.tur_fecha_inicio || turno.tur_fecha_inicio;
    const nuevaFechaFin = updateData.tur_fecha_fin || turno.tur_fecha_fin;
    const nuevaHoraInicio = convertirHoraA24Horas(updateData.tur_hora_inicio || turno.tur_hora_inicio);
    const nuevaHoraFin = convertirHoraA24Horas(updateData.tur_hora_fin || turno.tur_hora_fin);


    const nuevoInicioTimestamp = new Date(`${nuevaFechaInicio}T${nuevaHoraInicio}`).getTime();
    const nuevoFinTimestamp = new Date(`${nuevaFechaFin}T${nuevaHoraFin}`).getTime();



    // 🔹 Buscar todos los turnos en conflicto en la misma sede
    const turnosExistentesSede = await turnoModel.findAll({
      where: {
        enf_id: turno.enf_id,
        se_id,
        tur_id: { [Op.ne]: tur_id },
        tur_fecha_inicio: { [Op.lte]: nuevaFechaFin },
        tur_fecha_fin: { [Op.gte]: nuevaFechaInicio },

      },
    });
    
    let conflictosEnMismaSede = turnosExistentesSede.filter(t => {
      const inicioExistente = new Date(`${t.tur_fecha_inicio}T${convertirHoraA24Horas(t.tur_hora_inicio)}`).getTime();
      const finExistente = new Date(`${t.tur_fecha_fin}T${convertirHoraA24Horas(t.tur_hora_fin)}`).getTime();
      
      return (
        (nuevoInicioTimestamp >= inicioExistente && nuevoInicioTimestamp < finExistente) || 
        (nuevoFinTimestamp > inicioExistente && nuevoFinTimestamp <= finExistente) || 
        (nuevoInicioTimestamp <= inicioExistente && nuevoFinTimestamp >= finExistente)
      );
    });
    
    // 🔹 Buscar todos los turnos en conflicto en otra sede
    const turnosExistentesOtraSede = await turnoModel.findAll({
      where: {
        enf_id: turno.enf_id,
        se_id: { [Op.ne]: se_id }, // Excluir la sede actual
        tur_fecha_inicio: { [Op.lte]: nuevaFechaFin },
        tur_fecha_fin: { [Op.gte]: nuevaFechaInicio },

      },
      include: [{ model: sedeModel, as: "sede", attributes: ["se_id", "se_nombre"] }] // Incluir datos de la sede
    });

    let conflictosEnOtraSede = turnosExistentesOtraSede.filter(t => {
      const inicioExistente = new Date(`${t.tur_fecha_inicio}T${convertirHoraA24Horas(t.tur_hora_inicio)}`).getTime();
      const finExistente = new Date(`${t.tur_fecha_fin}T${convertirHoraA24Horas(t.tur_hora_fin)}`).getTime();


      return (
        (nuevoInicioTimestamp >= inicioExistente && nuevoInicioTimestamp < finExistente) || 
        (nuevoFinTimestamp > inicioExistente && nuevoFinTimestamp <= finExistente) || 
        (nuevoInicioTimestamp <= inicioExistente && nuevoFinTimestamp >= finExistente)
      );
    });



// 🔹 Si hay conflictos en la misma sede o en otra sede, devolverlos en la respuesta
if (conflictosEnMismaSede.length > 0 || conflictosEnOtraSede.length > 0) {
  return res.status(400).json({
    message: "⛔ Conflictos encontrados en los turnos asignados.",
    conflictos: {
      enEstaSede: conflictosEnMismaSede,
      enOtraSede: conflictosEnOtraSede,
    }
  });
}


await turnoModel.update(updateData, { where: { tur_id } });
const turnoActualizado = await turnoModel.findOne({ where: { tur_id } });



return res.status(200).json({
  message: turnoYaInicio
    ? "✅ Turno actualizado con éxito. El turno ya esta en curso, solo se puede modificar fecha y hora de finalización."
    : "✅ Turno actualizado con éxito.",
  data: turnoActualizado,
  advertencia: advertencia,
});

} catch (error) {
  console.error("❌ Error al actualizar turno:", error);
  return res.status(500).json({ message: "⛔ Error en el servidor." });
}
};



      
      




module.exports = {  asignarTurnoEnfermeria, verMisTurnosEnfermeria, verMisTurnosEnfermeriaHistorial, verTurnosSede, verTurnosSedeHistorial, eliminarTurnoEnfermeria, actualizarTurnoEnfermeria };


