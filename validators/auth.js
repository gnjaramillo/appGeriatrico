const { check } = require('express-validator');
const validateResults = require('../utils/handleValidator');


const validarRegistroPersona = [
    // Validar fecha (YYYY-MM-DD) y que no sea futura
   /*  check("per_fecha")
    .notEmpty()
    .isISO8601()
    .withMessage("La fecha debe estar en formato válido (YYYY-MM-DD).")
    .custom((value) => {
        if (moment(value).isAfter(moment())) {
            throw new Error("La fecha no puede ser futura.");
        }
        return true;
    }), */

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
    
    check("per_documento").exists().notEmpty().isLength({ min: 6, max: 50 }).withMessage("El documento es obligatorio y debe tener entre 6 y 50 caracteres."),
    check("per_nombre_completo").exists().notEmpty().isLength({ min: 3, max: 255 }).withMessage("El nombre completo es obligatorio y debe tener entre 3 y 255 caracteres."),
    check("per_telefono").exists().notEmpty().isLength({ min: 7, max: 15 }).withMessage("El teléfono es obligatorio, debe contener solo números y tener entre 7 y 15 caracteres."),
    check("per_genero").exists().notEmpty().isIn(["M", "F", "O"]).withMessage("El género es obligatorio y debe ser M, F u O."),
    check("per_usuario").exists().notEmpty().isLength({ min: 3, max: 15 }).withMessage("El usuario es obligatorio y debe tener entre 3 y 15 caracteres."),
    check("per_password")
        .exists().isLength({ min: 6, max: 15 }).notEmpty().trim().escape().withMessage("La contraseña debe tener al menos 6 caracteres")
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,}$/).withMessage("La contraseña debe tener una longitud mínima de 6 caracteres y contener al menos una letra y un número"),


    (req, res, next) => {
        return validateResults(req, res, next);
    }

];





const validarLogin = [
    check("per_usuario").notEmpty().withMessage("El usuario es obligatorio."),
    check("per_password")
        .exists().isLength({ min: 6, max: 15 }).notEmpty().trim().escape().withMessage("La contraseña debe tener al menos 6 caracteres")
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,}$/).withMessage("La contraseña debe tener una longitud mínima de 6 caracteres y contener al menos una letra y un número"),
    (req, res, next) => {
       return validateResults(req, res, next)
    }

];

module.exports = {validarRegistroPersona, validarLogin}



