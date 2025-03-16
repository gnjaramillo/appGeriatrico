
const cloudinary = require('../config/cloudinary');

/**
 * Subir un archivo a Cloudinary con límite de tamaño.
 * @param {Object} file - El archivo proporcionado por Multer.
 * @param {string} folder - La carpeta de destino en Cloudinary.
 * @returns {Promise<Object>} - Resultado de la subida a Cloudinary.
 */
const subirImagenACloudinary = async (file, folder = "default") => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: "auto", // Permite cualquier archivo
                chunk_size: 10 * 1024 * 1024, // 10MB por chunk (para archivos grandes)
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result); // Devuelve el resultado de la carga (URL, etc.)
            }
        ).end(file.buffer);
    });
};

module.exports = { subirImagenACloudinary };
