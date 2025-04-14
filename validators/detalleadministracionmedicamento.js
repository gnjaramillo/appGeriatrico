const { check , param} = require('express-validator');
const  validateResult  = require('../utils/handleValidator');

const validatorRegistrarAdminMedicamento = [

    param("admin_id")
    .exists().withMessage("El ID de la formula es requerido.")
    .isInt({ min: 1 }).withMessage("El ID de la formula debe ser un número entero positivo."),

    check("origen_inventario")
    .exists().withMessage("El campo 'origen_inventario' es obligatorio")
    .isIn(["sede", "paciente"]).withMessage("El campo 'origen_inventario' debe ser 'sede' o 'paciente'"),

    check("detalle_hora")
    .exists().withMessage("El campo 'detalle_hora' es obligatorio")
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage("El formato de 'detalle_hora' debe ser HH:MM en 24 horas"),

    check("detalle_observaciones")
    .optional()
    .isString().withMessage("Las observaciones deben ser texto"),

    (req, res, next) => validateResult(req, res, next),

];


const validatorAdminId = [

    param("admin_id")
    .exists().withMessage("El ID de la formula es requerido.")
    .isInt({ min: 1 }).withMessage("El ID de la formula debe ser un número entero positivo."),


    (req, res, next) => validateResult(req, res, next),

];

module.exports = { validatorRegistrarAdminMedicamento, validatorAdminId };
