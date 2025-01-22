const { matchedData } = require('express-validator');
const { encrypt, compare } = require('../utils/handlePassword');
const { personaModel, rolModel, sedeModel, sedePersonaRolModel } = require('../models');
const { tokenSign } = require('../utils/handleJwt'); 
const { subirImagenACloudinary } = require('../utils/handleCloudinary'); 
const cloudinary = require('../config/cloudinary'); 


/* const obtenerPersonasRegistradas = async (request, response) => {
    try {
        const personas = await personaModel.findAll();
        if(personas.length === 0) {
            return response.status(404).json({ message: 'No se han encontrado personas registradas' });
        }
        return response.status(200).json({ message: 'Personas obtenidas exitosamente', personas });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error al obtener personas' });
    }
}; 

module.exports = {obtenerPersonasRegistradas }

 */



const obtenerPersonasRegistradas = async (request, response) => {
    try {
        const personas = await personaModel.findAll();
        
        if (personas.length === 0) {
            return response.status(404).json({ message: 'No se han encontrado personas registradas' });
        }

        // Filtrar campos necesarios
        const personasFiltradas = personas.map(persona => ({
            fechaRegistro: persona.per_fecha,
            nombre: persona.per_nombre_completo,
            documento: persona.per_documento, 
            correo: persona.per_correo
        }));

        return response.status(200).json({
            message: 'Personas obtenidas exitosamente',
            personas: personasFiltradas
        });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Error al obtener personas' });
    }
};

module.exports = { obtenerPersonasRegistradas };

