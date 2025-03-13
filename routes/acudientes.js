const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const upload = require('../middleware/multer');
const { validatorAcudiente, validatorRelacionAcudiente } = require('../validators/acudientes');
const { registrarAcudiente, obtenerAcudientesDePaciente, inactivarRelacionAcudiente , reactivarRelacionAcudiente, pacientesAcudienteActivos} = require('../controllers/acudientes');



router.get('/paciente/:pac_id', sessionMiddleware, authMiddleware, checkRol([3,5]), obtenerAcudientesDePaciente);
router.get('/mispacientes', sessionMiddleware, authMiddleware, checkRol([6]), pacientesAcudienteActivos);
router.post('/registrar', sessionMiddleware, authMiddleware, checkRol([3]), upload.single('acu_foto'), validatorAcudiente, registrarAcudiente);
router.put("/inactivar/:pa_id", sessionMiddleware, authMiddleware, checkRol([3]), validatorRelacionAcudiente, inactivarRelacionAcudiente);
router.put("/reactivar/:pa_id", sessionMiddleware, authMiddleware, checkRol([3]), validatorRelacionAcudiente, reactivarRelacionAcudiente);




module.exports = router;
