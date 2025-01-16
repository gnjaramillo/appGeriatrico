/* const { matchedData } = require('express-validator');
const { enfermeraModel } = require('../models');


const datosEnfermera = async (req, res) => {
    try {
        const { per_id, enf_codigo } = matchedData(req);

        // Verificar si los datos de la enfermera ya existen
        const enfermeraExistente = await enfermeraModel.findOne({ where: { per_id } });
        if (enfermeraExistente) {
            return res.status(200).json({
                message: 'La persona ya está registrada como enfermera.',
                datos: enfermeraExistente, // Retorna los datos existentes
            });
        }

        // Registrar los datos específicos de la enfermera
        const nuevaEnfermera = await enfermeraModel.create({
            per_id,
            enf_codigo,
        });

        return res.status(201).json({
            message: 'Datos adicionales de la enfermera registrados correctamente.',
            data: nuevaEnfermera,
        });

    } catch (error) {
        console.error("Error al registrar datos de enfermera:", error);
        return res.status(500).json({
            message: "Error al registrar datos de enfermera",
            error: error.message,
        });
    }
};

module.exports = {  datosEnfermera };

 */