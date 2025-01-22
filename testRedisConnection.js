require('dotenv').config();  // Cargar las variables de entorno desde el archivo .env

const redis = require('redis');

(async () => {
    const client = redis.createClient({
        url: process.env.REDIS_HOST,  // Usamos el URL completo con el endpoint y puerto
        password: process.env.REDIS_PASSWORD,  // Usar la contraseña desde el archivo .env
    });

    client.on('error', (err) => console.error('Error de Redis:', err));
    client.on('connect', () => console.log('Conectado a Redis con éxito'));

    try {
        await client.connect();
        console.log('Prueba de conexión exitosa');
        await client.disconnect();
    } catch (err) {
        console.error('Error al conectar con Redis:', err);
    }
})();

// para probar este codigo en la terminal: node testRedisConnection.js
