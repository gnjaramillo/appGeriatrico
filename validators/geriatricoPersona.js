const { check } = require('express-validator');
const validateResults = require('../utils/handleValidator');

const validarPersonaGeriatrico = [
    check('per_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID de la persona (per_id) debe ser un número entero positivo'),
    (req, res, next) => validateResults(req, res, next),
];

module.exports = { validarPersonaGeriatrico };
