const { matchedData } = require('express-validator');
const { acudienteModel, personaModel, pacienteModel } = require('../models');

const registrarAcudiente = async (req, res) => {
    try {
        const data = matchedData(req);
        const { per_id, pac_id, acu_parentesco, acu_foto } = data;

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
                    attributes: [] // No necesitamos más atributos del paciente, solo la relación con persona
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
            acu_foto: acu_foto || null,
        });

        // Obtener los datos del nuevo acudiente con los datos del paciente
        const acudienteConPaciente = await acudienteModel.findOne({
            where: { acu_id: nuevoAcudiente.acu_id },
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
                    attributes: [] // Evitar redundancia en los datos del paciente
                }
            ]
        });

        return res.status(201).json({
            message: 'Acudiente registrado correctamente.',
            nuevoAcudiente: acudienteConPaciente,
        });
    } catch (error) {
        console.error('Error al registrar acudiente:', error);
        return res.status(500).json({
            message: 'Error al registrar acudiente.',
            error: error.message,
        });
    }
};

module.exports = { registrarAcudiente };
