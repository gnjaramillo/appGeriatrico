const { check , param} = require('express-validator');
const  validateResult  = require('../utils/handleValidator');

const validatorEnfermera = [
    check('per_id').exists().withMessage('El per_id es obligatorio.').isInt().withMessage('El per_id debe ser un número entero.'),
    check('enf_codigo').exists().withMessage('El enf_codigo es obligatorio.').isString().withMessage('El enf_codigo debe ser un texto.')
        .isLength({ min: 1 }).withMessage('El enf_codigo no puede estar vacío.'),
        
    (req, res, next) => validateResult(req, res, next),
];












module.exports = { validatorEnfermera };
