const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Configuración de Swagger
 */
const swaggerDefinition = {
    openapi: '3.0.0', // Especifica la versión de OpenAPI que estás utilizando
    info: {
        title: 'Documentación de mi API RESTful curso Node.js udemy', // Título de la documentación
        version: '1.0.0', // Versión de tu API
        description: 'API RESTful Node.js con Express, Mongoose, Mysql, JWT, Swagger... ', // Descripción breve
    },
    servers: [
        {
            url: 'http://localhost:3000/api', // URL base de tu API
            description: 'API RESTful Node.js', // Descripción de este servidor
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http', // Indica que es un esquema HTTP
                scheme: 'bearer', // Específico para tokens Bearer
                bearerFormat: 'JWT', // Opcional, describe el formato del token (por ejemplo, JWT)
            },
        },
            schemas:{
            authLogin:{
                type:'object',
                required:['email', 'password'],
                properties:{
                    email:{
                        type:'string'
                    },
                    password:{
                        type:'string'
                    },
                },
            },
            authRegister:{
                type:'object',
                required:[ 'name', 'age','email', 'password'],
                properties:{
                    name:{
                        type:'string'
                    },
                    age:{
                        type:'integer'
                    },
                    email:{
                        type:'string'
                    },
                    password:{
                        type:'string'
                    },
                    
                },
            },
            track:{
                type:'object',
                required:['name, abulm'],
                properties:{
                    name:{
                        type:'string'
                    },
                    album:{
                        type:'string'
                    },
                    cover:{
                        type:'string'
                    },
                    artist:{
                        type:'object',
                        properties:{
                            name:{
                                type:'string'
                            },
                            nickname:{
                                type:'string'
                            },
                            nationality:{
                                type:'string'
                            },
                        }
                    },                
                    duration:{
                        type:'object',
                        properties:{
                            start:{
                                type:'integer'
                            },
                            end:{
                                type:'integer'
                            },
                        }
                    },
                    mediaId:{
                        type:'integer'
                    },
    
    
                }
            
            },
            storage:{
                type:'object',
                properties:{
                    url:{
                        type:'string'
                    },
                    filename:{
                        type:'string'
                    },
                },

            }
        }
    
    }
};

/**
 * Opciones para Swagger
 */
const options = {
    swaggerDefinition, // Definición de Swagger
    apis: ['./routes/*.js'], // Rutas donde están definidos los endpoints de tu API
};

/**
 * Generar configuración de OpenAPI
 */
const openApiConfig = swaggerJsdoc(options);

module.exports = openApiConfig;

/**  ruta de documetación definida en app.js 
 * http://localhost:3000/documentation/
*/

