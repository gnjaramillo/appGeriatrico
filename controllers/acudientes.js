const { Op } = require('sequelize');
const { matchedData } = require('express-validator');
const { acudienteModel, personaModel, pacienteModel, sedePersonaRolModel } = require('../models');
const { subirImagenACloudinary } = require('../utils/handleCloudinary');



const registrarAcudiente = async (req, res) => {
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





module.exports = { registrarAcudiente };
