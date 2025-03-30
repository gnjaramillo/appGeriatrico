const { check , param} = require('express-validator');
const  validateResult  = require('../utils/handleValidator');
const moment = require("moment-timezone");




const validatorCrearMedicamento = [
    // ✅ Validar que el nombre del medicamento exista y no esté vacío
    check("med_nombre")
        .exists().withMessage("El nombre del medicamento es requerido.")
        .notEmpty().withMessage("El nombre del medicamento no puede estar vacío.")
        .isString().withMessage("El nombre del medicamento debe ser un texto.")
        .trim(),

    // ✅ Validar que la cantidad del medicamento sea un número entero positivo
    check("med_cantidad")
        .exists().withMessage("La cantidad de medicamentos es requerida.")
        .notEmpty().withMessage("La cantidad de medicamentos no puede estar vacía.")
        .isInt({ min: 1 }).withMessage("La cantidad debe ser un número entero positivo.")
        .toInt(),

    // ✅ Validar la presentación del medicamento
    check("med_presentacion")
        .exists().withMessage("La presentación del medicamento es requerida.")
        .notEmpty().withMessage("La presentación del medicamento no puede estar vacía.")
        .isString().withMessage("La presentación del medicamento debe ser un texto.")
        .trim(),

    // ✅ Validar que las unidades por presentación sean un número entero positivo
    check("unidades_por_presentacion")
        .exists().withMessage("Las unidades por presentación son requeridas.")
        .notEmpty().withMessage("Las unidades por presentación no pueden estar vacías.")
        .isInt({ min: 1 }).withMessage("Las unidades por presentación deben ser un número entero positivo.")
        .toInt(),

    // ✅ Validar que la descripción, si se envía, sea un texto válido (opcional)
    check("med_descripcion")
        .optional()
        .isString().withMessage("La descripción debe ser un texto.")
        .trim(),




    (req, res, next) => validateResult(req, res, next),
];

module.exports = { validatorCrearMedicamento };


