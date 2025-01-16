const multer = require('multer');
const storage = multer.memoryStorage(); // Guardar temporalmente en memoria
const upload = multer({ storage: storage }) // Permitir cualquier imagen

module.exports = upload;
