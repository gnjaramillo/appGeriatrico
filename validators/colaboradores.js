const { check , param} = require('express-validator');
const  validateResult  = require('../utils/handleValidator');

const validatorIdPer = [
    check('per_id').exists().withMessage('El per_id es obligatorio.').isInt().withMessage('El per_id debe ser un número entero.'),
    (req, res, next) => validateResult(req, res, next),
];












module.exports = { validatorIdPer };
