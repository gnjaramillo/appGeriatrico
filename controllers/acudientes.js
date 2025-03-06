const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 

const { matchedData } = require('express-validator');
const { acudienteModel, personaModel, sedeModel, pacienteModel,geriatricoPersonaModel, sedePersonaRolModel } = require('../models');
const { subirImagenACloudinary } = require('../utils/handleCloudinary');



/* const registrarAcudiente = async (req, res) => {
  try {
    const data = matchedData(req);
    const { per_id, pac_id, acu_parentesco, rol_id, sp_fecha_inicio, sp_fecha_fin } = data;

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
    
            // Verificar si la persona existe en la base de datos antes de continuar
    const personaExistente = await personaModel.findOne({
      where: { per_id }
    });
    
    if (!personaExistente) {
      return res.status(400).json({ message: "La persona seleccionada no existe en la base de datos." });
    }
    

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

    const paciente = await pacienteModel.findOne({
      where: { pac_id },
      attributes: ["per_id"],
    });

    if (!paciente) {
      return res.status(404).json({ message: "Paciente no encontrado." });
    }

    const pacientePerId = paciente.per_id;

  

// Verificar si el paciente pertenece a la sede
const pacienteEnSede = await sedePersonaRolModel.findOne({
  where: { per_id: pacientePerId, rol_id: 4, se_id },
});

if (!pacienteEnSede) {
  return res.status(403).json({ message: "El paciente no pertenece a esta sede." });
}

// Verificar si tiene al menos un rol activo en la sede
const pacienteTieneRolActivo = await sedePersonaRolModel.findOne({
  where: { per_id: pacientePerId, rol_id: 4, se_id, sp_activo: true },
});

if (!pacienteTieneRolActivo) {
  return res.status(403).json({ message: "El paciente tiene el rol inactivo y no puede vincularse a un acudiente." });
}


    




    await sequelize.transaction(async (t) => {









      let vinculoGeriatrico = await geriatricoPersonaModel.findOne({
        where: { per_id, ge_id: ge_id_sesion }
      });

      if (vinculoGeriatrico) {
        if (!vinculoGeriatrico.gp_activo) {
          await vinculoGeriatrico.update({ gp_activo: true }, { transaction: t });
        }
      } else {
        vinculoGeriatrico = await geriatricoPersonaModel.create({
          ge_id: ge_id_sesion,
          per_id,
          gp_activo: true
        }, { transaction: t });
      }



      const rolAcudiente = await sedePersonaRolModel.findOne({
        where: { se_id, per_id, rol_id },
      });
      
      if (rolAcudiente) {
        // Si ya existe el rol, verificamos si está inactivo
        if (!rolAcudiente.sp_activo) {
          await rolAcudiente.update(
            { 
              sp_fecha_inicio, 
              sp_fecha_fin: null, 
              sp_activo: true 
            }, 
            { transaction: t }
          );
        }
      } else {
        // Si no existe, lo creamos
        await sedePersonaRolModel.create({
          per_id,
          se_id,
          rol_id,
          sp_fecha_inicio,
          sp_fecha_fin: null
        }, { transaction: t });
      }
      
      const nuevoAcudiente = await acudienteModel.create({
        per_id,
        pac_id,
        acu_parentesco
      }, { transaction: t });

      return nuevoAcudiente;
    });

    return res.status(201).json({
      message: "Acudiente registrado correctamente.",
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
    const { per_id, pac_id, acu_parentesco, rol_id, sp_fecha_inicio, sp_fecha_fin } = data;

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

    const pacienteEnSede = await sedePersonaRolModel.findOne({
      where: { per_id: pacientePerId, rol_id: 4, se_id, sp_activo: true },
    });

    if (!pacienteEnSede) {
      return res.status(403).json({ message: "El paciente no pertenece a esta sede o su rol está inactivo." });
    }

    await sequelize.transaction(async (t) => {

      let acudienteRegistrado = null; 

      // Verificar si ya existe la relación en `acudientes`
      let acudienteExistente = await acudienteModel.findOne({
        where: { per_id, pac_id },
        attributes: ["acu_id", "acu_activo", "acu_parentesco"],
        transaction: t
      });

      if (acudienteExistente) {
        if (acudienteExistente.acu_activo) {
          return res.status(200).json({
            message: "La persona ya está registrada como acudiente para este paciente.",
            existe: true,
            acudiente: acudienteExistente,
          });
        } else {
          // Reactivar la relación si estaba inactiva
          await acudienteExistente.update({ acu_activo: true }, { transaction: t });
          acudienteRegistrado = acudienteExistente;
        }
      } else {
        // Crear un nuevo acudiente si no existía antes
        acudienteRegistrado = await acudienteModel.create({
          per_id,
          pac_id,
          acu_parentesco,
          acu_activo: true
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

      // Crear un NUEVO registro en sedePersonaRolModel
      await sedePersonaRolModel.create({
        per_id,
        se_id,
        rol_id,
        sp_fecha_inicio,
        sp_fecha_fin:  sp_fecha_fin || null,
        sp_activo: true
      }, { transaction: t });


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




/* const registrarAcudiente = async (req, res) => {
  try {
    const data = matchedData(req);
    const { per_id, pac_id, acu_parentesco } = data;
    const se_id = req.session.se_id;

    // Verificar si la persona tiene al menos un registro como acudiente activo en la sede
    const rolAcudienteActivo = await sedePersonaRolModel.findOne({
        where: { se_id, per_id, rol_id: 6, sp_activo: true }, 
      });
      
      if (!rolAcudienteActivo) {
        return res.status(403).json({
          message: "La persona no tiene el rol de acudiente activo en esta sede.",
        });
      }


    // console.log("Roles del acudiente:", rolAcudienteActivo);

    
    //  Buscar el `per_id` del paciente a partir del `pac_id`
    const paciente = await pacienteModel.findOne({
        where: { pac_id },
        attributes: ["per_id"],
      });
  
      if (!paciente) {
        return res.status(404).json({ message: "Paciente no encontrado." });
      }
  
      const pacientePerId = paciente.per_id; // Se guarda per_id del paciente
  
      //  Verificar si el paciente tiene al menos un rol activo en esta sede
      const pacienteTieneRolActivo = await sedePersonaRolModel.findOne({
        where: { per_id: pacientePerId, rol_id: 4, sp_activo: true, se_id },
      });
  
      if (!pacienteTieneRolActivo) {
        return res.status(403).json({
          message: "El paciente tiene el rol inactivo y no puede vincularse a un acudiente.",
        });
      }

    // console.log("Roles del paciente:", pacienteTieneRolActivo);

   

    // Verificar si la persona ya está registrada como acudiente para el mismo paciente
    const acudienteExistente = await acudienteModel.findOne({
      where: { per_id, pac_id },
      attributes: ["acu_parentesco","acu_foto", "per_id" ],
      include: [
        {
          model: personaModel,
          as: "persona",
          attributes: ["per_nombre_completo", "per_documento"],
        },
        {
          model: pacienteModel,
          as: "paciente",
          attributes: ["pac_id"],

          include: [
            {
              model: personaModel,
              as: "persona",
              attributes: ["per_nombre_completo", "per_documento"],
            },
          ],
        },
      ],
    });
    

// Si ya está registrado, devolver los datos
if (acudienteExistente) {
  return res.status(200).json({
    message: "La persona ya está registrada como acudiente para este paciente.",
    existe: true, //  ✅ El frontend sabe que debe cargar estos datos en lugar de registrar
    acudienteExistente: {
      per_id: acudienteExistente.per_id, // ✅ ID del acudiente
      nombre: acudienteExistente.persona.per_nombre_completo,
      documento: acudienteExistente.persona.per_documento,
      acu_parentesco: acudienteExistente.acu_parentesco, 
      acu_foto: acudienteExistente.acu_foto, 
      paciente: {
        pac_id: acudienteExistente.paciente.pac_id, // ✅ ID del paciente
        nombre: acudienteExistente.paciente.persona.per_nombre_completo,
        documento: acudienteExistente.paciente.persona.per_documento,
      },
    },
  });
}




    // Registrar nuevo acudiente
    const nuevoAcudiente = await acudienteModel.create({
      per_id,
      pac_id,
      acu_parentesco,
    });

    let acu_foto = null;
    if (req.file) {
      const resultado = await subirImagenACloudinary(req.file, "acudientes");
      acu_foto = resultado.secure_url;

      nuevoAcudiente.acu_foto = acu_foto;
      await nuevoAcudiente.save();
    }

    // Obtener los datos del nuevo acudiente con los datos del paciente
    const acudienteConPaciente = await acudienteModel.findOne({
      where: { acu_id: nuevoAcudiente.acu_id },
      include: [
        {
          model: personaModel,
          as: "persona", // Datos del acudiente
          attributes: ["per_nombre_completo", "per_documento"],
        },
        {
          model: pacienteModel,
          as: "paciente",
          include: [
            {
              model: personaModel,
              as: "persona", // Datos del paciente
              attributes: ["per_nombre_completo", "per_documento"],
            },
          ],
          attributes: ["pac_id"], // Asegura que `paciente` se incluya correctamente
        },
      ],
    });

    return res.status(201).json({
      message: "Acudiente registrado correctamente.",
      nuevoAcudiente: {
        acu_id: acudienteConPaciente.acu_id,
        acu_parentesco: acudienteConPaciente.acu_parentesco,
        acu_foto: acudienteConPaciente.acu_foto,
        acudiente: {
          per_nombre_completo: acudienteConPaciente.persona.per_nombre_completo,
          per_documento: acudienteConPaciente.persona.per_documento,
        },
        paciente: {
          per_nombre_completo:
            acudienteConPaciente.paciente.persona.per_nombre_completo,
          per_documento: acudienteConPaciente.paciente.persona.per_documento,
        },
      },
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



module.exports = { registrarAcudiente };
