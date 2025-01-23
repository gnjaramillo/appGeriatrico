/* 
const { handleHttpError } = require('../utils/handleError');
const rolModel = require('../models/rolModel'); 



const checkRol = (allowedRoleIds) => async (req, res, next) => {
    try {
        const { rol_id } = req.session.rol_id; // ID del rol del usuario
        
        // Verificar si el rol_id existe en la base de datos
        const rol = await rolModel.findOne({ where: { rol_id } });

        // Si el rol no existe en la base de datos, retorna un error
        if (!rol) {
            return handleHttpError(res, 'Rol no encontrado', 403);
        }

        // Verifica si el rol_id está en la lista de IDs permitidos
        if (!allowedRoleIds.includes(rol_id)) {
            return handleHttpError(res, 'No tienes permiso', 403);
        }

        next();
    } catch (error) {
        return handleHttpError(res, 'Error en la validación', 403);
    }
};


module.exports = checkRol; */


const { handleHttpError } = require('../utils/handleError');
const {rolModel } = require('../models');

const checkRol = (allowedRoleIds) => (req, res, next) => {
    try {
        const rol_id = req.session.rol_id; 
        
        if (!allowedRoleIds.includes(rol_id)) {
            return handleHttpError(res, 'No tienes permiso', 403);
        }
        next();
    } catch (error) {
        return handleHttpError(res, 'Error en la validación', 403);
    }
};

module.exports = checkRol;