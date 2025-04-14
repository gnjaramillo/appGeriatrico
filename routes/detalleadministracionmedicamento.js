const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');

const { 
    registrarAdministracionDosis, obtenerDetallesDeAdministracionPorFormula
    } = require('../controllers/detalleadministracionmedicamento');

    
const {

    validatorRegistrarAdminMedicamento,validatorAdminId

    } = require('../validators/detalleadministracionmedicamento');


    router.get('/formula/:admin_id', sessionMiddleware, authMiddleware, checkRol([3, 5, 6]), validatorAdminId,  obtenerDetallesDeAdministracionPorFormula);
    // router.get('/hoy/:pac_id', sessionMiddleware, authMiddleware, checkRol([3, 5]),  obtenerDosisDelDia);
    router.post('/:admin_id', sessionMiddleware, authMiddleware, checkRol([5]), validatorRegistrarAdminMedicamento, registrarAdministracionDosis);






module.exports = router;






