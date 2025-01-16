const { check } = require('express-validator');
const validateResults = require('../utils/handleValidator');


const validarRegistroPersona = [
    // check("per_fecha").optional().isDate().withMessage("La fecha debe ser válida."),
    check("per_correo").exists().notEmpty().isEmail().normalizeEmail().withMessage("El correo electrónico no es válido")
    .custom(value => {
        // Verificar que el correo electrónico tenga el formato correcto
        const atSymbolIndex = value.indexOf('@');
        if (atSymbolIndex === -1 || atSymbolIndex === 0 || atSymbolIndex === value.length - 1) {
            throw new Error('El correo electrónico debe contener un símbolo @ y un dominio válido.');
        }
        return true;
    }),
    
    check("per_documento").notEmpty().isLength({ min: 6, max: 50 }).withMessage("El documento es obligatorio y debe tener entre 6 y 50 caracteres."),
    check("per_nombre_completo").notEmpty().isLength({ min: 3, max: 255 }).withMessage("El nombre completo es obligatorio y debe tener entre 3 y 255 caracteres."),
    check("per_telefono").notEmpty().isLength({ min: 7, max: 15 }).withMessage("El teléfono es obligatorio, debe contener solo números y tener entre 7 y 15 caracteres."),
    check("per_genero").notEmpty().isIn(["M", "F", "O"]).withMessage("El género es obligatorio y debe ser M, F u O."),
    check("per_usuario").notEmpty().isLength({ min: 3, max: 15 }).withMessage("El usuario es obligatorio y debe tener entre 3 y 255 caracteres."),
    check("per_password").notEmpty().isLength({ min: 6, max: 15 }).isAlphanumeric().withMessage("La contraseña debe ser alfanumérica."),


    (req, res, next) => {
        return validateResults(req, res, next);
    }

];





const validarLogin = [
    check("per_usuario").notEmpty().withMessage("El usuario es obligatorio."),
    check("per_password").notEmpty().isLength({ min: 6, max: 15 }).isAlphanumeric().withMessage("La contraseña debe ser alfanumérica, obligatoria y tener entre 6 y 15 caracteres."),
    (req, res, next) => {
       return validateResults(req, res, next)
    }

];

module.exports = {validarRegistroPersona, validarLogin}



