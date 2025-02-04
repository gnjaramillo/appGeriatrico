const { matchedData } = require('express-validator');
const { enfermeraModel, personaModel } = require('../models');



const registrarEnfermera = async (req, res) => {
    try {
        const data = matchedData(req);
        const { per_id, enf_codigo } = data;

        console.log(`enfermera per_id: ${per_id}`);

        // Verificar si la persona ya tiene un código de enfermera asignado
        const enfermeraExistente = await enfermeraModel.findOne({
            where: { per_id },
            include: [{
                model: personaModel,  
                as: 'persona',  
                attributes: ['per_nombre_completo', 'per_documento']
            }]
        });

        if (enfermeraExistente) {
            return res.status(400).json({
                message: 'La persona ya está registrada como enfermera(o) con su respectivo código.',
                enfermeraExistente: {
                    nombre: enfermeraExistente.persona.per_nombre_completo,  // Acceder con el alias correcto
                    documento: enfermeraExistente.persona.per_documento,
                    enf_codigo: enfermeraExistente.enf_codigo
                }
            });
        }

        

        // Registrar nueva enfermera con código
        const nuevaEnfermera = await enfermeraModel.create({
            per_id,
            enf_codigo,
        });

        return res.status(201).json({
            message: 'Código de enfermera(o) registrado correctamente.',
            nuevaEnfermera,
        });
    } catch (error) {
        console.error('Error al registrar código de enfermera(o):', error);
        return res.status(500).json({
            message: 'Error al registrar código de enfermera(o).',
            error: error.message,
        });
    }
};


module.exports = {  registrarEnfermera };

