const { check , param} = require('express-validator');
const  validateResult  = require('../utils/handleValidator');
const moment = require("moment-timezone");





const validatorCrearFormulacion = [
    check([
        "admin_fecha_inicio",
        "admin_fecha_fin",
        "admin_cantidad_total",
        "admin_cantidad_dosis",
        "admin_presentacion",
        "admin_hora",
        "admin_metodo"
    ])
        .exists().withMessage("Todos los campos son obligatorios.")
        .notEmpty().withMessage("Los campos no pueden estar vacíos."),
    
    param('pac_id').isInt().exists().notEmpty().withMessage('El ID del paciente debe ser un número entero'),
    
    check("admin_fecha_inicio")
    .custom((value) => {
        if (!moment(value, "YYYY-MM-DD", true).isValid()) {
            throw new Error("La fecha de inicio debe estar en formato YYYY-MM-DD.");
        }

        const today = moment().tz("America/Bogota").startOf("day");
        const inputDate = moment.tz(value, "America/Bogota").startOf("day");

        if (inputDate.isBefore(today)) {
            throw new Error("La fecha de inicio no puede ser una fecha pasada.");
        }

        return true;
    }),

check("admin_fecha_fin")
    .custom((value, { req }) => {
        if (!moment(value, "YYYY-MM-DD", true).isValid()) {
            throw new Error("La fecha de fin debe estar en formato YYYY-MM-DD.");
        }

        const fechaInicio = moment.tz(req.body.admin_fecha_inicio, "America/Bogota").startOf("day");
        const fechaFin = moment.tz(value, "America/Bogota").startOf("day");

        if (fechaFin.isBefore(fechaInicio)) {
            throw new Error("La fecha de fin no puede ser anterior a la fecha de inicio.");
        }

        return true;
    }),
    
    
    
    check("admin_cantidad_total").isFloat({ min: 0.01 }).withMessage("La cantidad total debe ser un número positivo."),
    
    check("admin_cantidad_dosis").isFloat({ min: 0.01 }).withMessage("La cantidad por dosis debe ser un número positivo."),
    
    check("admin_presentacion").isIn(["Tabletas", "Jarabe", "Inyección", "Gotas", "Crema", "Otro"])
        .withMessage("Presentación no válida."),
    
    check("admin_hora").matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("La hora debe estar en formato HH:MM (24 horas)."),
    
    
    check("admin_metodo").isIn(["Oral", "Intravenosa", "Subcutánea", "Tópica", "Inhalación"])
        .withMessage("Método no válido."),

    (req, res, next) => validateResult(req, res, next),
];








module.exports = { validatorCrearFormulacion };


