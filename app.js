require('dotenv').config()
const express = require('express')
const { app, server } = require('./utils/handleSocket');
const cors = require('cors')
const openApiConfig = require('./docs/swagger')
const swaggerUI = require('swagger-ui-express')
const { dbConnectMysql } = require('./config/mysql')
const cookieParser = require('cookie-parser')

// Importa la sincronización
// require('./sync');  // Ejecuta la sincronización de modelos


// const app = express()
const NODE_ENV = process.env.NODE_ENV || 'development'
const port = process.env.PORT || 3000; 

// Habilita confianza en proxies (Railway usa proxy inverso)
app.set("trust proxy", 1);


/* app.use(express.urlencoded({ extended: true }));
app.use(express.json()); */

app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));



app.use(express.static('storage'))
app.use(cookieParser());


// Configuración de CORS
app.use(cors({
    origin: [
      'http://localhost:4000',  // Dominio local del frontend
      'http://localhost:5174',  // Dominio local del frontend
      'http://localhost:5173',
      'http://localhost:3000',
      "https://appgeriatrico-production.up.railway.app", // url despliegue backend
      "https://app-geriatrico-production.up.railway.app", // url despliegue frontend

    ],
    credentials: true, // Permitir el envío de cookies/credenciales
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos
    optionsSuccessStatus: 200, // Resolver problemas con navegadores antiguos
  }));
  

/*   app.use(cors({
    origin: true,
    credentials: true, // Permitir el envío de cookies/credenciales
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos
    optionsSuccessStatus: 200, // Resolver problemas con navegadores antiguos
  }));  */



/** definir ruta de documetación */

app.use('/documentation', 
    swaggerUI.serve, 
    swaggerUI.setup(openApiConfig) )

// invocar rutas

app.use('/api', require('./routes'))






/* if (NODE_ENV !== 'test'){
    app.listen(port, "0.0.0.0", () => {
        console.log(`tu app esta lista por http://localhost:${port}`)
    });
}
 */

if (NODE_ENV !== 'test'){
    server.listen(port, "0.0.0.0", () => {
        console.log(`tu app esta lista por http://localhost:${port}`)
    });
}





dbConnectMysql();

module.exports = app

