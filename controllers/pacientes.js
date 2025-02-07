const { Op } = require('sequelize'); 
const { matchedData } = require('express-validator');
const { pacienteModel, personaModel, sedePersonaRolModel } = require('../models');


// registrar paciente en base de datos
const registrarPaciente = async (req, res) => {
    try {
        const data = matchedData(req);
        const { per_id, pac_edad, pac_peso, pac_talla, pac_regimen_eps, pac_nombre_eps, pac_rh_grupo_sanguineo, pac_talla_camisa, pac_talla_pantalon } = data;

        // Verificar si la persona ya tiene el rol de Paciente en cualquier sede, solo asi se permite registros en tabla pacientes
        const tieneRolPaciente = await sedePersonaRolModel.findOne({
            where: {
                per_id,
                rol_id: 4 // Paciente
            }
        });

        if (!tieneRolPaciente) {
            return res.status(400).json({
                message: 'La persona no tiene el rol de Paciente asignado en ninguna sede.',
            });
        }

        // Verificar si ya está registrado como paciente
        const pacienteExistente = await pacienteModel.findOne({
            where: { per_id },
            include: [{
                model: personaModel,
                as: 'persona',
                attributes: ['per_nombre_completo', 'per_documento']
            }]
        });

        if (pacienteExistente) {
            return res.status(400).json({
                message: 'La persona ya está registrada como paciente.',
                pacienteExistente: {
                    nombre: pacienteExistente.persona.per_nombre_completo,
                    documento: pacienteExistente.persona.per_documento
                }
            });
        }

        // Registrar nuevo paciente
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
            message: 'Paciente registrado correctamente.',
            nuevoPaciente,
        });

    } catch (error) {
        console.error('Error al registrar paciente:', error);
        return res.status(500).json({
            message: 'Error al registrar paciente.',
            error: error.message,
        });
    }
};



// ver pacientes de mi sede (admin sede)
const obtenerPacientesPorSede = async (req, res) => {
  try {
    const se_id = req.session.se_id;

    const pacientes = await sedePersonaRolModel.findAll({
      where: { se_id: se_id, rol_id: 4 }, // Solo pacientes
      include: [
        {
          model: personaModel,
          as: "persona",
          include: [
            {
              model: pacienteModel,
              as: "paciente",
              // attributes: ["pac_id", "pac_edad", "pac_peso", "pac_talla"],
            },
          ],
          attributes: ["per_id", "per_nombre_completo", "per_documento", "per_foto"],
        },
      ],
    });

    return res.json({ pacientes });
  } catch (error) {
    console.error("Error al obtener pacientes por sede:", error);
    return res.status(500).json({ message: "Error al obtener pacientes." });
  }
};


// obtener detalle de un paciente
const obtenerDetallePacienteSede = async (req, res) => {
    try {
      const { per_id } = req.params; // ID del paciente recibido por parámetro
      const se_id = req.session.se_id; // ID de la sede desde la sesión
  
      // Buscar el paciente en la sede
      const paciente = await sedePersonaRolModel.findOne({
        where: { se_id, rol_id: 4, per_id }, // Solo pacientes de la sede
        include: [
          {
            model: personaModel,
            as: "persona",
            include: [
              {
                model: pacienteModel,
                as: "paciente",
                // attributes: ["pac_id", "pac_edad", "pac_peso", "pac_talla"],
              },
            ],
            attributes: ["per_id", "per_nombre_completo", "per_documento", "per_foto"],
          },
        ],
      });
  
      if (!paciente) {
        return res.status(404).json({ message: "Paciente no encontrado en esta sede." });
      }
  
      return res.json({ paciente });
    } catch (error) {
      console.error("Error al obtener el paciente por ID:", error);
      return res.status(500).json({ message: "Error al obtener los datos del paciente." });
    }
  };




module.exports = { registrarPaciente, obtenerPacientesPorSede, obtenerDetallePacienteSede };

