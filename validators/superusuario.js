const { check } = require('express-validator');
const validateResults = require('../utils/handleValidator');




const validarSuperUsuario = [
    check('per_id').isInt({ min: 1 }).exists().withMessage('El ID de la persona (per_id) debe ser un número entero positivo'),
    check('sp_fecha_inicio').isDate().exists().withMessage('La fecha de inicio (sp_fecha_inicio) debe ser una fecha válida'),
    check('sp_fecha_fin').optional({ checkFalsy: true }).isDate().withMessage('La fecha de fin (sp_fecha_fin) debe ser una fecha válida si se proporciona'),
    
    (req, res, next) => validateResults(req, res, next),
];

module.exports = { validarSuperUsuario};
