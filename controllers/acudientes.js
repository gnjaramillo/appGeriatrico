const { Op } = require('sequelize');
const { matchedData } = require('express-validator');
const { acudienteModel, personaModel, pacienteModel, sedePersonaRolModel } = require('../models');
const { subirImagenACloudinary } = require('../utils/handleCloudinary');



const registrarAcudiente = async (req, res) => {
    try {
        const data = matchedData(req);
        const { per_id, pac_id, acu_parentesco} = data;

        // Verificar si la persona tiene el rol de acudiente en CUALQUIER sede para q asi se pueda registra datos adicionales
        const rolAcudienteExistente = await sedePersonaRolModel.findOne({
            where: {
                per_id,
                rol_id: 6, // acudiente
                [Op.or]: [
                    { sp_fecha_fin: null },
                    { sp_fecha_fin: { [Op.gt]: new Date() } }
                ],
            },
        });

        if (!rolAcudienteExistente) {
            return res.status(403).json({ 
                message: "La persona no tiene el rol de acudiente asignado en ninguna sede."
            });
        }


        // Verificar si la persona ya está registrada como acudiente
        const acudienteExistente = await acudienteModel.findOne({
            where: { per_id, pac_id },
            include: [
                {
                    model: personaModel,
                    as: 'persona',
                    attributes: ['per_nombre_completo', 'per_documento']
                },
                {
                    model: pacienteModel,
                    as: 'paciente',
                    include: [{
                        model: personaModel,
                        as: 'persona',
                        attributes: ['per_nombre_completo', 'per_documento']
                    }],
                }
            ]
        });

        if (acudienteExistente) {
            return res.status(400).json({
                message: 'La persona ya está registrada como acudiente para este paciente.',
                acudienteExistente: {
                    nombre: acudienteExistente.persona.per_nombre_completo,
                    documento: acudienteExistente.persona.per_documento,
                    paciente: {
                        nombre: acudienteExistente.paciente.persona.per_nombre_completo,
                        documento: acudienteExistente.paciente.persona.per_documento
                    }
                }
            });
        }

        // Verificar si el paciente existe
        const pacienteExistente = await pacienteModel.findOne({
            where: { pac_id },
        });

        if (!pacienteExistente) {
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }

        // Registrar nuevo acudiente
        const nuevoAcudiente = await acudienteModel.create({
            per_id,
            pac_id,
            acu_parentesco,
            // acu_foto: acu_foto || null,
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
                    as: 'persona', // Datos del acudiente
                    attributes: ['per_nombre_completo', 'per_documento']
                },
                {
                    model: pacienteModel,
                    as: 'paciente',
                    include: [
                        {
                            model: personaModel,
                            as: 'persona', // Datos del paciente
                            attributes: ['per_nombre_completo', 'per_documento']
                        }
                    ],
                    attributes: ['pac_id'] // Asegura que `paciente` se incluya correctamente
                }
            ]
        });
                

        return res.status(201).json({
            message: 'Acudiente registrado correctamente.',
            nuevoAcudiente: {
                acu_id: acudienteConPaciente.acu_id,
                acu_parentesco: acudienteConPaciente.acu_parentesco,
                acu_foto: acudienteConPaciente.acu_foto,
                acudiente: {
                    per_nombre_completo: acudienteConPaciente.persona.per_nombre_completo,
                    per_documento: acudienteConPaciente.persona.per_documento
                },
                paciente: {
                    per_nombre_completo: acudienteConPaciente.paciente.persona.per_nombre_completo,
                    per_documento: acudienteConPaciente.paciente.persona.per_documento
                }
            }
        });
        
    } catch (error) {
        console.error('Error al registrar acudiente:', error);
        return res.status(500).json({
            message: 'Error al registrar acudiente.',
            error: error.message,
        });
    }
};



// Obtener Acudientes de un Paciente
/* const obtenerAcudientesDePaciente = async (req, res) => {
    try {
        const { pac_id } = req.params;

        const acudientes = await acudienteModel.findAll({
            where: { pac_id },
            include: [
                {
                    model: personaModel,
                    as: 'persona',
                    attributes: ['per_nombre_completo', 'per_documento']
                }
            ]
        });

        return res.json({
            message: 'Acudientes obtenidos correctamente.',
            acudientes,
        });

    } catch (error) {
        console.error('Error al obtener acudientes de paciente:', error);
        return res.status(500).json({
            message: 'Error al obtener acudientes de paciente.',
            error: error.message,
        });
    }
}; */

module.exports = { registrarAcudiente };
