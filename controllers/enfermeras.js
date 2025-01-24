const { matchedData } = require('express-validator');
const { enfermeraModel } = require('../models');




const registrarEnfermera = async (req, res) => {
    try {
        const data = matchedData(req);
        const { per_id, enf_codigo } = data;


        // Verificar si el código ya existe
        const codigoExistente = await enfermeraModel.findOne({ where: { enf_codigo } });
        if (codigoExistente) {
            return res.status(400).json({
                message: 'El código ya está en uso. Por favor, elija otro.',
            });
        }


        // Verificar si ya existe como enfermera
        const enfermeraExistente = await enfermeraModel.findOne({ where: { per_id } });
        if (enfermeraExistente) {
            return res.status(200).json({
                message: 'La persona ya está registrada como enfermera.',
                enfermeraExistente,
            });
        }

        // Registrar nueva enfermera
        const nuevaEnfermera = await enfermeraModel.create({
            per_id,
            enf_codigo,
        });

        return res.status(201).json({
            message: 'Enfermera registrada correctamente.',
            nuevaEnfermera,
        });
    } catch (error) {
        console.error('Error al registrar enfermera:', error);
        return res.status(500).json({
            message: 'Error al registrar enfermera.',
            error: error.message,
        });
    }
};

module.exports = {  registrarEnfermera };
