const { check , param} = require('express-validator');
const  validateResult  = require('../utils/handleValidator');
const moment = require("moment-timezone");



const turnoValidator = [

    param("enf_id").exists().notEmpty() // Se toma de los parámetros de la URL
        .isInt().withMessage("El ID de la enfermera debe ser un número entero.")
        .toInt(),



     // ✅ Validación de la fecha de inicio con zona horaria de Colombia
    check("tur_fecha_inicio")
        .exists().notEmpty().withMessage("La fecha de inicio (tur_fecha_inicio) es requerida.")
        .custom((value) => {
            if (!moment(value, "YYYY-MM-DD", true).isValid()) {
                throw new Error("La fecha de inicio debe ser una fecha válida en formato YYYY-MM-DD.");
            }

            const today = moment().tz("America/Bogota").startOf("day");
            const inputDate = moment.tz(value, "America/Bogota").startOf("day");

            if (inputDate.isBefore(today)) {
                throw new Error("La fecha de inicio no puede ser una fecha pasada.");
            }

            return true;
        }),



    // ✅ Validación de la fecha de fin con zona horaria de Colombia
    check("tur_fecha_fin")
        .exists().notEmpty().withMessage("La fecha de fin (tur_fecha_fin) es requerida.")
        .custom((value, { req }) => {
            if (!moment(value, "YYYY-MM-DD", true).isValid()) {
                throw new Error("La fecha de fin debe ser una fecha válida en formato YYYY-MM-DD.");
            }

            const fechaInicio = moment.tz(req.body.tur_fecha_inicio, "America/Bogota").startOf("day");
            const fechaFin = moment.tz(value, "America/Bogota").startOf("day");

            if (fechaFin.isBefore(fechaInicio)) {
                throw new Error("La fecha de fin no puede ser anterior a la fecha de inicio.");
            }

            return true;
        }),



    // horas con minutos...
    check("tur_hora_inicio").exists().notEmpty()
    .matches(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/)
    .withMessage("Hora de inicio inválida (Formato esperado: HH:MM AM/PM)."), 


    check("tur_hora_fin").exists().notEmpty()
    .matches(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/)
    .withMessage("Hora fin del turno inválida (Formato esperado: HH:MM AM/PM)."), 

    
/*     check("tur_tipo_turno").exists().notEmpty()
        .isIn(["Diurno", "Nocturno"])
        .withMessage("El tipo de turno debe ser 'Diurno' o 'Nocturno'."),
 */

        (req, res, next) => validateResult(req, res, next),

];



const turnoUpdateValidator = [

    param("tur_id").exists().notEmpty() // Se toma de los parámetros de la URL
        .isInt().withMessage("El ID del turno debe ser un número entero.")
        .toInt(),


/*     check('tur_fecha_inicio')
        .isDate().optional().notEmpty().withMessage('La fecha de inicio (tur_fecha_inicio) debe ser una fecha válida')
        .custom((value) => {
            const now = new Date();
            const localToday = new Date(now.toLocaleDateString("en-CA", { timeZone: "America/Bogota" })); 
            const inputDate = new Date(value);
        
            // Formatear ambas fechas a 'YYYY-MM-DD'
            const formattedToday = localToday.toISOString().split('T')[0];
            const formattedInputDate = inputDate.toISOString().split('T')[0];
        
            if (formattedInputDate < formattedToday) {
                throw new Error('La fecha de inicio no puede ser una fecha pasada');
            }
            return true;
        }),


    check('tur_fecha_fin')
        .isDate().optional().notEmpty()
        .withMessage('La fecha de fin (tur_fecha_fin) debe ser una fecha válida')
        .custom((value, { req }) => {
            const fechaInicio = new Date(req.body.tur_fecha_inicio);
            const fechaFin = new Date(value);

            if (fechaFin < fechaInicio) {
                throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
            }
            return true;
        }),
 */



 // ✅ Validación de la fecha de inicio con zona horaria de Colombia
    check("tur_fecha_inicio")
        .optional().notEmpty().withMessage("La fecha de inicio (tur_fecha_inicio) es requerida.")
        .custom((value) => {
            if (!moment(value, "YYYY-MM-DD", true).isValid()) {
                throw new Error("La fecha de inicio debe ser una fecha válida en formato YYYY-MM-DD.");
            }

            const today = moment().tz("America/Bogota").startOf("day");
            const inputDate = moment.tz(value, "America/Bogota").startOf("day");

            if (inputDate.isBefore(today)) {
                throw new Error("La fecha de inicio no puede ser una fecha pasada.");
            }

            return true;
        }),

    // ✅ Validación de la fecha de fin con zona horaria de Colombia
    check("tur_fecha_fin")
        .optional().notEmpty().withMessage("La fecha de fin (tur_fecha_fin) es requerida.")
        .custom((value, { req }) => {
            if (!moment(value, "YYYY-MM-DD", true).isValid()) {
                throw new Error("La fecha de fin debe ser una fecha válida en formato YYYY-MM-DD.");
            }

            const fechaInicio = moment.tz(req.body.tur_fecha_inicio, "America/Bogota").startOf("day");
            const fechaFin = moment.tz(value, "America/Bogota").startOf("day");

            if (fechaFin.isBefore(fechaInicio)) {
                throw new Error("La fecha de fin no puede ser anterior a la fecha de inicio.");
            }

            return true;
        }),


    // horas con minutos.
    check("tur_hora_inicio").optional().notEmpty()
    .matches(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/)
    .withMessage("Hora de inicio inválida (Formato esperado: HH:MM AM/PM)."),


    check("tur_hora_fin").optional().notEmpty()
    .matches(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/)
    .withMessage("Hora fin del turno inválida (Formato esperado: HH:MM AM/PM)."), 

    
/*     check("tur_tipo_turno").optional().notEmpty()
    .isIn(["Diurno", "Nocturno"])
    .withMessage("El tipo de turno debe ser 'Diurno' o 'Nocturno'."),

 */
        (req, res, next) => validateResult(req, res, next),

];



const turnoIdValidator = [

    param("tur_id") // Se toma de los parámetros de la URL
        .isInt().withMessage("El ID de la turno debe ser un número entero.")
        .toInt(),


        (req, res, next) => validateResult(req, res, next),

];

const turnoEnfIdValidator = [

    param("enf_id") // Se toma de los parámetros de la URL
        .isInt().withMessage("El ID de la enfermera debe ser un número entero.")
        .toInt(),


        (req, res, next) => validateResult(req, res, next),

];








module.exports = { turnoValidator,turnoUpdateValidator, turnoIdValidator, turnoEnfIdValidator };
