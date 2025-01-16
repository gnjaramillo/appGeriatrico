const { check } = require('express-validator');
const validateResults = require('../utils/handleValidator');

// Middleware para normalizar el campo "rol_nombre"
const normalizarRolNombre = (req, res, next) => {
  if (req.body.rol_nombre) {
    req.body.rol_nombre = req.body.rol_nombre.toLowerCase().trim(); // Convertir a minúsculas y eliminar espacios extra
  }
  next();
};

const validatorCrearRol = [
  normalizarRolNombre, 
  check('rol_nombre').exists().notEmpty().isString().isLength({ max: 100 }),
  check('rol_descripcion').optional().isString().isLength({ max: 255 }),
  (req, res, next) => validateResults(req, res, next),
];

const validatorDetalleRol = [
  check('rol_id').exists().notEmpty().isInt(),
  (req, res, next) => validateResults(req, res, next),
];

const validatorActualizarRol = [
  normalizarRolNombre, 
  check("rol_id").exists().notEmpty().isInt(),
  check("rol_nombre").optional().notEmpty().isLength({ min: 3, max: 100 }),
  check("rol_descripcion").optional().isLength({ max: 255 }),
  (req, res, next) => validateResults(req, res, next),
];

module.exports = { validatorCrearRol, validatorDetalleRol, validatorActualizarRol };
