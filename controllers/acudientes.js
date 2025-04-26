const { Op } = require("sequelize");
const { sequelize } = require("../config/mysql");
const { io } = require('../utils/handleSocket'); 
const { matchedData } = require("express-validator");
const {
  pacienteAcudienteModel,
  personaModel,
  sedeModel,
  pacienteModel,
  geriatricoPersonaModel,
  sedePersonaRolModel,
} = require("../models");
const { subirImagenACloudinary } = require("../utils/handleCloudinary");



const registrarAcudiente = async (req, res) => {
  try {
    const data = matchedData(req);
    const { pac_id, per_id, pa_parentesco } = data;
    const se_id = req.session.se_id;
    const ge_id_sesion = req.session.ge_id;

    if (!se_id) {
      return res
        .status(403)
        .json({ message: "No se ha seleccionado una sede." });
    }

    if (!ge_id_sesion) {
      return res
        .status(403)
        .json({ message: "No tienes un geriátrico asignado en la sesión." });
    }

    // Verificar si el paciente existe y pertenece a la sede
    const paciente = await pacienteModel.findOne({
      where: { pac_id },
      attributes: ["per_id"],
    });
    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado." });
    }

    const pacientePerId = paciente.per_id;

    const pacienteEnOtraSede = await sedePersonaRolModel.findOne({
      where: {
        per_id: pacientePerId,
        rol_id: 4, // Paciente
        sp_activo: true,
        se_id: { [Op.ne]: se_id }, // Asegura que la sede es diferente a la actual
      },
    });

    if (pacienteEnOtraSede) {
      return res
        .status(403)
        .json({ message: "El paciente no pertenece a esta sede" });
    }

    const pacienteRoles = await sedePersonaRolModel.findAll({
      where: { per_id: pacientePerId, rol_id: 4, se_id },
    });

    const tieneRolActivo = pacienteRoles.some((rol) => rol.sp_activo);

    if (!pacienteRoles.length) {
      return res.status(403).json({
        message:
          "El usuario no tiene asignado el rol de paciente en esta sede.",
      });
    }

    if (!tieneRolActivo) {
      return res.status(403).json({
        message:
          "El usuario tiene el rol de paciente en esta sede, pero está inactivo.",
      });
    }

    // 🔍 Validar si la persona pertenece a la sede y tiene el rol activo ID 6 ACUDIENTE
    const tieneRolAcudiente = await sedePersonaRolModel.findOne({
      where: { per_id, se_id, rol_id: 6, sp_activo: true },
    });

    if (!tieneRolAcudiente) {
      return res.status(403).json({
        message: "La persona no tiene el rol de acudiente activo en esta sede.",
      });
    }

    await sequelize.transaction(async (t) => {
      // Verificar si ya existe la relación en `paciente_acudiente y permite actualizar datos del parentesco si ya existe`
      let acudienteExistente = await pacienteAcudienteModel.findOne({
        where: { per_id, pac_id },
        attributes: ["pa_id", "pa_activo", "pa_parentesco"],
        transaction: t,
      });

      if (acudienteExistente) {
        if (acudienteExistente.pa_activo) {
          return res.status(200).json({
            message:
              "La persona ya está registrada como acudiente para este paciente.",
            existe: true,
            acudiente: acudienteExistente,
          });
        } else {
          // Estaba inactivo: se reactiva,
          await acudienteExistente.update(
            { pa_activo: true, pa_parentesco },
            { transaction: t }
          );
          return res.status(200).json({
            message: "El acudiente estaba inactivo y ha sido reactivado.",
            reactivado: true,
            acudiente: acudienteExistente,
          });
        }
      }

      // Si no existe, lo registramos y SE EMITE socket
      const acudienteRegistrado = await pacienteAcudienteModel.create(
        {
          per_id,
          pac_id,
          pa_parentesco,
        },
        { transaction: t }
      );

      
      const persona = await pacienteAcudienteModel.findOne({
        where: { pa_id: acudienteRegistrado.pa_id },
        attributes: ["pa_id", "pa_parentesco", "pa_activo"],
        include: [{
          model: personaModel,
          as: "persona",
          attributes: ["per_id", "per_nombre_completo", "per_documento", "per_telefono", "per_correo"],
        }],
        transaction: t,
      });

      if (!persona) {
        throw new Error("No se pudo obtener la información del nuevo acudiente.");
      }
  
      const payload = persona.toJSON(); 

      // Emitir evento a través de WebSocket 
      io.to(`sede-${se_id}`).emit("acudienteRegistrado", {
        message: "Nuevo acudiente registrado",
        acudiente: {
          pa_id: payload.pa_id,
          per_id: payload.per_id,
          pa_activo: payload.pa_activo,
          nombre:  payload.persona.per_nombre_completo,
          documento: payload.persona.per_documento,
          pa_parentesco: payload.pa_parentesco,
          per_telefono: payload.per_telefono,
          per_correo: payload.per_correo,
        }
      });
  




      return res.status(201).json({
        message: "Acudiente registrado correctamente.",
        acudiente: acudienteRegistrado,
      });
    });
  } catch (error) {
    console.error("Error al registrar acudiente:", error);
    return res.status(500).json({
      message: "Error al registrar acudiente.",
      error: error.message,
    });
  }
};



// Obtener Acudiente(s) de un Paciente
const obtenerAcudientesDePaciente = async (req, res) => {
  try {
    const { pac_id } = req.params;

    const acudientes = await pacienteAcudienteModel.findAll({
      where: { pac_id },
      attributes: ["pa_id", "pac_id", "per_id", "pa_parentesco", "pa_activo"],
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
      pa_id: acudiente.pa_id,
      nombre_completo: acudiente.persona.per_nombre_completo,
      documento: acudiente.persona.per_documento,
      telefono: acudiente.persona.per_telefono,
      correo: acudiente.persona.per_correo,
      parentesco: acudiente.pa_parentesco,
      acudienteActivo: acudiente.pa_activo,
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



// inactivar relacion acudiente con paciente en particular
const inactivarRelacionAcudiente = async (req, res) => {
  try {
    const { pa_id } = req.params; // Recibir el ID único de la relación
    const se_id = req.session.se_id;

    if (!se_id) {
      return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
    }

    // Buscar la relación paciente-acudiente activa por `pa_id`
    const acudiente = await pacienteAcudienteModel.findOne({
      where: { pa_id },
    });

    if (!acudiente) {
      return res.status(404).json({
        message: "Relación paciente-acudiente no encontrada",
      });
    }

    const acudienteInactivo = await pacienteAcudienteModel.findOne({
      where: { pa_id, pa_activo: false },
    });

    if (acudienteInactivo) {
      return res.status(404).json({
        message: "Relación paciente-acudiente ya se encuentra inactiva.",
      });
    }

    const per_id_acudiente = acudiente.per_id;

  
    const t = await sequelize.transaction();

    try {
      // Inactivar la relación paciente-acudiente
      await pacienteAcudienteModel.update(
        { pa_activo: false },
        { where: { pa_id }, transaction: t }
      );

      // 🔹 2️⃣ OBTENER PACIENTES ACTIVOS EN LA SEDE
      const pacientesActivosEnSede = await sedePersonaRolModel.findAll({
        where: { se_id, rol_id: 4, sp_activo: true },
        include: [
          {
            model: personaModel,
            as: "persona",
            attributes: ["per_id"],
            include: [
              {
                model: pacienteModel,
                as: "paciente",
                attributes: ["pac_id"],
              },
            ],
          },
        ],
        transaction: t,
      });

      const pacIdsActivos = pacientesActivosEnSede
        .map((p) => p.persona?.paciente?.pac_id)
        .filter((id) => id !== undefined);

      const relacionesActivas = await pacienteAcudienteModel.findAll({
        where: {
          per_id: per_id_acudiente,
          pa_activo: true,
          pac_id: pacIdsActivos,
        },
        transaction: t,
      });

      console.log(
        `🔸 Acudiente ID: ${per_id_acudiente} tiene ${relacionesActivas.length} relaciones activas`
      );


      if (relacionesActivas.length === 0) {
        const resultado = await sedePersonaRolModel.update(
          { sp_activo: false, sp_fecha_fin: new Date() },
          {
            where: { se_id, per_id: per_id_acudiente, rol_id: 6 },
            transaction: t,
          }
        );
        console.log(
          `🚨 Inactivando rol de acudiente para ID: ${per_id_acudiente}. Resultado:`,
          resultado
        );
      } else {
        console.log(
          `✅ Acudiente ID: ${per_id_acudiente} mantiene su rol activo.`
        );
      }
      await t.commit();

      return res.status(200).json({
        message: "Acudiente inactivado correctamente.",
        acudienteInactivado: true,
        rolInactivado: relacionesActivas.length === 0,
      });
    } catch (error) {
      await t.rollback();
      console.error("Error en la transacción:", error);
      return res
        .status(500)
        .json({ message: "Error interno del servidor.", error: error.message });
    }
  } catch (error) {
    console.error("Error en la petición:", error);
    return res
      .status(500)
      .json({ message: "Error en el servidor.", error: error.message });
  }
};



// Reactivar una relación acudiente con paciente
const reactivarRelacionAcudiente = async (req, res) => {
  try {
    const { pa_id } = req.params; // ID de la relación paciente-acudiente
    const se_id = req.session.se_id;

    if (!se_id) {
      return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
    }

    // Buscar la relación paciente-acudiente inactiva
    const acudiente = await pacienteAcudienteModel.findOne({
      where: { pa_id },
    });

    if (!acudiente) {
      return res.status(404).json({
        message: "Relación paciente-acudiente no encontrada.",
      });
    }

    const acudienteActivo = await pacienteAcudienteModel.findOne({
      where: { pa_id, pa_activo: true },
    });

    if (acudienteActivo) {
      return res.status(400).json({
        message: "La relación paciente-acudiente ya está activa.",
      });
    }

    const per_id_acudiente = acudiente.per_id;
    const pac_id = acudiente.pac_id;

    const paciente = await pacienteModel.findOne({
      where: { pac_id },
    })

    const per_id_paciente = paciente.per_id

    const pacienteActivo = await sedePersonaRolModel.findOne({
      where: { se_id, rol_id: 4, sp_activo: true, per_id:per_id_paciente },
    })

    if(!pacienteActivo){
      return res.status(400).json({
        message: "El paciente está inactivo en la sede, no se puede reactivar la relación.",
      });

    }



    // Iniciar transacción
    const t = await sequelize.transaction();
    let rolReactivado = false;

    try {
      // Reactivar la relación paciente-acudiente
      await pacienteAcudienteModel.update(
        { pa_activo: true },
        { where: { pa_id }, transaction: t }
      );

      // Buscar si el acudiente ya tiene rol en la sede
      let rolAcudiente = await sedePersonaRolModel.findOne({
        where: { per_id: per_id_acudiente, se_id, rol_id: 6 },
        transaction: t,
      });

      if (rolAcudiente && !rolAcudiente.sp_activo) {
        await rolAcudiente.update(
          { sp_activo: true, sp_fecha_fin: null },
          { transaction: t }
        );
        rolReactivado = true;
      }

      // Confirmar transacción
      await t.commit();

      return res.status(200).json({
        message: "Acudiente reactivado correctamente.",
        acudienteReactivado: true,
        rolReactivado,
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error al reactivar acudiente:", error);
    return res.status(500).json({
      message: "Error interno del servidor.",
      error: error.message,
    });
  }
};



// pacientes a cargo del acudiente en una sede en particular (acudiente)
const pacientesAcudienteActivos = async (req, res) => {
  try {
    console.log("Sesión en el request:", req.session);

    const se_id = req.session.se_id;
    const per_id_sesion = req.session.per_id;

    if (!se_id || !per_id_sesion) {
      return res.status(403).json({
        message:
          "No tienes una sede asignada en la sesión o no estás autenticado.",
      });
    }

    // 1️⃣ Obtener los pac_id de los pacientes activos en la sede actual
    const pacientesEnSede = await sedePersonaRolModel.findAll({
      where: { se_id, rol_id: 4, sp_activo: true },
      include: [
        {
          model: personaModel,
          as: "persona",
          attributes: ["per_id"],
          include: [
            {
              model: pacienteModel,
              as: "paciente",
              attributes: ["pac_id"],
            },
          ],
        },
      ],
    });

    // 🔹 Extraer los pac_id de los pacientes activos
    const pacIds = pacientesEnSede
      .map((p) => p.persona?.paciente?.pac_id) // Acceder a pac_id
      .filter((id) => id !== undefined); // Filtramos valores nulos o indefinidos

    if (pacIds.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay pacientes activos en esta sede." });
    }

    // 2️⃣ Filtrar solo los pacientes que están a cargo del acudiente autenticado
    const relaciones = await pacienteAcudienteModel.findAll({
      where: { per_id: per_id_sesion, pa_activo: true, pac_id: pacIds }, // pac_id obtenidos
      include: [
        {
          model: pacienteModel,
          as: "paciente",
          include: [
            {
              model: personaModel,
              as: "persona",
              attributes: ["per_id", "per_nombre_completo", "per_documento"],
            },
          ],
          attributes: ["pac_id"],
        },
      ],
    });

    if (relaciones.length === 0) {
      return res
        .status(404)
        .json({ message: "No tienes pacientes asignados en esta sede." });
    }

    // 3️⃣ Formatear respuesta correctamente
    const pacientes = relaciones.map((rel) => ({
      pac_id: rel.paciente.pac_id,
      per_id_paciente: rel.paciente.persona.per_id,
      per_id_acudiente: rel.per_id,
      nombre: rel.paciente.persona.per_nombre_completo,
      documento: rel.paciente.persona.per_documento,
    }));

    return res.status(200).json({
      message: "Pacientes obtenidos exitosamente",
      pacientes,
    });
  } catch (error) {
    console.error("Error al obtener pacientes del acudiente:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};



module.exports = {
  registrarAcudiente,
  obtenerAcudientesDePaciente,
  inactivarRelacionAcudiente,
  reactivarRelacionAcudiente,
  pacientesAcudienteActivos,
};
