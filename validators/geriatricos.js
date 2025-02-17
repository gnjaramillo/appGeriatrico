const { check, param } = require('express-validator');
const validateResults = require('../utils/handleValidator');

const validatorCrearGeriatrico = [
    
    check('ge_nombre').exists().notEmpty().isLength({ min: 3, max: 255 }),
    check('ge_nit').exists().notEmpty().isLength({ min: 5, max: 50 }),
    check('ge_color_principal').exists().notEmpty().isLength({ min: 3, max: 30 }),
    check('ge_color_secundario').exists().notEmpty().isLength({ min: 3, max: 30 }),
    check('ge_color_terciario').exists().notEmpty().isLength({ min: 3, max: 30 }),
    (req, res, next) => {
        return validateResults(req, res, next);
    },
];

const validatorIdGeriatrico = [
    check('ge_id').exists().isInt().withMessage('El ID del geriátrico debe ser un número válido'),
    (req, res, next) => {
        return validateResults(req, res, next);
    },
];

const validatorActualizarGeriatrico = [
    check('ge_id').exists().isInt().withMessage('El ID del geriátrico debe ser un número válido'),
    check('ge_nombre').optional().isLength({ min: 3, max: 255 }),
    check('ge_nit').optional().isLength({ min: 5, max: 50 }),
    check('ge_color_principal').optional().isLength({ min: 3, max: 30 }),
    check('ge_color_secundario').optional().isLength({ min: 3, max: 30 }),
    check('ge_color_terciario').optional().isLength({ min: 3, max: 30 }),
    (req, res, next) => {
        return validateResults(req, res, next);
    },
];







module.exports = { 
    validatorCrearGeriatrico, 
    validatorIdGeriatrico, 
    validatorActualizarGeriatrico 
};
