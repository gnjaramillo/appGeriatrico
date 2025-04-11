const { Op } = require('sequelize');
const { Sequelize } = require("sequelize");
const { sequelize } = require('../config/mysql'); 
const { io } = require('../utils/handleSocket'); 
const moment = require('moment-timezone');
const { matchedData } = require('express-validator');
const { formulacionMedicamentosModel, personaModel,sedePersonaRolModel, medicamentosModel, pacienteModel } = require('../models');



// ingresar formula medica
const registrarFormulacionMedicamento = async (req, res) => {
    try {
      const { pac_id } = req.params;
      const se_id = req.session.se_id;
      const data = matchedData(req);
      const {
        med_id,
        admin_fecha_inicio,
        admin_fecha_fin,
        admin_dosis_por_toma,
        admin_tipo_cantidad,
        admin_hora,
        admin_metodo,

        
      } = data;
      // Validación básica

      
      // Verificar existencia del paciente   
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


      if (!med_id || !admin_fecha_inicio || !admin_fecha_fin || !admin_dosis_por_toma || !admin_tipo_cantidad || !admin_hora || !admin_metodo) {
        return res.status(400).json({ message: "Faltan datos obligatorios en la formulación." });
      }
  
   

  
      const nuevaFormulacion = await formulacionMedicamentosModel.create({
        pac_id,
        med_id,
        admin_fecha_inicio,
        admin_fecha_fin,
        admin_dosis_por_toma,
        admin_tipo_cantidad,
        admin_hora,
        admin_metodo,
        admin_estado: "Pendiente"
      
      });

   // 🔥 Emitir evento por WebSocket
    io.emit("formulacionRegistrada", {
      message: "Se ha registrado una nueva formulación médica.",
      formulacion: nuevaFormulacion,
    });

  
      return res.status(201).json({
        message: "Formulación médica registrada exitosamente.",
        formulacion: nuevaFormulacion
      });
  
    } catch (error) {
      console.error("Error al registrar formulación médica:", error);
      return res.status(500).json({
        message: "Error interno al registrar la formulación.",
      });
    }
};



// formulas vigentes, estado pendiente(por iniciar) o en curso de cada paciente
const formulacionMedicamentoVigente = async (req, res) => {
  try {
    const { pac_id } = req.params;

    const formulacionVigente = await formulacionMedicamentosModel.findAll({
      where: {
        pac_id,
        admin_estado: {
          [Op.in]: ['Pendiente', 'En Curso']
        },
      },
      include: [
        {
          model: medicamentosModel,
          as: "medicamentos_formulados",
          attributes: ["med_nombre", "med_presentacion"],
        },
      ],
      order: [
        ["admin_fecha_inicio", "DESC"],
        ["admin_hora", "DESC"]
      ]
    });

    // Agrupar por estado
    const agrupadas = {
      pendiente: [],
      en_curso: []
    };

    formulacionVigente.forEach(f => {
      const item = {
        admin_id: f.admin_id,
        pac_id: f.pac_id,
        med_id: f.med_id,
        medicamentos_formulados: f.medicamentos_formulados,
        admin_fecha_inicio: f.admin_fecha_inicio,
        admin_fecha_fin: f.admin_fecha_fin,
        admin_hora: f.admin_hora,
        admin_dosis_por_toma: f.admin_dosis_por_toma,
        admin_tipo_cantidad: f.admin_tipo_cantidad,
        admin_metodo: f.admin_metodo,
        admin_estado: f.admin_estado,
        admin_total_dosis_periodo: f.admin_total_dosis_periodo,
      };

      if (f.admin_estado === 'Pendiente') {
        agrupadas.pendiente.push(item);
      } else if (f.admin_estado === 'En Curso') {
        agrupadas.en_curso.push(item);
      }
    });

    return res.status(200).json({
      message: "Formulaciones agrupadas por estado.",
      pendientes: agrupadas.pendiente,
      en_curso: agrupadas.en_curso
    });

  } catch (error) {
    console.error("Error al obtener historial de formulaciones:", error);
    return res.status(500).json({
      message: "Error interno al obtener el historial de formulaciones.",
    });
  }
};



// formulas completadas y suspendidas agrupadas por paciente
const formulacionMedicamentoHistorial = async (req, res) => {
  try {
    const { pac_id } = req.params;

    // Obtener todas las formulaciones con estado Completado o Suspendido
    const todas = await formulacionMedicamentosModel.findAll({
      where: {
        pac_id,
        admin_estado: {
          [Op.in]: ['Completado', 'Suspendido']
        }
      },
      include: [
        {
          model: medicamentosModel,
          as: "medicamentos_formulados",
          attributes: ["med_nombre", "med_presentacion"],
        },
        {
          model: personaModel,
          as: "suspendido_por",
          attributes: ["per_nombre_completo", "per_documento"],
        }
      ],
      order: [
        ["admin_estado", "ASC"],
        ["admin_fecha_inicio", "DESC"],
        ["admin_hora", "DESC"]
      ]
    });

    // Agrupar en dos listas
    const completadas = todas.filter(f => f.admin_estado === "Completado");
    const suspendidas = todas.filter(f => f.admin_estado === "Suspendido");

    // Mapear campos con formato limpio y ordenado
    const mapearFormulacion = (f) => {
      const base = {
        admin_id: f.admin_id,
        pac_id: f.pac_id,
        med_id: f.med_id,
        medicamentos_formulados: f.medicamentos_formulados, // trae nombre y presentacion del medicamento
        admin_fecha_inicio: f.admin_fecha_inicio,
        admin_fecha_fin: f.admin_fecha_fin,
        admin_hora: f.admin_hora,
        admin_dosis_por_toma: f.admin_dosis_por_toma,
        admin_tipo_cantidad: f.admin_tipo_cantidad,
        admin_metodo: f.admin_metodo,
        admin_estado: f.admin_estado,
        admin_total_dosis_periodo: f.admin_total_dosis_periodo,
      };

      // Si está suspendida, incluir fecha de suspensión
      if (f.admin_estado === "Suspendido") {
        base.admin_fecha_suspension = f.admin_fecha_suspension;
        base.admin_motivo_suspension = f.admin_motivo_suspension;
        base.suspendido_por = f.suspendido_por; // Contiene nombre y documento

      }

      return base;
    };

    // Aplicar mapeo
    const completadasMapeadas = completadas.map(mapearFormulacion);
    const suspendidasMapeadas = suspendidas.map(mapearFormulacion);

    // Respuesta final
    return res.status(200).json({
      message: "Historial de formulaciones obtenido exitosamente.",
      completadas: completadasMapeadas,
      suspendidas: suspendidasMapeadas
    });

  } catch (error) {
    console.error("Error al obtener historial de formulaciones:", error);
    return res.status(500).json({
      message: "Error interno al obtener el historial de formulaciones.",
    });
  }
};



// si la formula esta pendiente, se puede actualizar todo menos su estado
const actualizarFormulacionPendiente = async (req, res) => {
  try {
    const { admin_id } = req.params;
    const data = matchedData(req);

    const formulacion = await formulacionMedicamentosModel.findByPk(admin_id);

    if (!formulacion) {
      return res.status(404).json({ message: "Formulación no encontrada." });
    }

    // Validar que esté en estado Pendiente
    if (formulacion.admin_estado !== "Pendiente") {
      return res.status(400).json({
        message: "Solo se pueden actualizar formulaciones en estado 'Pendiente'.",
      });
    }

    // No permitir que se cambie el estado
    if ("admin_estado" in data && data.admin_estado !== "Pendiente") {
      return res.status(400).json({
        message: "No se permite modificar el estado de una formulación pendiente.",
      });
    }

    // Por seguridad, eliminar admin_estado si viene
    delete data.admin_estado;

    // Actualizar con el resto de campos permitidos
    await formulacion.update(data);

   // 🔥 Emitir evento por WebSocket
    io.emit("formulacionActualizada", {
      admin_id: formulacion.admin_id,
      message: "Formulación pendiente actualizada.",
      data: formulacion, 
    });

    return res.status(200).json({
      message: "Formulación actualizada correctamente.",
      formulacion,
    });

  } catch (error) {
    console.error("Error al actualizar formulación pendiente:", error);
    return res.status(500).json({
      message: "Error interno al intentar actualizar la formulación pendiente.",
    });
  }
};



//si la formula aun no inicia, se puede eliminar
const deleteFormulacionPendiente = async (req, res) => {
  const { admin_id } = req.params;

  try {
    // Buscar la formulación
    const formulacion = await formulacionMedicamentosModel.findByPk(admin_id);

    if (!formulacion) {
      return res.status(404).json({
        message: "La formulación no fue encontrada.",
      });
    }

    // Verificar que esté en estado "Pendiente"
    if (formulacion.admin_estado !== "Pendiente") {
      return res.status(400).json({
        message: "Solo se puede eliminar una formulación en estado Pendiente.",
      });
    }

    // Eliminar la formulación
    await formulacion.destroy();


   // 🔥 Emitir evento por WebSocket    
    io.emit("formulacionEliminada", {
      admin_id: Number(admin_id),
      message: "Formulación pendiente eliminada.",
    });



    return res.status(200).json({
      message: "Formulación eliminada correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar formulación:", error);
    return res.status(500).json({
      message: "Ocurrió un error al intentar eliminar la formulación.",
    });
  }
};



// una formula en curso puede ser suspendida.. 
const suspenderFormulacionEnCurso = async (req, res) => {
  try {
    const { admin_id } = req.params;
    const { admin_motivo_suspension } = matchedData(req); 
    const usuario_id = req.session.per_id; // obtener datos de persona q suspende formula en sistema

    const formulacion = await formulacionMedicamentosModel.findByPk(admin_id);

    if (!formulacion) {
      return res.status(404).json({ message: "Formulación no encontrada." });
    }

    // Validar que esté en estado "En Curso"
    if (formulacion.admin_estado !== "En Curso") {
      return res.status(400).json({
        message: "Solo se pueden suspender formulaciones que estén en curso.",
      });
    }

    // Validar que venga motivo
    if (!admin_motivo_suspension) {
      return res.status(400).json({
        message: "Debe ingresar un motivo de suspensión.",
      });
    }

    // Actualizar estado, motivo, fecha de suspensión y quién suspendió
    await formulacion.update({
      admin_estado: "Suspendido",
      admin_fecha_suspension: new Date(),
      admin_motivo_suspension,
      admin_suspendido_por: usuario_id
    });

    // 🔥 Emitir evento WebSocket
    io.emit("formulacionSuspendida", {
      admin_id: formulacion.admin_id,
      message: "Formulación suspendida correctamente.",
      data: formulacion
    });

    return res.status(200).json({
      message: "Formulación suspendida correctamente.",
      formulacion,
    });

  } catch (error) {
    console.error("Error al suspender la formulación:", error);
    return res.status(500).json({
      message: "Error interno al intentar suspender la formulación.",
    });
  }
};



// una formula en curso puede ampliar su tratamiento, extendiendo su fecha fin.. 
const extenderFechaFinFormulacion = async (req, res) => {
  try {
    const { admin_id } = req.params;
    const { admin_fecha_fin } = matchedData(req);

    const formulacion = await formulacionMedicamentosModel.findByPk(admin_id);

    if (!formulacion) {
      return res.status(404).json({ message: "Formulación no encontrada." });
    }

    // Validar estado actual
    if (formulacion.admin_estado !== "En Curso") {
      return res.status(400).json({
        message: "Solo se puede ampliar la fecha de formulaciones en curso.",
      });
    }

    const hoy = moment().tz("America/Bogota").startOf("day").format("YYYY-MM-DD");

    if (admin_fecha_fin <= hoy) {
      return res.status(400).json({
        message: "La nueva fecha fin debe ser posterior a la fecha actual (hoy).",
      });
    }

    if (admin_fecha_fin <= formulacion.admin_fecha_fin) {
      return res.status(400).json({
        message: "La nueva fecha fin debe ser mayor a la actual registrada.",
      });
    }

    // Actualizar fecha fin
    await formulacion.update({ admin_fecha_fin });

    // 🔥 Emitir evento WebSocket
    io.emit("formulacionAmpliada", {
      admin_id: formulacion.admin_id,
      message: "Fecha de finalización de formulación ampliada.",
      data: formulacion,
    });

    return res.status(200).json({
      message: "Fecha de finalización actualizada correctamente.",
      formulacion,
    });

  } catch (error) {
    console.error("Error al ampliar fecha fin de formulación:", error);
    return res.status(500).json({
      message: "Error interno al intentar ampliar la fecha.",
    });
  }
};




// ver detalle medicamento y dosis especifica q se debe dar al paciente cada dia... 
const obtenerFormulacionesDelDia = async (req, res) => {
  try {
    const hoy = moment().tz("America/Bogota").format("YYYY-MM-DD");

    const { pac_id } = req.params;

    const formulacionesHoy = await formulacionMedicamentosModel.findAll({
      where: {
        pac_id,
        admin_estado: {
          [Op.in]: ['Pendiente', 'En Curso']
        },
        admin_fecha_inicio: { [Op.lte]: hoy },
        admin_fecha_fin: { [Op.gte]: hoy },
      },
      include: [
        {
          model: medicamentosModel,
          as: "medicamentos_formulados",
          attributes: ["med_nombre", "med_presentacion"],
        },
      ],
      order: [
        ["admin_hora", "ASC"]
      ]
    });

    const resultado = formulacionesHoy.map(f => ({
      admin_id: f.admin_id,
      pac_id: f.pac_id,
      med_id: f.med_id,
      medicamentos_formulados: f.medicamentos_formulados,
      admin_fecha_inicio: f.admin_fecha_inicio,
      admin_fecha_fin: f.admin_fecha_fin,
      admin_hora: f.admin_hora,
      admin_dosis_por_toma: f.admin_dosis_por_toma,
      admin_tipo_cantidad: f.admin_tipo_cantidad,
      admin_metodo: f.admin_metodo,
      admin_estado: f.admin_estado,
      admin_total_dosis_periodo: f.admin_total_dosis_periodo,
    }));

    res.status(200).json(resultado);

  } catch (error) {
    console.error("Error al obtener formulaciones del día:", error);
    res.status(500).json({ message: "Error al obtener formulaciones del día." });
  }
};






  module.exports = { 
    registrarFormulacionMedicamento, 
    formulacionMedicamentoVigente,
    formulacionMedicamentoHistorial,
    actualizarFormulacionPendiente ,
    deleteFormulacionPendiente,
    suspenderFormulacionEnCurso,
    extenderFechaFinFormulacion,
    obtenerFormulacionesDelDia
};


  