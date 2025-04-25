const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const upload = require('../middleware/multer');

const { obtenerPersonasRegistradas, actualizarPersona, actualizarPerfil, obtenerMiPerfil, buscarPersonaPorDocumento } = require('../controllers/personas');
const { validarUpdatePersona, validarUpdatePerfil } = require('../validators/personas');


router.get('/', sessionMiddleware, authMiddleware, checkRol([1,2,3]), obtenerPersonasRegistradas);
router.get('/perfil', sessionMiddleware, authMiddleware, obtenerMiPerfil);
router.get('/buscar/:per_documento', sessionMiddleware, authMiddleware,checkRol([1,2,3,5]), buscarPersonaPorDocumento);
router.put('/updateperfil', sessionMiddleware, authMiddleware, upload.single('per_foto'), validarUpdatePerfil, actualizarPerfil);
router.put('/:per_id', sessionMiddleware, authMiddleware, checkRol([1,2,3]),  upload.single('per_foto'), validarUpdatePersona, actualizarPersona);



module.exports = router;
