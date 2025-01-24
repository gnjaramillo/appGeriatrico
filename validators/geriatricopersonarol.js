const { check } = require('express-validator');
const validateResults = require('../utils/handleValidator');

const validarRolGeriatrico = [
    check('per_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID de la persona (per_id) debe ser un número entero positivo'),
    check('ge_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID geriátrico (ge_id) debe ser un número entero positivo'),
    check('rol_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID del rol (rol_id) debe ser un número entero positivo'),
    check('sp_fecha_inicio').isDate().exists().notEmpty().withMessage('La fecha de inicio (sp_fecha_inicio) debe ser una fecha válida')
        .custom((value) => {
            const today = new Date();
            const inputDate = new Date(value);

            // Comparar si la fecha es anterior a hoy
            if (inputDate < today.setHours(0, 0, 0, 0)) {
                throw new Error('La fecha de inicio no puede ser una fecha pasada');
            }
            return true;
        }),
    check('sp_fecha_fin')
        .optional({ checkFalsy: true })
        .isDate()
        .withMessage('La fecha de fin (sp_fecha_fin) debe ser una fecha válida, si se proporciona')
        .custom((value, { req }) => {
            if (value && new Date(value) < new Date(req.body.sp_fecha_inicio)) {
                throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
            }
            return true;
        }),
    (req, res, next) => validateResults(req, res, next),
];

module.exports = { validarRolGeriatrico };
