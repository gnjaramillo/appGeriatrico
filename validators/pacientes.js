const { check, param } = require('express-validator');
const  validateResult  = require('../utils/handleValidator');

/* const pacienteValidator = [
    check('per_id').isInt().notEmpty().withMessage('El ID de la persona debe ser un número entero.'),
    check('pac_edad').isInt({ min: 0 }).notEmpty().withMessage('La edad debe ser un número entero positivo.'),
    check('pac_peso').isFloat({ min: 0 }).notEmpty().withMessage('El peso debe ser un número positivo.'),
    check('pac_talla').isFloat({ min: 0 }).notEmpty().withMessage('La talla debe ser un número positivo.'),
    check('pac_regimen_eps').isString().notEmpty().isIn(['Subsidiado', 'Contributivo']).withMessage('El régimen EPS es obligatorio, debe ser "Subsidiado" o "Contributivo"'),
    check('pac_nombre_eps').isString().notEmpty().withMessage('El nombre de la EPS es obligatorio.'),
    check('pac_rh_grupo_sanguineo').notEmpty().isIn(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'])
        .withMessage('El grupo sanguíneo no es válido.'),
    check('pac_talla_camisa').isString().isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL']).notEmpty().withMessage('La talla de camisa es obligatoria.'),
    check('pac_talla_pantalon').isString().notEmpty().withMessage('La talla de pantalón es obligatoria.'),

    (req, res, next) => validateResult(req, res, next),

]; */



const pacienteValidator = [
    check('per_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID de la persona debe ser un número válido'),
    check('rol_id').isInt({ min: 1 }).exists().notEmpty().withMessage('El ID del rol debe ser un número válido'),
    check('sp_fecha_inicio').isDate().exists().notEmpty().withMessage('La fecha de inicio (sp_fecha_inicio) debe ser una fecha válida')
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
    check('sp_fecha_fin')
        .optional({ checkFalsy: true })
        .isDate()
        .withMessage('La fecha de fin (sp_fecha_fin) debe ser una fecha válida, si se proporciona')
        .custom((value, { req }) => {
            if (value && new Date(value) < new Date(req.body.sp_fecha_inicio)) {
                throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
            }
            return true;
        }),

    check('pac_edad').isInt({ min: 0 }).notEmpty().withMessage('La edad debe ser un número entero positivo.'),
    check('pac_peso').isFloat({ min: 0 }).notEmpty().withMessage('El peso debe ser un número positivo.'),
    check('pac_talla').isFloat({ min: 0 }).notEmpty().withMessage('La talla debe ser un número positivo.'),
    check('pac_regimen_eps').isString().notEmpty().isIn(['Subsidiado', 'Contributivo']).withMessage('El régimen EPS es obligatorio, debe ser "Subsidiado" o "Contributivo"'),
    check('pac_nombre_eps').isString().notEmpty().withMessage('El nombre de la EPS es obligatorio.'),
    check('pac_rh_grupo_sanguineo').notEmpty().isIn(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'])
        .withMessage('El grupo sanguíneo no es válido.'),
    check('pac_talla_camisa').isString().isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL']).notEmpty().withMessage('La talla de camisa es obligatoria.'),
    check('pac_talla_pantalon').isString().notEmpty().withMessage('La talla de pantalón es obligatoria.'),


    

    (req, res, next) => validateResult(req, res, next),
    
];



const pacienteUpdateValidator = [
    param('per_id').isInt().notEmpty().withMessage('El ID de la persona debe ser un número entero.'),
    check('pac_edad').optional().notEmpty().isInt({ min: 0 }).withMessage('La edad debe ser un número entero positivo.'),
    check('pac_peso').optional().notEmpty().isFloat({ min: 0 }).withMessage('El peso debe ser un número positivo.'),
    check('pac_talla').optional().notEmpty().isFloat({ min: 0 }).withMessage('La talla debe ser un número positivo.'),
    check('pac_regimen_eps').optional().isString().isIn(['Subsidiado', 'Contributivo']).notEmpty().withMessage('El régimen EPS es obligatorio, debe ser "Subsidiado" o "Contributivo".'),
    check('pac_nombre_eps').optional().isString().notEmpty().withMessage('El nombre de la EPS es obligatorio.'),
    check('pac_rh_grupo_sanguineo').optional().notEmpty().isIn(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'])
        .withMessage('El grupo sanguíneo no es válido.'),
    check('pac_talla_camisa').optional().isString().isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL']).notEmpty().withMessage('La talla de camisa es obligatoria.'),
    check('pac_talla_pantalon').optional().isString().notEmpty().withMessage('La talla de pantalón es obligatoria.'),

    (req, res, next) => validateResult(req, res, next),

];

module.exports = {pacienteValidator, pacienteUpdateValidator};
