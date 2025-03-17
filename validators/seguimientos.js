const moment = require("moment-timezone");
const { check, param } = require('express-validator');
const  validateResult  = require('../utils/handleValidator');




const validarSeguimientos = [
    param("pac_id")
        .isInt({ min: 1 })
        .withMessage("El ID del paciente debe ser un número entero positivo."),


    check("seg_fecha").notEmpty().withMessage("La fecha es obligatoria.")
    .custom((value) => {
        const fechaIngresada = moment.tz(value, "DD/MM/YYYY", true, "America/Bogota").startOf("day");
        const fechaHoy = moment().tz("America/Bogota").startOf("day");

        if (!fechaIngresada.isValid()) {
            throw new Error("Fecha inválida. Usa el formato DD/MM/YYYY.");
        }
        if (!fechaIngresada.isSame(fechaHoy, "day")) {
            throw new Error("Solo puedes registrar un seguimiento con la fecha de hoy.");
        }
        return true;
    })
    .customSanitizer((value) => {
        return value
            ? moment.tz(value, "DD/MM/YYYY", true, "America/Bogota").format("YYYY-MM-DD HH:mm:ss")
            : moment().tz("America/Bogota").format("YYYY-MM-DD HH:mm:ss");
    }),

        

    // Validar presión arterial (opcional, pero si está presente debe tener formato correcto)
    check("seg_pa")
        .optional()
        .matches(/^\d{2,3}\/\d{2,3}$/)
        .withMessage("La presión arterial debe estar en formato 120/80."),

    // Validar talla (0.5m a 2.5m)
    check("seg_talla")
        .optional()
        .isFloat({ min: 0.5, max: 2.5 })
        .withMessage("La talla debe estar entre 0.5 y 2.5 metros."),

    // Frecuencia respiratoria (10-50 resp/min)
    check("seg_fr")
        .optional()
        .isInt({ min: 10, max: 50 })
        .withMessage("La frecuencia respiratoria debe estar entre 10 y 50."),

    // Validar peso (1kg - 500kg)
    check("seg_peso")
        .optional()
        .isFloat({ min: 1, max: 500 })
        .withMessage("El peso debe estar entre 1 y 500 kg."),

    // Validar temperatura corporal (30°C - 45°C)
    check("seg_temp")
        .optional()
        .isFloat({ min: 30, max: 45 })
        .withMessage("La temperatura debe estar entre 30°C y 45°C."),

    // Frecuencia cardíaca (30-200 latidos/min)
    check("seg_fc")
        .optional()
        .isInt({ min: 30, max: 200 })
        .withMessage("La frecuencia cardíaca debe estar entre 30 y 200 latidos/min."),

    // Glicemia (40-600 mg/dL)
    check("seg_glicemia")
        .optional()
        .isFloat({ min: 40, max: 600 })
        .withMessage("La glicemia debe estar entre 40 y 600 mg/dL."),

    // Validar "otro" como texto opcional con `trim()`
    check("otro")
        .optional()
        .trim()
        .isString()
        .withMessage("El campo 'otro' debe ser un texto válido."),

    (req, res, next) => validateResult(req, res, next),
];



const validarPacId = [
    param('pac_id').isInt().withMessage('El ID del paciente debe ser un número entero'),

    (req, res, next) => validateResult(req, res, next),

];

const validarSegId = [
    param('seg_id').isInt().withMessage('El ID del seguimiento debe ser un número entero'),

    (req, res, next) => validateResult(req, res, next),

];


const validarUpdateSeguimiento = [
    param("seg_id")
        .isInt({ min: 1 })
        .withMessage("El ID del seguimiento debe ser un número entero positivo."),


    // Validar presión arterial (opcional, pero si está presente debe tener formato correcto)
    check("seg_pa")
        .optional()
        .matches(/^\d{2,3}\/\d{2,3}$/)
        .withMessage("La presión arterial debe estar en formato 120/80."),

    // Validar talla (0.5m a 2.5m)
    check("seg_talla")
        .optional()
        .isFloat({ min: 0.5, max: 2.5 })
        .withMessage("La talla debe estar entre 0.5 y 2.5 metros."),

    // Frecuencia respiratoria (10-50 resp/min)
    check("seg_fr")
        .optional()
        .isInt({ min: 10, max: 50 })
        .withMessage("La frecuencia respiratoria debe estar entre 10 y 50."),

    // Validar peso (1kg - 500kg)
    check("seg_peso")
        .optional()
        .isFloat({ min: 1, max: 500 })
        .withMessage("El peso debe estar entre 1 y 500 kg."),

    // Validar temperatura corporal (30°C - 45°C)
    check("seg_temp")
        .optional()
        .isFloat({ min: 30, max: 45 })
        .withMessage("La temperatura debe estar entre 30°C y 45°C."),

    // Frecuencia cardíaca (30-200 latidos/min)
    check("seg_fc")
        .optional()
        .isInt({ min: 30, max: 200 })
        .withMessage("La frecuencia cardíaca debe estar entre 30 y 200 latidos/min."),

    // Glicemia (40-600 mg/dL)
    check("seg_glicemia")
        .optional()
        .isFloat({ min: 40, max: 600 })
        .withMessage("La glicemia debe estar entre 40 y 600 mg/dL."),

    // Validar "otro" como texto opcional con `trim()`
    check("otro")
        .optional()
        .trim()
        .isString()
        .withMessage("El campo 'otro' debe ser un texto válido."),

    (req, res, next) => validateResult(req, res, next),
];


module.exports = { validarSeguimientos, validarPacId,validarSegId, validarUpdateSeguimiento };

