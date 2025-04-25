const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer');
const sessionMiddleware = require('../middleware/sessionRedis')
const authMiddleware = require('../middleware/sessionJwt')
const checkRol = require('../middleware/rol');
const { registrarPersona, loginPersona} = require('../controllers/auth')
const {validarRegistroPersona, validarLogin} = require('../validators/auth'); 



// http://localhost:3000/api/auth/login
// http://localhost:3000/api/auth/registroPersona


// registrar persona a cargo de roles super admin, admin geriatrico y admin sede
router.post('/registroPersona',sessionMiddleware, authMiddleware, checkRol([1,2,3]), upload.single('per_foto'), validarRegistroPersona, registrarPersona);
router.post('/login', validarLogin, sessionMiddleware, loginPersona);




module.exports = router