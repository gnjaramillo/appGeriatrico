const { personaModel } = require('../models');
const { handleHttpError } = require('../utils/handleError');
const { verifyToken } = require('../utils/handleJwt');


const authMiddleware = async (req, res, next) => {
  try {
    // Intentar obtener el token desde las cookies
    const token = req.cookies.authToken || req.headers.authorization?.split(' ').pop();

    // console.log('Cookies en la solicitud:', req.cookies);
    // console.log('Authorization header:', req.headers.authorization);


    if (!token) {
      return handleHttpError(res, 'Token no proporcionado', 401);
    }

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

