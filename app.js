require('dotenv').config()
const express = require('express')
const cors = require('cors')
const openApiConfig = require('./docs/swagger')
const swaggerUI = require('swagger-ui-express')
const { dbConnectMysql } = require('./config/mysql')
const cookieParser = require('cookie-parser');

// Importa la sincronización
require('./sync');  // Ejecuta la sincronización de modelos


const app = express()
const NODE_ENV = process.env.NODE_ENV || 'development'
const port = process.env.PORT || 3000


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('storage'))
app.use(cookieParser());


// Configuración de CORS
/* app.use(cors({
    origin: [
      'http://localhost:5173', // ejemplo Dominio local del frontend
    ],
    credentials: true, // Permitir el envío de cookies/credenciales
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos
    optionsSuccessStatus: 200, // Resolver problemas con navegadores antiguos
  })); */


  app.use(cors({
    origin: true, // Permitir cualquier origen
    credentials: true, // Permitir el envío de cookies
  }));
  



/** definir ruta de documetación */

app.use('/documentation', 
    swaggerUI.serve, 
    swaggerUI.setup(openApiConfig) )

// invocar rutas

app.use('/api', require('./routes'))


if (NODE_ENV !== 'test'){
    app.listen(port, () => {
        console.log(`tu app esta lista por http://localhost:${port}`)
    });
}



dbConnectMysql();

module.exports = app

