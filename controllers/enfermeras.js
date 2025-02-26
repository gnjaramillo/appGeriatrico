const { Op } = require('sequelize');
const { matchedData } = require('express-validator');
const { enfermeraModel, personaModel, sedePersonaRolModel } = require('../models');



const registrarEnfermera = async (req, res) => {
    try {
        const data = matchedData(req);
        const { per_id, enf_codigo } = data;


        // Verificar si la persona ya tiene estos datos adicionales como enfermera
        const datosEnfermeraExistente = await enfermeraModel.findOne({
            where: { per_id },
            include: [{
                model: personaModel,  
                as: 'persona',  
                attributes: ['per_nombre_completo', 'per_documento']
            }]
        });

       

        if (datosEnfermeraExistente) {
            return res.status(400).json({
                message: 'La persona ya está registrada como enfermera(o) con su respectivo código.',
                datosEnfermeraExistente: {
                    nombre: datosEnfermeraExistente.persona.per_nombre_completo,  // Acceder con el alias correcto
                    documento: datosEnfermeraExistente.persona.per_documento,
                    enf_codigo: datosEnfermeraExistente.enf_codigo
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





