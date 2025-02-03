const { handleHttpError } = require('../utils/handleError');

const checkRol = (allowedRoleIds) => (req, res, next) => {
    try {
        const { rol_id, esSuperAdmin } = req.session; 

        // Si es super admin, permite el acceso automáticamente a todo el sistema
        if (esSuperAdmin) {
            return next();
        }

        // Verificar si el usuario tiene uno de los roles permitidos
        if (!allowedRoleIds.includes(rol_id)) {
            return handleHttpError(res, 'No tienes permiso', 403);
        }

        next();
    } catch (error) {
        return handleHttpError(res, 'Error en la validación', 403);
    }
};

module.exports = checkRol;






