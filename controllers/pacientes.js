const { Op } = require("sequelize");
const { matchedData } = require("express-validator");
const { pacienteModel, sedeModel, personaModel, acudienteModel, sedePersonaRolModel,
} = require("../models");



// registrar paciente en base de datos
const registrarPaciente = async (req, res) => {
  try {
    const data = matchedData(req);
    const {
      per_id,
      pac_edad,
      pac_peso,
      pac_talla,
      pac_regimen_eps,
      pac_nombre_eps,
      pac_rh_grupo_sanguineo,
      pac_talla_camisa,
      pac_talla_pantalon,
    } = data;

    /*     const se_id = req.session.se_id;

    // Verificar si la persona tiene el rol de paciente ACTIVO EN ESTA SEDE para permitir registrar datos adicionales
    const rolPacienteActivo = await sedePersonaRolModel.findOne({
      where: {
          se_id, // la de sesion...
          per_id,
          rol_id: 4, // paciente
          sp_activo: true
      },
  });

  if (!rolPacienteActivo) {
    return res.status(403).json({ 
        message: "La persona no tiene el rol de paciente activo en esta sede."
    });
} */

    // Verificar si la persona ya está registrada como paciente
    const datosPacienteExistente = await pacienteModel.findOne({
      where: { per_id },
      include: [
        {
          model: personaModel,
          as: "persona",
          attributes: ["per_nombre_completo", "per_documento"],
        },
      ],
    });

    if (datosPacienteExistente) {
      return res.status(200).json({
        message: "El paciente ya tiene datos registrados:",
        existe: true, // ✅  El frontend debe cargar estos datos en lugar de registrar

        datosPacienteExistente: {
          nombre: datosPacienteExistente.persona.per_nombre_completo,
          documento: datosPacienteExistente.persona.per_documento,
          edad: datosPacienteExistente.pac_edad,
          peso: datosPacienteExistente.pac_peso,
          talla: datosPacienteExistente.pac_talla,
          regimen_eps: datosPacienteExistente.pac_regimen_eps,
          nombre_eps: datosPacienteExistente.pac_nombre_eps,
          rh_grupo_sanguineo: datosPacienteExistente.pac_rh_grupo_sanguineo,
          talla_camisa: datosPacienteExistente.pac_talla_camisa,
          talla_pantalon: datosPacienteExistente.pac_talla_pantalon,
        },
      });
    }

    //Registrar datos del paciente (si ya no existen)
    const nuevoPaciente = await pacienteModel.create({
      per_id,
      pac_edad,
      pac_peso,
      pac_talla,
      pac_regimen_eps,
      pac_nombre_eps,
      pac_rh_grupo_sanguineo,
      pac_talla_camisa,
      pac_talla_pantalon,
    });

    return res.status(201).json({
      message: "Paciente registrado con éxito.",
      nuevoPaciente,
    });
  } catch (error) {
    console.error("Error al registrar paciente:", error);
    return res.status(500).json({
      message: "Error al registrar paciente.",
      error: error.message,
    });
  }
};



// ver TODOS los pacientes de mi sede lista segmentada (admin sede, enfermeros)
const obtenerRolesPacientesSede = async (req, res) => {
  try {
    const se_id = req.session.se_id;

    const pacientes = await sedePersonaRolModel.findAll({
      where: { se_id, rol_id: 4 },
      attributes: ["sp_fecha_inicio", "sp_fecha_fin", "sp_activo"],
      include: [
        {
          model: personaModel,
          as: "persona",
          attributes: ["per_id", "per_nombre_completo", "per_documento"],
          include: [
            {
              model: pacienteModel, // Incluir datos de paciente
              as: "paciente",
              attributes: ["pac_id"],
            },
          ],
        },
      ],
      order: [["sp_activo", "DESC"]], // Ordenar primero los activos
    });

    if (pacientes.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay pacientes vinculados a esta sede." });
    }

    const respuestaPacientes = pacientes.map((p) => ({
      pac_id: p.persona.paciente?.pac_id || null, // Puede ser null si no tiene registro en pacientes
      per_id: p.persona.per_id,
      nombre: p.persona.per_nombre_completo,
      documento: p.persona.per_documento,
      fechaInicio: p.sp_fecha_inicio,
      fechaFin: p.sp_fecha_fin,
      pacienteActivo: p.sp_activo,
    }));

    return res.status(200).json({
      message: "Pacientes obtenidos exitosamente",
      pacientes: respuestaPacientes, // Ahora es un array de pacientes
    });
  } catch (error) {
    console.error("Error al obtener pacientes por sede:", error);
    return res.status(500).json({ message: "Error al obtener pacientes." });
  }
};



// obtener detalle de un paciente
const obtenerDetallePaciente = async (req, res) => {
  try {
    const { per_id } = req.params;
    const ge_id = req.session.ge_id; // Obtener el geriátrico desde la sesión

    if (!ge_id) {
      return res
        .status(403)
        .json({ message: "No tienes un geriátrico asignado en la sesión." });
    }

    // 🔹 Obtener todas las sedes del geriátrico en sesión
    const sedes = await sedeModel.findAll({
      where: { ge_id },
      attributes: ["se_id"],
    });

    const sedeIds = sedes.map((sede) => sede.se_id); // Obtener solo los IDs de las sedes

    // Buscar el paciente en la sede
    const paciente = await sedePersonaRolModel.findOne({
      where: { rol_id: 4, per_id, se_id: sedeIds }, // Solo pacientes de las sedes del geriatrico en sesion
      attributes: ["sp_activo"],
      include: [
        {
          model: personaModel,
          as: "persona",
          attributes: [
            "per_id",
            "per_nombre_completo",
            "per_documento",
            "per_foto",
          ],
          include: [
            {
              model: pacienteModel,
              as: "paciente",
              attributes: [
                "pac_id",
                "pac_edad",
                "pac_peso",
                "pac_talla",
                "pac_regimen_eps",
                "pac_nombre_eps",
                "pac_rh_grupo_sanguineo",
                "pac_talla_camisa",
                "pac_talla_pantalon",
              ],
            },
          ],
        },
      ],
    });

    if (!paciente) {
      return res
        .status(404)
        .json({
          message: "Paciente no encontrado en el geriátrico al que perteneces.",
        });
    }

    const detallePaciente = {
      pac_id: paciente.persona.paciente.pac_id,
      per_id: paciente.persona.per_id,
      pacienteActivo: paciente.sp_activo,
      nombre: paciente.persona.per_nombre_completo,
      documento: paciente.persona.per_documento,
      foto: paciente.persona.per_foto,
      edad: paciente.persona.paciente.pac_edad,
      peso: paciente.persona.paciente.pac_peso,
      talla: paciente.persona.paciente.pac_talla,
      regimen_eps: paciente.persona.paciente.pac_regimen_eps,
      nombre_eps: paciente.persona.paciente.pac_nombre_eps,
      rh_grupo_sanguineo: paciente.persona.paciente.pac_rh_grupo_sanguineo,
      talla_camisa: paciente.persona.paciente.pac_talla_camisa,
      talla_pantalon: paciente.persona.paciente.pac_talla_pantalon,
    };

    return res.status(200).json({
      message: "Paciente obtenido exitosamente",
      paciente: detallePaciente, // Ahora es un array de pacientes
    });
  } catch (error) {
    console.error("Error al obtener el paciente por ID:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener los datos del paciente." });
  }
};



// Obtener Acudiente(s) de un Paciente
const obtenerAcudientesDePaciente = async (req, res) => {
  try {
    const { pac_id } = req.params;

    const acudientes = await acudienteModel.findAll({
      where: { pac_id },
      attributes: ["acu_id", "pac_id", "per_id", "acu_parentesco", "acu_foto"],
      include: [
        {
          model: personaModel,
          as: "persona",
          attributes: [
            "per_nombre_completo",
            "per_documento",
            "per_correo",
            "per_telefono",
          ],
        },
      ],
    });

    if (!acudientes.length) {
      return res
        .status(404)
        .json({ message: "No hay acudientes para este paciente." });
    }

    const respuestaAcudientes = acudientes.map((acudiente) => ({
      per_id_acudiente: acudiente.per_id, // Renombrado
      nombre_completo: acudiente.persona.per_nombre_completo,
      documento: acudiente.persona.per_documento,
      telefono: acudiente.persona.per_telefono,
      correo: acudiente.persona.per_correo,
      parentesco: acudiente.acu_parentesco,
      foto: acudiente.acu_foto || null, // Mantener null si no hay foto
    }));

    return res.status(200).json({
      acudientes: respuestaAcudientes,
    });
  } catch (error) {
    console.error("Error al obtener los acudientes:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener los acudientes." });
  }
};



// Actualizar detalle de un paciente (admin sede)
const actualizarDetallePaciente = async (req, res) => {
  try {
    const { per_id } = req.params;
    const data = matchedData(req);
    const { rol_id, ge_id, se_id } = req.session; // Datos de la sesión

    if (!ge_id) {
      return res
        .status(403)
        .json({ message: "No tienes un geriátrico asignado en la sesión." });
    }

    // Si el usuario es admin sede (rol_id = 3), debe verificar que el paciente esté en su sede
    if (rol_id === 3) {
      const perteneceASede = await sedePersonaRolModel.findOne({
        where: { per_id, se_id, rol_id: 4 }, // Verifica que el paciente (rol_id = 4) esté en la sede del admin sede
      });

      if (!perteneceASede) {
        return res
          .status(403)
          .json({ message: "No tienes permiso para modificar este paciente." });
      }
    }

    // Buscar el paciente en la base de datos
    const paciente = await pacienteModel.findOne({ where: { per_id } });

    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado." });
    }

    let updateData = {}; // Objeto para almacenar los cambios

    // Solo actualizar si el dato es diferente del existente
    if (data.pac_edad !== undefined && data.pac_edad !== paciente.pac_edad)
      updateData.pac_edad = data.pac_edad;
    if (data.pac_peso !== undefined && data.pac_peso !== paciente.pac_peso)
      updateData.pac_peso = data.pac_peso;
    if (data.pac_talla !== undefined && data.pac_talla !== paciente.pac_talla)
      updateData.pac_talla = data.pac_talla;
    if (
      data.pac_regimen_eps !== undefined &&
      data.pac_regimen_eps !== paciente.pac_regimen_eps
    )
      updateData.pac_regimen_eps = data.pac_regimen_eps;
    if (
      data.pac_nombre_eps !== undefined &&
      data.pac_nombre_eps !== paciente.pac_nombre_eps
    )
      updateData.pac_nombre_eps = data.pac_nombre_eps;
    if (
      data.pac_rh_grupo_sanguineo !== undefined &&
      data.pac_rh_grupo_sanguineo !== paciente.pac_rh_grupo_sanguineo
    )
      updateData.pac_rh_grupo_sanguineo = data.pac_rh_grupo_sanguineo;
    if (
      data.pac_talla_camisa !== undefined &&
      data.pac_talla_camisa !== paciente.pac_talla_camisa
    )
      updateData.pac_talla_camisa = data.pac_talla_camisa;
    if (
      data.pac_talla_pantalon !== undefined &&
      data.pac_talla_pantalon !== paciente.pac_talla_pantalon
    )
      updateData.pac_talla_pantalon = data.pac_talla_pantalon; // Solo actualizar si hay datos válidos

    if (Object.keys(updateData).length > 0) {
      await paciente.update(updateData);
    }

/*     console.log("Datos recibidos:", data);
    console.log("Datos actuales en DB:", paciente);
    console.log("Datos a actualizar:", updateData);
 */

    // Obtener la información actualizada
    const pacienteActualizado = await pacienteModel.findOne({
      where: { per_id },
    });

    return res.status(200).json({
      message: "Paciente actualizado correctamente.",
      paciente: pacienteActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar el paciente:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};







module.exports = {
  registrarPaciente,
  obtenerRolesPacientesSede,
  obtenerDetallePaciente,
  obtenerAcudientesDePaciente,
  actualizarDetallePaciente,
};
