const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const upload = require('../middleware/multer');
const { validatorAcudiente } = require('../validators/acudientes');
const { registrarAcudiente } = require('../controllers/acudientes');



router.post('/registrar', sessionMiddleware, authMiddleware, checkRol([3]), upload.single('acu_foto'), validatorAcudiente, registrarAcudiente);

module.exports = router;
