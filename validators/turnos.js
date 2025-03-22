const { check , param} = require('express-validator');
const  validateResult  = require('../utils/handleValidator');



const turnoValidator = [

    param("enf_id") // Se toma de los parámetros de la URL
        .isInt().withMessage("El ID de la enfermera debe ser un número entero.")
        .toInt(),

    check('tur_fecha_inicio')
        .isDate().exists().notEmpty().withMessage('La fecha de inicio (tur_fecha_inicio) debe ser una fecha válida')
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
        .isDate().exists().notEmpty()
        .withMessage('La fecha de fin (tur_fecha_fin) debe ser una fecha válida')
        .custom((value, { req }) => {
            const fechaInicio = new Date(req.body.tur_fecha_inicio);
            const fechaFin = new Date(value);

            if (fechaFin < fechaInicio) {
                throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
            }
            return true;
        }),



/*  check("tur_hora_inicio").matches(/^(0?[1-9]|1[0-2]) (AM|PM)$/).withMessage("Hora de inicio inválida (Formato esperado: HH AM/PM)."),
    
    check("tur_hora_fin").matches(/^(0?[1-9]|1[0-2]) (AM|PM)$/).withMessage("Hora de fin inválida (Formato esperado: HH AM/PM)."),
 */      

    // horas con minutos.

    check("tur_hora_inicio")
    .matches(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/)
    .withMessage("Hora de inicio inválida (Formato esperado: HH:MM AM/PM)."),

    check("tur_hora_fin")
    .matches(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/)
    .withMessage("Hora de fin inválida (Formato esperado: HH:MM AM/PM)."),
    
/*     check("tur_total_horas")
        .isInt({ min: 1 })
        .withMessage("Las horas deben ser un número entero mayor a 0.")
        .toInt(), */

    check("tur_tipo_turno")
        .isIn(["Diurno", "Nocturno"])
        .withMessage("El tipo de turno debe ser 'Diurno' o 'Nocturno'."),


        (req, res, next) => validateResult(req, res, next),

    ];

const turnoIdValidator = [

    param("tur_id") // Se toma de los parámetros de la URL
        .isInt().withMessage("El ID de la turno debe ser un número entero.")
        .toInt(),


        (req, res, next) => validateResult(req, res, next),

    ];


    module.exports = { turnoValidator, turnoIdValidator };
