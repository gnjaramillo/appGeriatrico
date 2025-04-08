const { Op } = require('sequelize');
const { Sequelize } = require("sequelize");

const { sequelize } = require('../config/mysql'); 
const { io } = require('../utils/handleSocket'); 
const moment = require('moment-timezone');
const { matchedData } = require('express-validator');
const { formulacionMedicamentosModel, personaModel,sedePersonaRolModel, medicamentosModel, pacienteModel } = require('../models');




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




// formulas vigentes, estado pendiente o en curso de cada paciente
const formulacionMedicamentoVigente = async (req, res) => {
    try {
      const { pac_id } = req.params;
  
      // Fecha de hoy en zona horaria Colombia
      const hoy = moment().tz("America/Bogota").startOf("day").format("YYYY-MM-DD");

      
      const formulacionVigente = await formulacionMedicamentosModel.findAll({
        where: {
          pac_id,
          admin_estado: {
            [Op.in]: ['Pendiente', 'En Curso']
          },
          
          admin_fecha_fin: {
            [Op.gte]: hoy, // 👉 Fecha fin mayor o igual que hoy
          },
        },
        include: [
          {
            model: medicamentosModel,
            as: "medicamentos_formulados",
            attributes: ["med_nombre", "med_presentacion"],
          },
/*           {
            model: pacienteModel,
            as: "paciente",
            attributes: ["pac_id"], // No traemos nada de paciente
          }
 */        ],
        order: [
          ["admin_fecha_inicio", "DESC"],
          ["admin_hora", "DESC"]
        ]
      });

      const formulacionvigente = formulacionVigente.map(f => {
        return {
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
      });
      
  
      return res.status(200).json({
        message: "Formulaciones vigentes obtenidas exitosamente.",
        formulacion: formulacionvigente
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

      // Si está suspendida, incluir fecha de suspensión
      if (f.admin_estado === "Suspendido") {
        base.admin_fecha_suspension = f.admin_fecha_suspension;
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




// si la formula esta pendiente, actualiza todo menos su estado, si la formula esta en curso puede actualizar solo fecha fin y cambiar estado a suspendido..





/* const actualizarFormulacionMedicamento = async (req, res) => {
  try {
    const { admin_id } = req.params;
    const data = matchedData(req, { locations: ["body"] });

    const formulacion = await formulacionMedicamentosModel.findByPk(admin_id);

    if (!formulacion) {
      return res.status(404).json({ message: "Formulación no encontrada." });
    }

    const estadoActual = formulacion.admin_estado;

    // --- ESTADO: PENDIENTE ---
    if (estadoActual === "Pendiente") {
      if ("admin_estado" in data && data.admin_estado !== "Pendiente") {
        return res.status(400).json({
          message: "No puedes cambiar el estado mientras esté Pendiente.",
        });
      }

      // Eliminar admin_estado si viene, por seguridad
      delete data.admin_estado;

      await formulacion.update(data);

      return res.status(200).json({
        message: "Formulación actualizada correctamente (estado: Pendiente).",
        formulacion,
      });
    }


    // --- ESTADO: EN CURSO ---
if (estadoActual === "En Curso") {
  const camposActualizados = Object.keys(data);

  // Solo se permite actualizar admin_fecha_fin o admin_estado
  const camposNoPermitidos = camposActualizados.filter(
    campo => campo !== "admin_fecha_fin" && campo !== "admin_estado"
  );

  if (camposNoPermitidos.length > 0) {
    return res.status(400).json({
      message: `No puedes modificar los campos: ${camposNoPermitidos.join(", ")} cuando la formulación está En Curso.`,
    });
  }

  // ❌ Validar que no se estén actualizando ambos campos a la vez
  if ("admin_fecha_fin" in data && "admin_estado" in data) {
    return res.status(400).json({
      message: "No puedes modificar fecha_fin y estado al mismo tiempo cuando la formulación está En Curso.",
    });
  }

  // 👉 Si se cambia a 'Suspendido'
  if (data.admin_estado === "Suspendido") {
    formulacion.admin_estado = "Suspendido";
    formulacion.admin_fecha_suspension = moment().tz("America/Bogota").format("YYYY-MM-DD");

    await formulacion.save();

    return res.status(200).json({
      message: "Formulación suspendida correctamente.",
      formulacion,
    });
  }

  // 👉 Si solo se actualiza fecha_fin
  if ("admin_fecha_fin" in data) {
    await formulacion.update({ admin_fecha_fin: data.admin_fecha_fin });

    return res.status(200).json({
      message: "Fecha de finalización actualizada correctamente.",
      formulacion,
    });
  }

  return res.status(400).json({
    message: "No se detectaron cambios válidos para aplicar.",
  });
}


  } catch (error) {
    console.error("Error al actualizar formulación médica:", error);
    return res.status(500).json({
      message: "Error interno al intentar actualizar la formulación.",
    });
  }
}; */





const actualizarFormulacionMedicamento = async (req, res) => {
  try {
    const { admin_id } = req.params;
    const data = matchedData(req, { locations: ["body"] });

    const formulacion = await formulacionMedicamentosModel.findByPk(admin_id);

    if (!formulacion) {
      return res.status(404).json({ message: "Formulación no encontrada." });
    }

    const estadoActual = formulacion.admin_estado;

    // --- ESTADO: PENDIENTE ---
    if (estadoActual === "Pendiente") {
      if ("admin_estado" in data && data.admin_estado !== "Pendiente") {
        return res.status(400).json({
          message: "No puedes cambiar el estado mientras esté Pendiente.",
        });
      }

      // Eliminar admin_estado si viene, por seguridad
      delete data.admin_estado;

      await formulacion.update(data);

      return res.status(200).json({
        message: "Formulación actualizada correctamente (estado: Pendiente).",
        formulacion,
      });
    }

    // --- ESTADO: EN CURSO ---
    if (estadoActual === "En Curso") {
      const camposActualizados = Object.keys(data);

      // Solo se permite actualizar admin_fecha_fin o admin_estado
      const camposNoPermitidos = camposActualizados.filter(
        campo => campo !== "admin_fecha_fin" && campo !== "admin_estado"
      );

      if (camposNoPermitidos.length > 0) {
        return res.status(400).json({
          message: `No puedes modificar los campos: ${camposNoPermitidos.join(", ")} cuando la formulación está En Curso.`,
        });
      }

      // ❌ Validar que no se estén actualizando ambos campos a la vez
      if ("admin_fecha_fin" in data && "admin_estado" in data) {
        return res.status(400).json({
          message: "Una formulación en curso, solo permite ser ampliada actualizando fecha fin ó puede ser suspendida actualizando su estado. No se permite cambiar los dos campos al mismo tiempo.",
        });
      }

      // 👉 Si se cambia a 'Suspendido'
      if (data.admin_estado === "Suspendido") {
        formulacion.admin_estado = "Suspendido";
        formulacion.admin_fecha_suspension = moment().tz("America/Bogota").format("YYYY-MM-DD");

        await formulacion.save();

        return res.status(200).json({
          message: "Formulación suspendida correctamente.",
          formulacion,
        });
      }

      // 👉 Si solo se actualiza fecha_fin
      if ("admin_fecha_fin" in data) {
        await formulacion.update({ admin_fecha_fin: data.admin_fecha_fin });

        return res.status(200).json({
          message: "Fecha de finalización actualizada correctamente.",
          formulacion,
        });
      }

      return res.status(400).json({
        message: "No se detectaron cambios válidos para aplicar.",
      });
    }

    // --- ESTADO: COMPLETADO o SUSPENDIDO ---
    return res.status(403).json({
      message: `No se puede modificar una formulación en estado '${estadoActual}'.`,
    });

  } catch (error) {
    console.error("Error al actualizar formulación médica:", error);
    return res.status(500).json({
      message: "Error interno al intentar actualizar la formulación.",
    });
  }
};

module.exports = { actualizarFormulacionMedicamento };




  module.exports = { 
    registrarFormulacionMedicamento, 
    formulacionMedicamentoVigente,
    formulacionMedicamentoHistorial,
    actualizarFormulacionMedicamento
};


  