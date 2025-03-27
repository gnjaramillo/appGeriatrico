const { check, param } = require('express-validator');
const  validateResult  = require('../utils/handleValidator');




const validarDiagnostico = [
    param('pac_id').isInt().exists().notEmpty().withMessage('El ID del paciente debe ser un número entero'),

    check('diag_fecha').isDate().exists().notEmpty().withMessage('La fecha debe ser una fecha válida')
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

    check('diag_descripcion')
        .exists().notEmpty().withMessage('La descripción del diagnóstico es obligatoria')
        .isString().withMessage('La descripción debe ser un texto'),

    (req, res, next) => validateResult(req, res, next),
];




const validarUpdateDiagnostico = [
    param('pac_id').isInt().exists().notEmpty().withMessage('El ID del paciente debe ser un número entero'),

    check('diag_fecha').isDate().optional().notEmpty().withMessage('La fecha debe ser una fecha válida')
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

    check('diag_descripcion')
        .optional().notEmpty().withMessage('La descripción del diagnóstico es obligatoria')
        .isString().withMessage('La descripción debe ser un texto'),

    (req, res, next) => validateResult(req, res, next),
];




const validarPacId = [
    param('pac_id').isInt().withMessage('El ID del paciente debe ser un número entero'),

    (req, res, next) => validateResult(req, res, next),

];



module.exports = { validarDiagnostico,  validarUpdateDiagnostico, validarPacId };
