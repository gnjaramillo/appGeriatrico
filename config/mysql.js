const {Sequelize} = require('sequelize');
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
