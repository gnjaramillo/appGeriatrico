const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 

const { matchedData } = require('express-validator');
const { pacienteAcudienteModel, personaModel, sedeModel, pacienteModel,geriatricoPersonaModel, sedePersonaRolModel } = require('../models');
const { subirImagenACloudinary } = require('../utils/handleCloudinary');



/* 
const registrarAcudiente = async (req, res) => {
  try {
    const data = matchedData(req);
    const { pac_id, per_id, pa_parentesco, rol_id, sp_fecha_inicio, sp_fecha_fin } = data;

    if (rol_id !== 6) {
      return res.status(400).json({ message: "El rol asignado no es válido para un acudiente." });
    }

    const se_id = req.session.se_id;
    const ge_id_sesion = req.session.ge_id;

    if (!se_id) {
      return res.status(403).json({ message: "No se ha seleccionado una sede." });
    }

    if (!ge_id_sesion) {
      return res.status(403).json({ message: "No tienes un geriátrico asignado en la sesión." });
    }

    // Verificar si la persona existe
    const personaExistente = await personaModel.findOne({ where: { per_id } });
    if (!personaExistente) {
      return res.status(400).json({ message: "La persona seleccionada no existe en la base de datos." });
    }

    // Verificar si la sede pertenece al geriátrico
    const sede = await sedeModel.findOne({
      where: { se_id, ge_id: ge_id_sesion },
      attributes: ["se_id", "se_activo", "se_nombre"]
    });

    if (!sede) {
      return res.status(403).json({ message: "No tienes permiso para asignar roles en esta sede." });
    }

    if (!sede.se_activo) {
      return res.status(400).json({ message: "No se pueden asignar roles en una sede inactiva." });
    }

    // Verificar si el paciente existe y pertenece a la sede
    const paciente = await pacienteModel.findOne({ where: { pac_id }, attributes: ["per_id"] });
    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado." });
    }

    const pacientePerId = paciente.per_id;
    
    const pacienteEnOtraSede = await sedePersonaRolModel.findOne({
      where: {
        per_id: pacientePerId,
        rol_id: 4,  // Paciente
        sp_activo: true,
        se_id: { [Op.ne]: se_id } // Asegura que la sede es diferente a la actual
      }
    });    


    if (pacienteEnOtraSede) {
      return res.status(403).json({ message: "El paciente no pertenece a esta sede" });
    }

    const pacienteActivoSede = await sedePersonaRolModel.findOne({
      where: { per_id: pacientePerId, rol_id: 4, se_id, sp_activo: true },
    });
    

    if (!pacienteActivoSede) {
      return res.status(403).json({ message: "El paciente está inactivo actualmente." });
    }



    await sequelize.transaction(async (t) => {

      let acudienteRegistrado = null; 

      // Verificar si ya existe la relación en `acudientes`
      let acudienteExistente = await pacienteAcudienteModel.findOne({
        where: { per_id, pac_id, pa_activo: true },
        attributes: ["pa_id", "pa_activo", "pa_parentesco"],
        transaction: t
      });

      if (acudienteExistente) {
        if (acudienteExistente.pa_activo) {
          return res.status(200).json({
            message: "La persona ya está registrada como acudiente para este paciente.",
            existe: true,
            acudiente: acudienteExistente,
          });
        } 
      } else {
        // Crear un nuevo acudiente si no existía antes
        acudienteRegistrado = await pacienteAcudienteModel.create({
          per_id,
          pac_id,
          pa_parentesco,
          
        }, { transaction: t });
      }

      // Verificar si tiene vínculo con el geriátrico
      let vinculoGeriatrico = await geriatricoPersonaModel.findOne({
        where: { per_id, ge_id: ge_id_sesion },
        transaction: t
      });

      if (vinculoGeriatrico) {
        if (!vinculoGeriatrico.gp_activo) {
          await vinculoGeriatrico.update({ gp_activo: true }, { transaction: t });
        }
      } else {
        await geriatricoPersonaModel.create({
          ge_id: ge_id_sesion,
          per_id,
          gp_activo: true
        }, { transaction: t });
      }

      // Verificar si el acudiente ya tiene el rol de acudiente (rol_id 6) en la sede
      let rolExistente = await sedePersonaRolModel.findOne({
        where: { per_id, se_id, rol_id: 6 }, // 🔹 Filtramos por rol_id 6 (Acudiente)
        transaction: t
      });

      if (rolExistente) {
        // Si existe, actualizamos a activo y quitamos la fecha de finalización
        await rolExistente.update(
          { sp_activo: true, sp_fecha_fin: null },
          { transaction: t }
        );
      } else {
        // Si no existe, creamos un nuevo registro
        await sedePersonaRolModel.create({
          per_id,
          se_id,
          rol_id: 6, // 🔹 Aseguramos que el rol sea Acudiente
          sp_fecha_inicio,
          sp_fecha_fin: sp_fecha_fin || null,
          sp_activo: true
        }, { transaction: t });
      }



      return res.status(201).json({
        message: "Acudiente registrado correctamente.",
        acudiente: acudienteRegistrado // o el nombre que hayas usado
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
 */


const registrarAcudiente = async (req, res) => {
  try {
    const data = matchedData(req);
    const { pac_id, per_id, pa_parentesco } = data; 
    const se_id = req.session.se_id;
    const ge_id_sesion = req.session.ge_id;

    if (!se_id) {
        return res.status(403).json({ message: "No se ha seleccionado una sede." });
    }

    if (!ge_id_sesion) {
        return res.status(403).json({ message: "No tienes un geriátrico asignado en la sesión." });
    }
   

    // Verificar si el paciente existe y pertenece a la sede
    const paciente = await pacienteModel.findOne({ where: { pac_id }, attributes: ["per_id"] });
    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado." });
    }

    const pacientePerId = paciente.per_id;    
    
    
    const pacienteEnOtraSede = await sedePersonaRolModel.findOne({
      where: {
        per_id: pacientePerId,
        rol_id: 4,  // Paciente
        sp_activo: true,
        se_id: { [Op.ne]: se_id } // Asegura que la sede es diferente a la actual
      }
    });    


    if (pacienteEnOtraSede) {
      return res.status(403).json({ message: "El paciente no pertenece a esta sede" });
    }


    const pacienteRoles = await sedePersonaRolModel.findAll({
      where: { per_id: pacientePerId, rol_id: 4, se_id },
    });
    
    const tieneRolActivo = pacienteRoles.some(rol => rol.sp_activo);
    

    if (!pacienteRoles.length) {
      return res.status(403).json({ message: "El usuario no tiene asignado el rol de paciente en esta sede." });
    }
    
    if (!tieneRolActivo) {
      return res.status(403).json({ message: "El usuario tiene el rol de paciente en esta sede, pero está inactivo." });
    }
    
    

    // 🔍 Validar si la persona pertenece a la sede y tiene el rol activo ID 6 ACUDIENTE
    const tieneRolAcudiente = await sedePersonaRolModel.findOne({
      where: { per_id, se_id, rol_id: 6, sp_activo: true },
    });

    if (!tieneRolAcudiente) {
      return res.status(403).json({ 
        message: "La persona no tiene el rol de acudiente activo en esta sede." 
      });
    }



    await sequelize.transaction(async (t) => {
      // Verificar si ya existe la relación en `paciente_acudiente`
      let acudienteExistente = await pacienteAcudienteModel.findOne({
        where: { per_id, pac_id },
        attributes: ["pa_id", "pa_activo", "pa_parentesco"],
        transaction: t
      });

      if (acudienteExistente) {
        if (acudienteExistente.pa_activo) {
          return res.status(200).json({
            message: "La persona ya está registrada como acudiente para este paciente.",
            existe: true,
            acudiente: acudienteExistente,
          });
        } else {
          await acudienteExistente.update({ pa_activo: true, pa_parentesco }, { transaction: t });
          return res.status(200).json({
            message: "El acudiente estaba inactivo y ha sido reactivado.",
            reactivado: true,
            acudiente: acudienteExistente,
          });
        }
      }

      // Si no existe, lo registramos
      const acudienteRegistrado = await pacienteAcudienteModel.create({
        per_id,
        pac_id,
        pa_parentesco,
      }, { transaction: t });

      return res.status(201).json({
        message: "Acudiente registrado correctamente.",
        acudiente: acudienteRegistrado
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


module.exports = { registrarAcudiente };
