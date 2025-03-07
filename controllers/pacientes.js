const { Op } = require("sequelize");
const { sequelize } = require('../config/mysql'); 

const { matchedData } = require("express-validator");
const { pacienteModel, rolModel, sedeModel, personaModel, geriatricoModel, pacienteAcudienteModel, geriatricoPersonaModel, sedePersonaRolModel,
} = require("../models");



// registrar paciente en base de datos

/* const registrarPaciente = async (req, res) => {
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
}; */


const registrarPaciente = async (req, res) => {
  let t;
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
      rol_id,
      sp_fecha_inicio,
      sp_fecha_fin,
    } = data;
    
    if (rol_id !== 4) {
      return res.status(400).json({ message: "El rol asignado no es válido para un paciente." });
    }
    
    const se_id = req.session.se_id;
    const ge_id_sesion = req.session.ge_id;

    


    if (!se_id) {
      return res.status(403).json({ message: "No se ha seleccionado una sede." });
    }

    if (!ge_id_sesion) {
      return res.status(403).json({ message: "No tienes un geriátrico asignado en la sesión." });
    }

    const sede = await sedeModel.findOne({
      where: { se_id, ge_id: ge_id_sesion },
      attributes: ["se_id", "se_activo", "se_nombre", "cupos_totales", "cupos_ocupados"],
    });

    if (!sede) {
      return res.status(403).json({ message: "No tienes permiso para asignar roles en esta sede." });
    }

    if (!sede.se_activo) {
      return res.status(400).json({ message: "No se pueden asignar roles en una sede inactiva." });
    }

    const rolExistenteSede = await sedePersonaRolModel.findOne({
      where: { per_id, se_id, rol_id:4, sp_activo: true },
    });

    if (rolExistenteSede) {
      return res.status(400).json({ message: "El usuario ya tiene un registro como paciente activo en esta sede." });
    }

    t = await sequelize.transaction();

    let datosPaciente = await pacienteModel.findOne({ where: { per_id } });

    if (rol_id === 4) {
      const pacienteEnOtraSede = await sedePersonaRolModel.findOne({
        where: {
          per_id,
          rol_id: 4,  // Paciente
          sp_activo: true,
          se_id: { [Op.ne]: se_id } // Asegura que la sede es diferente a la actual
        },
        include: {
          model: sedeModel,
          as: "sede",
          attributes: ["se_id", "se_nombre", "ge_id"], // Agregar ge_id para saber en qué geriátrico está
          include: {
            model: geriatricoModel, 
            as: "geriatrico",
            attributes: ["ge_id", "ge_nombre"]
          }
        }
      }); 
      
      if (pacienteEnOtraSede) {
        return res.status(400).json({
          message:
            "El paciente ya está registrado en otra sede de otro geriátrico. Debe ser retirado de su sede actual antes de registrarlo en una nueva sede.",
          sedeActual: {
            se_id: pacienteEnOtraSede.sede.se_id,
            se_nombre: pacienteEnOtraSede.sede.se_nombre,
          },
          geriatricoActual: {
            ge_id: pacienteEnOtraSede.sede.geriatrico.ge_id,
            ge_nombre: pacienteEnOtraSede.sede.geriatrico.ge_nombre,
          }
        });
      }
      
/*       const pacienteEnOtraSede = await sedePersonaRolModel.findOne({
        where: {
          per_id,
          rol_id: 4,  // Paciente
          sp_activo: true,
          se_id: { [Op.ne]: se_id } // Asegura que la sede es diferente a la actual
        },
          include: {
          model: sedeModel,
          as: "sede",
          attributes: ["se_id", "se_nombre"],
          where: { ge_id: ge_id_sesion },
        },
      });
      

      if (pacienteEnOtraSede) {
        return res.status(400).json({
          message:
            "El paciente ya está registrado en otra sede de este geriátrico. Debe ser retirado de su sede actual y posteriormente ser registrado en una nueva sede",
          sedeActual: {
            se_id: pacienteEnOtraSede.sede.se_id,
            se_nombre: pacienteEnOtraSede.sede.se_nombre,
          },
        });
      } */
 
      if (sede.cupos_ocupados >= sede.cupos_totales) {
        return res.status(400).json({ message: "No hay cupos disponibles en esta sede." });
      }

 if (!datosPaciente) {
    datosPaciente = await pacienteModel.create(
      {
        per_id,
        pac_edad,
        pac_peso,
        pac_talla,
        pac_regimen_eps,
        pac_nombre_eps,
        pac_rh_grupo_sanguineo,
        pac_talla_camisa,
        pac_talla_pantalon,
      },
      { transaction: t }
    );
  } else {
    // Aquí actualizamos los datos del paciente si ya existe
    await datosPaciente.update(
      {
        pac_edad,
        pac_peso,
        pac_talla,
        pac_regimen_eps,
        pac_nombre_eps,
        pac_rh_grupo_sanguineo,
        pac_talla_camisa,
        pac_talla_pantalon,
      },
      { transaction: t }
    );
  }
}
    let vinculoGeriatrico = await geriatricoPersonaModel.findOne({
      where: { per_id, ge_id: ge_id_sesion },
    });

    if (vinculoGeriatrico) {
      if (!vinculoGeriatrico.gp_activo) {
        await vinculoGeriatrico.update({ gp_activo: true }, { transaction: t });
      }
    } else {
      vinculoGeriatrico = await geriatricoPersonaModel.create(
        { ge_id: ge_id_sesion, per_id, gp_activo: true },
        { transaction: t }
      );
    }

    await sedeModel.update(
      { cupos_ocupados: sede.cupos_ocupados + 1 },
      { where: { se_id }, transaction: t }
    );

    const nuevaVinculacion = await sedePersonaRolModel.create(
      {
        per_id,
        se_id,
        rol_id,
        sp_fecha_inicio,
        sp_fecha_fin: sp_fecha_fin || null,
        sp_activo:true,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      message: "Paciente registrado con éxito.",
      nuevaVinculacion,
      datosPaciente,
    });
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error("Error al registrar paciente:", error);
    return res.status(500).json({
      message: "Error al registrar paciente.",
      error: error.message,
    });
  }
};



// ver TODOS los pacientes de mi sede lista segmentada (admin sede, enfermeros)
const obtenerPacientesSede = async (req, res) => {
  try {
    const se_id = req.session.se_id;

    if (!se_id) {
      return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
    }

    // Obtener el geriátrico dueño de la sede en sesión
    const sede = await sedeModel.findOne({
      where: { se_id },
      attributes: ["ge_id"],
    });

    if (!sede) {
      return res.status(404).json({ message: "La sede no existe." });
    }

    const ge_id = sede.ge_id;

    const vinculaciones = await sedePersonaRolModel.findAll({
      where: { se_id, rol_id: 4 }, // Solo pacientes de la sede
      attributes: ["sp_activo", "per_id"], // Incluir per_id para agrupar
      include: [
        {
          model: personaModel,
          as: "persona",
          attributes: ["per_id", "per_nombre_completo", "per_documento"],
          include: [
            {
              model: pacienteModel,
              as: "paciente",
              attributes: ["pac_id"],
            },
            {
              model: geriatricoPersonaModel,
              as: "vinculosGeriatricos",
              where: { ge_id },
              attributes: ["gp_activo"],
            },
          ],
        },
      ],
    });

    if (vinculaciones.length === 0) {
      return res.status(404).json({ message: "No hay pacientes vinculados a esta sede." });
    }

    // Mapa para agrupar pacientes y evitar duplicados
    const pacientesAgrupados = new Map();

    for (const vinculo of vinculaciones) {
      const per_id = vinculo.persona.per_id;

      // Obtener TODOS los roles paciente de la persona en la sede
      const rolesPaciente = await sedePersonaRolModel.findAll({
        where: { se_id, per_id, rol_id: 4 },
        attributes: ["sp_activo"],
      });

      // Verificar si hay al menos un `sp_activo === true`
      const tieneAlMenosUnRolActivo = rolesPaciente.some((rol) => rol.sp_activo === true);

      if (!pacientesAgrupados.has(per_id)) {
        pacientesAgrupados.set(per_id, {
          per_id,
          pac_id: vinculo.persona.paciente?.pac_id || null,
          per_nombre: vinculo.persona.per_nombre_completo,
          per_documento: vinculo.persona.per_documento,
          activoSede: tieneAlMenosUnRolActivo, // True si al menos un rol está activo, false si todos están inactivos
          activoGeriatrico: vinculo.persona.vinculosGeriatricos[0]?.gp_activo || false, // Manejo seguro de array vacío
        });
      }
    }

    return res.status(200).json({
      message: "Pacientes vinculados encontrados",
      data: Array.from(pacientesAgrupados.values()).sort(
        (a, b) => Number(b.activoSede) - Number(a.activoSede) // Primero los activos en sede
      ),
    });

  } catch (error) {
    console.error("Error al obtener pacientes vinculados:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};



const obtenerRolesPacientesSede = async (req, res) => {
  try {
    const { per_id } = req.params;
    const se_id = req.session.se_id;

    if (!se_id) {
      return res
        .status(403)
        .json({ message: "No tienes una sede asignada en la sesión." });
    }

    // Obtener los roles de paciente en la sede, ordenados por activo primero
    const rolesPaciente = await sedePersonaRolModel.findAll({
      where: { per_id, se_id, rol_id: 4 }, // Solo roles de paciente
      include: [
        {
          model: rolModel,
          as: "rol",
          attributes: ["rol_id", "rol_nombre"],
        },
      ],
      attributes: ["sp_activo", "sp_fecha_inicio", "sp_fecha_fin"],
      order: [["sp_activo", "DESC"]], // Activos primero
    });

    if (rolesPaciente.length === 0) {
      return res
        .status(404)
        .json({ message: "El paciente no tiene roles en esta sede." });
    }

    return res.status(200).json({
      message: "Roles del paciente obtenidos exitosamente",
      roles: rolesPaciente.map((rol) => ({
        rol_id: rol.rol.rol_id,
        rol_nombre: rol.rol.rol_nombre,
        fechaInicio: rol.sp_fecha_inicio,
        fechaFin: rol.sp_fecha_fin,
        activo: rol.sp_activo,
      })),
    });
  } catch (error) {
    console.error("Error al obtener roles del paciente:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};



// obtener detalle de un paciente
const obtenerDetallePaciente = async (req, res) => {
  try {
    const { per_id } = req.params;
    const ge_id = req.session.ge_id; // Obtener el geriátrico desde la sesión

    if (!ge_id) {
      return res.status(403).json({ message: "No tienes un geriátrico asignado en la sesión." });
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

    const acudientes = await pacienteAcudienteModel.findAll({
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
  obtenerPacientesSede,
  obtenerRolesPacientesSede,
  obtenerDetallePaciente,
  obtenerAcudientesDePaciente,
  actualizarDetallePaciente,
};
