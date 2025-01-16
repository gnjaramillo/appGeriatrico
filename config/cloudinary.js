const cloudinary = require('cloudinary').v2;

// Configurar Cloudinary con las variables de entorno
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Nombre de la nube
    api_key: process.env.CLOUDINARY_API_KEY,       // API Key
    api_secret: process.env.CLOUDINARY_API_SECRET  // API Secret
});

module.exports = cloudinary;



