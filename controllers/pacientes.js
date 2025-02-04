const { matchedData } = require('express-validator');
const { pacienteModel, personaModel } = require('../models');



const registrarPaciente = async (req, res) => {
    try {
        const data = matchedData(req);
        const { per_id, pac_edad, pac_peso, pac_talla, pac_regimen_eps, pac_nombre_eps, pac_rh_grupo_sanguineo, pac_talla_camisa, pac_talla_pantalon } = data;

        // Verificar si la persona ya está registrada como paciente
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

module.exports = { registrarPaciente };
