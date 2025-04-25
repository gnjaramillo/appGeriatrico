const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')
const checkRol = require('../middleware/rol');
const { validatorIdPer } = require('../validators/colaboradores');
const {obtenerColaboradoresSede, obtenerRolesColaboradoresSede } = require('../controllers/colaboradores');



router.get('/sede', sessionMiddleware, authMiddleware, checkRol([3]), obtenerColaboradoresSede);
router.get('/roles/:per_id', sessionMiddleware, authMiddleware, checkRol([3]), validatorIdPer, obtenerRolesColaboradoresSede);


module.exports = router;
