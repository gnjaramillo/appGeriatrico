const { check, body } = require('express-validator');
const validateResults = require('../utils/handleValidator');






const validarAdminSede = [
    check('per_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID de la persona (per_id) debe ser un número entero positivo'),
    check('se_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID de la sede (se_id) debe ser un número entero positivo'),
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

const validarAsignarRol = [
    check('per_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID de la persona debe ser un número válido'),
    check('rol_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID del rol debe ser un número válido'),
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

module.exports = { validarRolSeleccionado };






module.exports = { validarAdminSede, validarAsignarRol , validarRolSeleccionado};
