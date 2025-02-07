const { Op } = require('sequelize');
const { matchedData } = require('express-validator');
const { enfermeraModel, personaModel, sedePersonaRolModel } = require('../models');



const registrarEnfermera = async (req, res) => {
    try {
        const data = matchedData(req);
        const { per_id, enf_codigo } = data;


        // Verificar si la persona tiene el rol de Enfermera en CUALQUIER sede para q asi se pueda registra datos adicionales
        const rolEnfermeraExistente = await sedePersonaRolModel.findOne({
            where: {
                per_id,
                rol_id: 5, // Enfermera
                [Op.or]: [
                    { sp_fecha_fin: null },
                    { sp_fecha_fin: { [Op.gt]: new Date() } }
                ],
            },
        });

        if (!rolEnfermeraExistente) {
            return res.status(403).json({ 
                message: "La persona no tiene el rol de enfermera(o) asignado en ninguna sede."
            });
        }

        // Verificar si ya está registrada en la tabla enfermera
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


        // Registrar enfermera
        const nuevaEnfermera = await enfermeraModel.create({ per_id, enf_codigo });

        return res.status(201).json({ 
            message: "Enfermera registrada con éxito.", 
            nuevaEnfermera 
        });

    } catch (error) {
        console.error("Error al registrar enfermera:", error);
        return res.status(500).json({ 
            message: "Error al registrar enfermera.", 
            error: error.message 
        });
    }
};


module.exports = { registrarEnfermera };





