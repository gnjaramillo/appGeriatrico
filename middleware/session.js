const { personaModel } = require('../models');
const { handleHttpError } = require('../utils/handleError');
const { verifyToken } = require('../utils/handleJwt');


const authMiddleware = async (req, res, next) => {
    try {

        // Verificar si el token está presente en los encabezados
        if (!req.headers.authorization) {
            console.log('Token no proporcionado en los encabezados.');
            return handleHttpError(res, 'Token no proporcionado', 401);
        }

        console.log('Authorization Header recibido:', req.headers.authorization);

        // Extraer y verificar el token
        const token = req.headers.authorization.split(' ').pop();

        const decodedToken = await verifyToken(token);
        // console.log('Token decodificado:', decodedToken);

        // Validar que el token contenga un ID válido
        if (!decodedToken || !decodedToken.id) {
            return handleHttpError(res, 'Token inválido o expirado', 401);
        }

        // Verificar si el token ya contiene rol_id y se_id
        if (decodedToken.rol_id && decodedToken.se_id) {
            console.log('El token contiene los datos completos (rol y sede):', decodedToken);

            req.user = {
                id: decodedToken.id,
                nombre: decodedToken.nombre,
                rol_id: decodedToken.rol_id,
                rol_nombre: decodedToken.rol_nombre,
                se_id: decodedToken.se_id,
                sede_nombre: decodedToken.sede_nombre,
            };

        } else {
            // Si no contiene rol y sede, buscar los datos básicos del usuario en la base de datos
            console.log('Token no contiene rol_id o se_id. Realizando consulta en la base de datos...');

            const user = await personaModel.findByPk(decodedToken.id, {
                attributes: ['per_id', 'per_nombre_completo'],
            });

            if (!user) {
                console.log('Usuario no encontrado en la base de datos con ID:', decodedToken.id);
                return handleHttpError(res, 'Usuario no encontrado', 404);
            }

            req.user = {
                id: user.per_id,
                nombre: user.per_nombre_completo,
                rol_id: null,
                rol_nombre: null,
                se_id: null,
                sede_nombre: null,
            };
        }

        console.log('Middleware de autenticación finalizado correctamente.');
        next();
    } catch (error) {
        console.error('Error en el middleware de autenticación:', error.message);
        handleHttpError(res, 'Error de autenticación', 401);
    }
};

module.exports = authMiddleware;

