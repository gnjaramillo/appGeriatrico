/* const { personaModel } = require('../models');
const { handleHttpError } = require('../utils/handleError');
const { verifyToken } = require('../utils/handleJwt');

const authMiddleware = async (req, res, next) => {
    try {
        // Verificar si el token está presente en los encabezados
        console.log('Authorization Header recibido:', req.headers.authorization);

        if (!req.headers.authorization) {
            console.log('Token no proporcionado en los encabezados.');
            return handleHttpError(res, 'Token no proporcionado', 401);
        }

        console.log('Authorization Header recibido:', req.headers.authorization);

        // Extraer y verificar el token
        const token = req.headers.authorization.split(' ').pop();

        const decodedToken = await verifyToken(token);

        // Validar que el token contenga un ID válido
        if (!decodedToken || !decodedToken.id) {
            return handleHttpError(res, 'Token inválido o expirado', 401);
        }

        

        // Consultar el usuario en la base de datos si no está en el token
        const user = await personaModel.findByPk(decodedToken.id, {
            attributes: ['per_id', 'per_nombre_completo'],
        });

        if (!user) {
            console.log('Usuario no encontrado en la base de datos con ID:', decodedToken.id);
            return handleHttpError(res, 'Usuario no encontrado', 404);
        }

        // Agregar datos básicos del usuario a req.user
        req.user = {
            id: user.per_id,
            nombre: user.per_nombre_completo,
        };

        // Verificar si la sesión tiene `se_id` y `rol_id` para que sean guardados y usados en otras rutas
        if (req.session.se_id && req.session.rol_id) {
            console.log('Datos de sesión sede y rol:', req.session);
            req.user.se_id = req.session.se_id;
            req.user.rol_id = req.session.rol_id;
            
        } else {
            // Si no están en la sesión, inicializar con valores nulos
            console.log('Datos de sesión no encontrados.');
            req.user.se_id = null;
            req.user.rol_id = null;
        }

        console.log('Middleware de autenticación finalizado correctamente.');
        next();
    } catch (error) {
        console.error('Error en el middleware de autenticación:', error.message);
        handleHttpError(res, 'Error de autenticación', 401);
    }
};

module.exports = authMiddleware; */


const { personaModel } = require('../models');
const { handleHttpError } = require('../utils/handleError');
const { verifyToken } = require('../utils/handleJwt');

const authMiddleware = async (req, res, next) => {
  try {
    // Validar si el token está presente en los encabezados
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return handleHttpError(res, 'Token no proporcionado', 401);
    }

    const token = authHeader.split(' ').pop();
    const decodedToken = await verifyToken(token);

    if (!decodedToken || !decodedToken.id) {
      return handleHttpError(res, 'Token inválido o expirado', 401);
    }

    // Buscar el usuario asociado al ID del token
    const user = await personaModel.findByPk(decodedToken.id, {
      attributes: ['per_id', 'per_nombre_completo'],
    });

    if (!user) {
      return handleHttpError(res, 'Usuario no encontrado', 404);
    }

    // Agregar datos básicos del usuario a `req.user`
    req.user = {
      id: user.per_id,
      nombre: user.per_nombre_completo,
      se_id: req.session.se_id || null, // Datos de sesión opcionales
      rol_id: req.session.rol_id || null,
    };

    next();
  } catch (error) {
    console.error('Error en el middleware de autenticación:', error.message);
    handleHttpError(res, 'Error de autenticación', 401);
  }
};

module.exports = authMiddleware;
