const { check, param } = require('express-validator');
const validateResults = require('../utils/handleValidator');


const validarUpdatePersona = [
    // check("per_fecha").optional().isDate().withMessage("La fecha debe ser válida."),
    param('per_id').exists().isInt().withMessage('El ID de la persona debe ser un número válido'),
    check("per_correo").optional().notEmpty().isEmail().normalizeEmail().withMessage("El correo electrónico no es válido")
    .custom(value => {
        // Verificar que el correo electrónico tenga el formato correcto
        const atSymbolIndex = value.indexOf('@');
        if (atSymbolIndex === -1 || atSymbolIndex === 0 || atSymbolIndex === value.length - 1) {
            throw new Error('El correo electrónico debe contener un símbolo @ y un dominio válido.');
        }
        return true;
    }),
    
    check("per_documento").optional().notEmpty().isLength({ min: 6, max: 50 }).withMessage("El documento es obligatorio y debe tener entre 6 y 50 caracteres."),
    check("per_nombre_completo").optional().notEmpty().isLength({ min: 3, max: 255 }).withMessage("El nombre completo es obligatorio y debe tener entre 3 y 255 caracteres."),
    check("per_telefono").optional().notEmpty().isLength({ min: 7, max: 15 }).withMessage("El teléfono es obligatorio, debe contener solo números y tener entre 7 y 15 caracteres."),
    check("per_genero").optional().notEmpty().isIn(["M", "F", "O"]).withMessage("El género es obligatorio y debe ser M, F u O."),
    // check("per_usuario").optional().notEmpty().isLength({ min: 3, max: 15 }).withMessage("El usuario es obligatorio y debe tener entre 3 y 255 caracteres."),
    // check("per_password").optional().notEmpty().isLength({ min: 6, max: 15 }).isAlphanumeric().withMessage("La contraseña debe ser alfanumérica."),


    (req, res, next) => {
        return validateResults(req, res, next);
    }

];


const validarUpdatePerfil = [
    check("per_correo").optional().notEmpty().isEmail().normalizeEmail().withMessage("El correo electrónico no es válido")
    .custom(value => {
        // Verificar que el correo electrónico tenga el formato correcto
        const atSymbolIndex = value.indexOf('@');
        if (atSymbolIndex === -1 || atSymbolIndex === 0 || atSymbolIndex === value.length - 1) {
            throw new Error('El correo electrónico debe contener un símbolo @ y un dominio válido.');
        }
        return true;
    }),    
    check("per_telefono").optional().notEmpty().isLength({ min: 7, max: 15 }).withMessage("El teléfono es obligatorio, debe contener solo números y tener entre 7 y 15 caracteres."),
    check("per_usuario").optional().notEmpty().isLength({ min: 3, max: 15 }).withMessage("El usuario es obligatorio y debe tener entre 3 y 255 caracteres."),
    check("per_password").optional().notEmpty().isLength({ min: 6, max: 15 }).isAlphanumeric().withMessage("La contraseña debe ser alfanumérica."),


    (req, res, next) => {
        return validateResults(req, res, next);
    }

];





module.exports = { validarUpdatePersona, validarUpdatePerfil };
