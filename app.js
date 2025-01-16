require('dotenv').config()
const express = require('express')
const cors = require('cors')
const openApiConfig = require('./docs/swagger')
const swaggerUI = require('swagger-ui-express')
//const morganBody = require('morgan-body')
//const loggerStream = require('./utils/handleLogger')
const { dbConnectMysql } = require('./config/mysql')
const app = express()
const NODE_ENV = process.env.NODE_ENV || 'development'
app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('storage'))

/* lo sgte sincroniza la base de datos cada vez que inicias la aplicación. 
Si tu entorno es de producción, me sirve si cambio los modelos, pero lo ideal es 
desactivar esta funcionalidad y usar migraciones. */

/* const { sequelize } = require('./config/mysql');

sequelize.sync({ alter: true }) // Actualiza la base de datos
    .then(() => console.log('Base de datos sincronizada.'))
    .catch((error) => console.error('Error al sincronizar la base de datos:', error));

 */
// este bloque de codigo anterior sincroniza con BD mysql


/** morgan filtra errores para enviarlos a slack, la desactive temporalmente mientras se hace testing * 

/* morganBody(app,{
    noColors: true, // Desactiva colores en la consola.
    stream: loggerStream, // Personaliza la salida.
    skip: function(req, res) {
        // filtrar que solo envie mensajes de error
        return res.statusCode < 400
    }
}) */

const port = process.env.PORT || 3000

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

/* morganBody configura logs detallados de  las solicitudes HTTP 
realizadas en la aplicación, enviándolos al stream definido (loggerStream) */


/* En producción, usa migraciones para manejar cambios en la 
estructura de la base de datos. Puedes generarlas con sequelize-cli */

/* IncomingWebhook Permite enviar mensajes automatizados 
desde tu aplicación a canales o usuarios específicos en Slack. */