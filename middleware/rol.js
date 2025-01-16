/* const { handleHttpError } = require('../utils/handleError');


const checkRol = (roles) => (req, res, next) => {
    try {
        const { user } = req;
        console.log({user})

        // estraer los roles del usuario
        const rolesByUser = user.role;

        const checkValueRol = roles.some((rolSingle) => rolesByUser.includes(rolSingle));
        
        if (!checkValueRol ) {
            handleHttpError(res, 'Error de permisos', 403);
        }

        next();
        
    } catch (error) {
        handleHttpError(res, 'Error de permisos', 403);
    }
};

module.exports = checkRol; */


const { handleHttpError } = require('../utils/handleError');

/**
 * Middleware para verificar si el usuario tiene los roles permitidos
 * @param {Array<string>} roles Roles permitidos para la ruta
 */


const checkRol = (roles) => (req, res, next) => {
    try {
        const { rol } = req.user; // El rol debe estar disponible en req.user desde authMiddleware

        if (!roles.includes(rol)) {
            return handleHttpError(res, 'No tienes permisos para acceder a este recurso', 403);
        }

        next();
    } catch (error) {
        console.error("Error en la verificación de roles:", error);
        return handleHttpError(res, 'Error al verificar roles', 403);
    }
};

module.exports = checkRol;



/* Se usa el método .some() para comprobar si al menos uno de los roles permitidos
 (en roles) está presente en los roles del usuario (rolesByUser).
La función de callback (rolSingle) => rolesByUser.includes(rolSingle) 
se ejecuta para cada rol en roles, verificando si rolesByUser incluye ese rol.
El resultado es true si existe al menos una coincidencia; de lo contrario, será false. */