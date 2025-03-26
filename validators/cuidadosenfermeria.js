const { check, param } = require('express-validator');
const  validateResult  = require('../utils/handleValidator');




const validarCuidadosEnfermeria = [
    param('pac_id').isInt().exists().notEmpty().withMessage('El ID del paciente debe ser un número entero'),
     check('cue_fecha_inicio').isDate().exists().notEmpty().withMessage('La fecha de inicio (cue_fecha_inicio) debe ser una fecha válida')
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


    check('cue_fecha_fin')
        .optional({ checkFalsy: true })
        .isDate()
        .withMessage('La fecha de fin (cue_fecha_fin) debe ser una fecha válida, si se proporciona')
        .custom((value, { req }) => {
            if (value && new Date(value) < new Date(req.body.cue_fecha_inicio)) {
                throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
            }
            return true;
        }),
    
    check("cue_bano").isIn(["CAMA", "DUCHA"]).exists().notEmpty().withMessage("El baño debe ser 'CAMA' o 'DUCHA'."),
    
    // Validaciones para los valores S/N
    check([
        "cue_pa_m", "cue_pa_t", "cue_pa_n",
        "cue_fc_m", "cue_fc_t", "cue_fc_n",
        "cue_fr_m", "cue_fr_t", "cue_fr_n",
        "cue_t_m", "cue_t_t", "cue_t_n",
        "cue_control_glicemia",
        "cue_control_posicion_m", "cue_control_posicion_t", "cue_control_posicion_n",
        "cue_curaciones",
        "cue_liq_administrados", "cue_liq_eliminados",
        "cue_med_m", "cue_med_t", "cue_med_n"
    ]).isIn(["S", "N"]).exists().notEmpty().withMessage("El valor debe ser 'S' o 'N'."),

    // Validaciones para ENUM con más opciones
    check("cue_control_peso")
        .isIn(["mañana", "tarde", "noche", "no aplica"]).exists().notEmpty()
        .withMessage("El control de peso debe ser 'mañana', 'tarde', 'noche' o 'no aplica'."),
    
    check("cue_control_talla").exists().notEmpty()
        .isIn(["mañana", "tarde", "noche", "no aplica"])
        .withMessage("El control de talla debe ser 'mañana', 'tarde', 'noche' o 'no aplica'."),

    // Validaciones para texto opcional
    check("cue_sitio_cura").optional({ nullable: true }).isString().withMessage("El sitio de curación debe ser un texto."),
    check("cue_liq_administrados_detalle").optional({ nullable: true }).isString().withMessage("El detalle de líquidos administrados debe ser un texto."),
    check("cue_liq_eliminados_detalle").optional({ nullable: true }).isString().withMessage("El detalle de líquidos eliminados debe ser un texto."),
    check("otros_cuidados").optional({ nullable: true }).isString().withMessage("Otros cuidados debe ser un texto."),

    (req, res, next) => validateResult(req, res, next),

];


const validarUpdateCuidadosEnfermeria = [
    param('pac_id').isInt().exists().notEmpty().withMessage('El ID del paciente debe ser un número entero'),
     check('cue_fecha_inicio').isDate().optional().notEmpty().withMessage('La fecha de inicio (cue_fecha_inicio) debe ser una fecha válida')
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


    check('cue_fecha_fin')
        .optional({ checkFalsy: true }).notEmpty()
        .isDate()
        .withMessage('La fecha de fin (cue_fecha_fin) debe ser una fecha válida, si se proporciona')
        .custom((value, { req }) => {
            if (value && new Date(value) < new Date(req.body.cue_fecha_inicio)) {
                throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
            }
            return true;
        }),
    
    check("cue_bano").isIn(["CAMA", "DUCHA"]).optional().notEmpty().withMessage("El baño debe ser 'CAMA' o 'DUCHA'."),
    
    // Validaciones para los valores S/N
    check([
        "cue_pa_m", "cue_pa_t", "cue_pa_n",
        "cue_fc_m", "cue_fc_t", "cue_fc_n",
        "cue_fr_m", "cue_fr_t", "cue_fr_n",
        "cue_t_m", "cue_t_t", "cue_t_n",
        "cue_control_glicemia",
        "cue_control_posicion_m", "cue_control_posicion_t", "cue_control_posicion_n",
        "cue_curaciones",
        "cue_liq_administrados", "cue_liq_eliminados",
        "cue_med_m", "cue_med_t", "cue_med_n"
    ]).isIn(["S", "N"]).optional().notEmpty().withMessage("El valor debe ser 'S' o 'N'."),

    // Validaciones para ENUM con más opciones
    check("cue_control_peso").optional().notEmpty()
        .isIn(["mañana", "tarde", "noche", "no aplica"])
        .withMessage("El control de peso debe ser 'mañana', 'tarde', 'noche' o 'no aplica'."),
    
    check("cue_control_talla").optional().notEmpty()
        .isIn(["mañana", "tarde", "noche", "no aplica"])
        .withMessage("El control de talla debe ser 'mañana', 'tarde', 'noche' o 'no aplica'."),

    // Validaciones para texto opcional
    check("cue_sitio_cura").optional({ nullable: true }).isString().withMessage("El sitio de curación debe ser un texto."),
    check("cue_liq_administrados_detalle").optional({ nullable: true }).isString().withMessage("El detalle de líquidos administrados debe ser un texto."),
    check("cue_liq_eliminados_detalle").optional({ nullable: true }).isString().withMessage("El detalle de líquidos eliminados debe ser un texto."),
    check("otros_cuidados").optional({ nullable: true }).isString().withMessage("Otros cuidados debe ser un texto."),

    (req, res, next) => validateResult(req, res, next),

];

const validarPacId = [
    param('pac_id').isInt().withMessage('El ID del paciente debe ser un número entero'),

    (req, res, next) => validateResult(req, res, next),

];



module.exports = { validarCuidadosEnfermeria, validarUpdateCuidadosEnfermeria, validarPacId };
