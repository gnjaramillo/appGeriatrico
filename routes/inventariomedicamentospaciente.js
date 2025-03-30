const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { 
    registrarMedicamentoPaciente, 
     } = require('../controllers/inventariomedicamentospaciente');

const {
    validatorCrearMedicamento, 
     
     } = require('../validators/inventariomedicamentospaciente');



// crear geriatrico lo hace el super admin
router.post('/:pac_id', sessionMiddleware, authMiddleware,  checkRol([3]), validatorCrearMedicamento, registrarMedicamentoPaciente);



module.exports = router;


