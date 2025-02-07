/* const multer = require('multer');
const storage = multer.memoryStorage(); // Guardar temporalmente en memoria
const upload = multer({ storage: storage }) // Permitir cualquier imagen

module.exports = upload; */


const multer = require('multer');

const storage = multer.memoryStorage(); // Guardar temporalmente en memoria
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Permitir archivos de hasta 50MB
});

module.exports = upload;

