const express = require("express");
const { obtenerSesion } = require("../controllers/obtenerSesion");
const router = express.Router();

router.get("/", obtenerSesion);

module.exports = router;
