const { check, body } = require('express-validator');
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



const validarRolSeleccionado = [
  // Validar que al menos uno de los campos `se_id` o `ge_id` exista y sea un número válido
  body('se_id').optional() .isInt({ min: 0 }).withMessage('El ID de la sede debe ser un número válido'),
  body('ge_id').optional() .isInt({ min: 0 }).withMessage('El ID del geriátrico debe ser un número válido'),

  // Validar que no se envíen ambos campos a la vez
  body()
      .custom((value) => {
          if (!value.se_id && !value.ge_id) {
              throw new Error('Debe enviar al menos un ID válido: `se_id` o `ge_id`.');
          }
          if (value.se_id && value.ge_id) {
              throw new Error('No puede enviar ambos: `se_id` y `ge_id` al mismo tiempo.');
          }
          return true;
      }),

  // Validar que `rol_id` exista y sea un número entero mayor que 0
  check('rol_id').isInt({ min: 1 }).exists().withMessage('El ID del rol debe ser un número válido'),

  // Validar resultados
  (req, res, next) => validateResults(req, res, next),
];


module.exports = { validatorCrearRol, validatorDetalleRol, validatorActualizarRol, validarRolSeleccionado };
