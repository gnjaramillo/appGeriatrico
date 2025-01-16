const { check } = require('express-validator');
const validateResults = require('../utils/handleValidator');

const validatorCrearSede = [
    check('se_nombre').exists().notEmpty().isLength({ min: 3, max: 255 }).trim().customSanitizer((value) => value.toLowerCase()), 
    check('se_telefono').exists().notEmpty().isLength({ min: 7, max: 30 }),
    check('se_direccion').exists().notEmpty().isLength({ min: 5, max: 255 }),
    check('cupos_totales').exists().notEmpty().isInt({ min: 1 }).withMessage('Debe ser un número entero mayor a 0'),
    check('cupos_ocupados').exists().notEmpty().isInt({ min: 0 }).withMessage('Debe ser un número entero mayor o igual a 0'),
    check('ge_id').exists().notEmpty().isInt().withMessage('Debe ser un ID de geriátrico válido'),
    (req, res, next) => validateResults(req, res, next),
];



const validatorDetalleSede = [
    check('se_id').exists().isInt().withMessage('El ID de la sede debe ser un número válido'),
    (req, res, next) => {
        return validateResults(req, res, next);
    },
];

const validatorActualizarSede = [
    check('se_id').exists().isInt().withMessage('El ID de la sede debe ser un número válido'),
    check('se_nombre').optional().notEmpty().isLength({ min: 3, max: 255 }).trim().customSanitizer((value) => value.toLowerCase()), 
    check('se_telefono').optional().notEmpty().isLength({ min: 7, max: 30 }),
    check('se_direccion').optional().notEmpty().isLength({ min: 5, max: 255 }),
    check('cupos_totales').optional().notEmpty().isInt({ min: 1 }).withMessage('Debe ser un número entero mayor a 0'),
    check('cupos_ocupados').optional().notEmpty().isInt({ min: 0 }).withMessage('Debe ser un número entero mayor o igual a 0'),
    check('ge_id').optional().notEmpty().isInt().withMessage('Debe ser un ID de geriátrico válido'),
    (req, res, next) => validateResults(req, res, next),
];


module.exports = { validatorCrearSede, validatorDetalleSede, validatorActualizarSede };
