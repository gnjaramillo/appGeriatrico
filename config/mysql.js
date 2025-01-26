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
        dialect: 'mysql'
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

/* console.log('DATABASE:', process.env.MYSQL_DATABASE_RAILWAY);
console.log('USER:', process.env.MYSQL_USER_RAILWAY);
console.log('HOST:', process.env.MYSQL_HOST_RAILWAY);
console.log('PORT:', process.env.MYSQL_PORT_RAILWAY); */


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




/* const {Sequelize} = require('sequelize');


const NODE_ENV = process.env.NODE_ENV
const database = (NODE_ENV === 'test') ? process.env.MYSQL_DATABASE_TEST : process.env.MYSQL_DATABASE
const username = process.env.MYSQL_USER
const password = process.env.MYSQL_PASSWORD
const host = process.env.MYSQL_HOST



const sequelize = new Sequelize(database, username, password, {
    host,
    dialect: 'mysql', 
    logging: false, // Desactiva los logs de Sequelize, activarlos en dllo y desactivar en produccion
    define: {
        underscored: true // Convierte camelCase en snake_case
    },
    pool: {
        max: 10, // Máximo de conexiones simultáneas
        min: 0,  // Mínimo de conexiones en el pool
        acquire: 30000, // Tiempo máximo antes de marcar error en una conexión (ms)
        idle: 10000 // Tiempo que una conexión puede estar inactiva antes de ser cerrada (ms)
    }
});

const dbConnectMysql =  async() => {

    
    try{
        await sequelize.authenticate()
        console.log('conexión correcta base de datos mysql')
    }
    catch(e){
        console.log('error de conexión mysql')
    }
};

module.exports = { sequelize, dbConnectMysql };
 */


