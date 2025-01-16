const cloudinary = require('../config/cloudinary'); 



/**
 * Subir una imagen a Cloudinary.
 * @param {Object} file - El archivo de imagen proporcionado por Multer.
 * @returns {Promise<Object>} - Resultado de la subida a Cloudinary.
 */
const subirImagenACloudinary = async (file, folder = "default") => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { folder: folder }, // Carpeta dinámica
            (error, result) => {
                if (error) return reject(error);
                resolve(result); // Devuelve el resultado de la carga (URL, etc.)
            }
        ).end(file.buffer); // Aquí usamos el buffer del archivo en MemoryStorage
    });
};
module.exports = { subirImagenACloudinary };

