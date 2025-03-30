const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { 
    registrarMedicamentoSede, 
     } = require('../controllers/inventariomedicamentosede');

const {
    validatorCrearMedicamento, 
     
     } = require('../validators/inventariomedicamentosede');



// crear geriatrico lo hace el super admin
router.post('/', sessionMiddleware, authMiddleware,  checkRol([3]), validatorCrearMedicamento, registrarMedicamentoSede);


module.exports = router;


