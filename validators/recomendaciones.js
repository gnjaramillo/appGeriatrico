const { check, param } = require('express-validator');
const  validateResult  = require('../utils/handleValidator');




const validarRecomendaciones = [
    param('pac_id').isInt().exists().notEmpty().withMessage('El ID del paciente debe ser un número entero'),
    check('rec_fecha').isDate().exists().notEmpty().withMessage('La fecha debe ser una fecha válida')
    .custom((value) => {
        const now = new Date();
        const localToday = new Date(now.toLocaleDateString("en-CA", { timeZone: "America/Bogota" })); 
        const inputDate = new Date(value);
    
        // Formatear ambas fechas a 'YYYY-MM-DD'
        const formattedToday = localToday.toISOString().split('T')[0];
        const formattedInputDate = inputDate.toISOString().split('T')[0];
    
        //console.log("Fecha actual en Colombia:", formattedToday);
        //console.log("Fecha ingresada:", formattedInputDate);
    
        if (formattedInputDate < formattedToday) {
            throw new Error('La fecha de inicio no puede ser una fecha pasada');
        }
        return true;
    }),



    check([
        'rec_cubrir_piel_m', 'rec_cubrir_piel_t', 'rec_cubrir_piel_n',
        'rec_asistir_alimentacion_m', 'rec_asistir_alimentacion_t', 'rec_asistir_alimentacion_n',
        'rec_prevenir_caidas', 'rec_actividad_ocupacional', 'rec_actividad_fisica'
    ]).isIn(['S', 'N']).exists().notEmpty().withMessage("El valor debe ser 'S' o 'N'."),

    check('rec_otras')
        .optional({ nullable: true })
        .isString()
        .withMessage('Las otras recomendaciones deben ser un texto.'),

    (req, res, next) => validateResult(req, res, next),

];



const validarUpdateRecomendaciones = [
    param('pac_id').isInt().exists().notEmpty().withMessage('El ID del paciente debe ser un número entero'),
    check('rec_fecha').isDate().optional().notEmpty().withMessage('La fecha debe ser una fecha válida')
    .custom((value) => {
        const now = new Date();
        const localToday = new Date(now.toLocaleDateString("en-CA", { timeZone: "America/Bogota" })); 
        const inputDate = new Date(value);
    
        // Formatear ambas fechas a 'YYYY-MM-DD'
        const formattedToday = localToday.toISOString().split('T')[0];
        const formattedInputDate = inputDate.toISOString().split('T')[0];
    
        //console.log("Fecha actual en Colombia:", formattedToday);
        //console.log("Fecha ingresada:", formattedInputDate);
    
        if (formattedInputDate < formattedToday) {
            throw new Error('La fecha de inicio no puede ser una fecha pasada');
        }
        return true;
    }),



    check([
        'rec_cubrir_piel_m', 'rec_cubrir_piel_t', 'rec_cubrir_piel_n',
        'rec_asistir_alimentacion_m', 'rec_asistir_alimentacion_t', 'rec_asistir_alimentacion_n',
        'rec_prevenir_caidas', 'rec_actividad_ocupacional', 'rec_actividad_fisica'
    ]).isIn(['S', 'N']).optional().notEmpty().withMessage("El valor debe ser 'S' o 'N'."),

    check('rec_otras')
        .optional({ nullable: true })
        .isString()
        .withMessage('Las otras recomendaciones deben ser un texto.'),

    (req, res, next) => validateResult(req, res, next),

];





const validarPacId = [
    param('pac_id').isInt().withMessage('El ID del paciente debe ser un número entero'),

    (req, res, next) => validateResult(req, res, next),

];



module.exports = { validarRecomendaciones, validarUpdateRecomendaciones, validarPacId };
