/* // redisConfig.js
const redis = require('redis');

// Crear cliente Redis con configuración desde .env
const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    tls: true, // Habilitar TLS si Redis en la nube lo requiere
    socket_timeout: 10000, // Tiempo de espera para la conexión
    connect_timeout: 10000, // Tiempo de espera para establecer la conexión
});

// Manejar errores de conexión
client.on('error', (err) => {
    console.error('Redis error:', err);
});

client.on('connect', () => {
    console.log('Conectado a Redis en la nube');
});

// Exportar el cliente para ser utilizado en otras partes de la aplicación
module.exports = client;
 */