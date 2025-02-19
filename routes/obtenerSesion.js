const express = require("express");
const { obtenerSesion } = require("../controllers/obtenerSesion");
const router = express.Router();
const authMiddleware = require('../middleware/sessionJwt')
const sessionMiddleware = require('../middleware/sessionRedis')


router.get("/", sessionMiddleware, authMiddleware, obtenerSesion);

module.exports = router;
