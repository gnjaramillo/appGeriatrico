const express = require('express');
const router = express.Router();
const { registrarPersona, loginPersona} = require('../controllers/auth')
const {validarRegistroPersona, validarLogin} = require('../validators/auth'); 
const upload = require('../middleware/multer');


// http://localhost:3000/api/auth/login
// http://localhost:3000/api/auth/registroPersona



router.post('/registroPersona', upload.single('per_foto'), validarRegistroPersona, registrarPersona);
router.post('/login', validarLogin, loginPersona);




module.exports = router