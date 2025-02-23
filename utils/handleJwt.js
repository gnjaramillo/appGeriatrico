const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const tokenSign = async (persona) => {
    // console.log('Generando token para:', persona);

    const payload = {
        id: persona.per_id, // ID del usuario
        nombre: persona.per_nombre_completo || 'Sin Nombre', // Nombre del usuario
    };

    // console.log('Payload generado:', payload);

    return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' }); // Ajusta el tiempo de expiración según sea necesario
};

const verifyToken = async (tokenJwt) => {
    try {
        const decoded = jwt.verify(tokenJwt, JWT_SECRET);
        // console.log('Token decodificado:', decoded);
        return decoded;
    } catch (error) {
        console.error('Error al verificar token:', error.message);
        return null;
    }
};

module.exports = { tokenSign, verifyToken };




