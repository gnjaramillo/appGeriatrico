const { check } = require('express-validator');
const validateResults = require('../utils/handleValidator');




const validarSuperUsuario = [
    check('per_id').isInt({ min: 1 }).exists().withMessage('El ID de la persona (per_id) debe ser un número entero positivo'),
    check('sp_fecha_inicio').isDate().exists().withMessage('La fecha de inicio (sp_fecha_inicio) debe ser una fecha válida'),
    check('sp_fecha_fin').optional({ checkFalsy: true }).isDate().withMessage('La fecha de fin (sp_fecha_fin) debe ser una fecha válida si se proporciona'),
    
    (req, res, next) => validateResults(req, res, next),
];

const validarAdminSede = [
    check('per_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID de la persona (per_id) debe ser un número entero positivo'),
    check('se_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID de la sede (se_id) debe ser un número entero positivo'),
    check('rol_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID del rol (rol_id) debe ser un número entero positivo'),
    check('sp_fecha_inicio').isDate().exists().notEmpty().withMessage('La fecha de inicio (sp_fecha_inicio) debe ser una fecha válida'),
    check('sp_fecha_fin').optional({ checkFalsy: true }).isDate().withMessage('La fecha de fin (sp_fecha_fin) debe ser una fecha válida, si se proporciona'),
        (req, res, next) => validateResults(req, res, next),

];

const validarAsignarRol = [
    check('per_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID de la persona debe ser un número válido'),
    check('rol_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID del rol debe ser un número válido'),
    check('sp_fecha_inicio').isDate().isISO8601().exists().notEmpty().withMessage('La fecha de inicio debe ser una fecha válida'),
    check('sp_fecha_fin').optional({ checkFalsy: true }).isDate().isISO8601().withMessage('La fecha de fin (sp_fecha_fin) debe ser una fecha válida, si se proporciona'),

    (req, res, next) => validateResults(req, res, next),
    
];



const validarRolSeleccionado = [
    check('se_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID de la sede debe ser un número válido'),
    check('rol_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID del rol debe ser un número válido'),

    (req, res, next) => validateResults(req, res, next),
    
];





module.exports = { validarAdminSede, validarSuperUsuario, validarAsignarRol , validarRolSeleccionado};
