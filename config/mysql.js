const { Sequelize } = require('sequelize');

const NODE_ENV = process.env.NODE_ENV || 'development';
console.log("El entorno actual es:", NODE_ENV);

// Configuración según el entorno
const config = {
    development: {
        database: process.env.MYSQL_DATABASE,
        username: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        host: process.env.MYSQL_HOST,
        dialect: 'mysql',
        /* logging: (msg) => {
            if (msg.startsWith("UPDATE") || msg.startsWith("INSERT")) {
                console.log(msg); // Solo muestra INSERTs y UPDATEs
            }
        } */
        logging: false
    },
    test: {
        database: process.env.MYSQL_DATABASE_TEST,
        username: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        host: process.env.MYSQL_HOST,
        dialect: 'mysql',
        logging: false // Desactiva logs en modo test para evitar ruido en consola
    },
    production: { // Railway proporciona la URL de conexión
        database: process.env.MYSQL_DATABASE_RAILWAY,
        username: process.env.MYSQL_USER_RAILWAY,
        password: process.env.MYSQL_PASSWORD_RAILWAY,
        host: process.env.MYSQL_HOST_RAILWAY,
        port: process.env.MYSQL_PORT_RAILWAY, 
        dialect: 'mysql',
        logging: false 


    }
};

// Configurar Sequelize según el entorno
let sequelize;

if (NODE_ENV === 'production') {
    // En producción usamos las variables de entorno para desglosar la URL
    sequelize = new Sequelize(config.production.database, config.production.username, config.production.password, {
        host: config.production.host,
        port: config.production.port,
        dialect: config.production.dialect
    });
} else {
    const envConfig = config[NODE_ENV] || config.development;
    sequelize = new Sequelize(envConfig.database, envConfig.username, envConfig.password, {
        host: envConfig.host,
        port: envConfig.port, // Añadimos el puerto aquí
        dialect: envConfig.dialect
    });
}




// Función para conectar
const dbConnectMysql = async () => {
    try {
        await sequelize.authenticate();
        console.log(`✅ Conectado a MySQL en modo ${NODE_ENV}`);
    } catch (e) {
        console.error('❌ Error de conexión a MySQL:', e);
    }
};

module.exports = { sequelize, dbConnectMysql };






