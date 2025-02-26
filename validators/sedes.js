const { check } = require('express-validator');
const validateResults = require('../utils/handleValidator');

// Función para convertir a tipo título
const toTitleCase = (value) => 
    value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const validatorCrearSede = [
    check('se_nombre').exists().notEmpty().isLength({ min: 3, max: 255 }).trim().customSanitizer(toTitleCase), // Aplica conversión a título, 
    check('se_telefono').exists().notEmpty().isLength({ min: 7, max: 30 }),
    check('se_direccion').exists().notEmpty().isLength({ min: 5, max: 255 }),
    check('cupos_totales')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Debe ser un número entero mayor a 0')
    .custom((value, { req }) => {
        if (req.body.cupos_ocupados && value < req.body.cupos_ocupados) {
            throw new Error('Los cupos ocupados no pueden ser mayores que los cupos totales.');
        }
        return true;
    }),
    (req, res, next) => validateResults(req, res, next),
];



const validatorIdSede = [
    check('se_id').exists().isInt().withMessage('El ID de la sede debe ser un número válido'),
    (req, res, next) => {
        return validateResults(req, res, next);
    },
];



const validatorActualizarSede = [
    check('se_id').exists().isInt().withMessage('El ID de la sede debe ser un número válido'),
    check('se_nombre').optional().isLength({ min: 3, max: 255 }).trim().customSanitizer(toTitleCase),  
    check('se_telefono').optional().isLength({ min: 7, max: 30 }),
    check('se_direccion').optional().isLength({ min: 5, max: 255 }),
    check('cupos_totales')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Debe ser un número entero mayor a 0')
    .custom((value, { req }) => {
        if (req.body.cupos_ocupados && value < req.body.cupos_ocupados) {
            throw new Error('Los cupos ocupados no pueden ser mayores que los cupos totales.');
        }
        return true;
    }),

    (req, res, next) => validateResults(req, res, next),
];


module.exports = { validatorCrearSede, validatorIdSede, validatorActualizarSede };
