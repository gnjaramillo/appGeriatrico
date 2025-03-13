const sessionMiddleware = require('express-session');
const RedisStore = require('connect-redis').default; // Para Redis v7+
const { createClient } = require('redis');

// crear cliente
const redisClient = createClient({
    url: process.env.REDIS_URL, // Usa la URL completa de Redis
    password: process.env.REDIS_PASSWORD ,

    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error("🔴 Redis desconectado después de 10 intentos.");
                return new Error("Redis desconectado.");
            }
            console.warn(`🟡 Intentando reconectar a Redis... Intento #${retries}`);
            return Math.min(retries * 100, 3000); // Tiempo entre intentos (máx. 3s)
        }
    }

});

redisClient.on('error', (err) => console.error('Error de Redis:', err));
redisClient.on('connect', () => console.log('Conectado a Redis con éxito'));
redisClient.on('reconnecting', () => console.log('♻️ Intentando reconectar a Redis...'));



// Conectar el cliente Redis
redisClient.connect().catch(console.error); //  Redis v4+

// Configurar express-session con Redis
module.exports = sessionMiddleware({
    store: new RedisStore({ client: redisClient }),  
    secret: process.env.SESSION_SECRET || 'defaultSecret',  
    resave: false, // no vuelve a guardar sesion si no hay cambios
    saveUninitialized: false,
    proxy: true, // Necesario para cookies "secure" detrás de un proxy
    cookie: {
        secure: process.env.NODE_ENV === "production", // True solo en producción (HTTPS)   
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' para producción (diferentes dominios) 
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 4 , // 4 horas
      }
      
});
