const { check , param} = require('express-validator');
const  validateResult  = require('../utils/handleValidator');
const moment = require("moment-timezone");





const validatorCrearMedicamento = [
    check("med_nombre").exists().notEmpty().isString().trim()
        .withMessage("El nombre del medicamento es requerido y debe ser un texto."),
    
    
    check("med_presentacion").exists().notEmpty().isString().trim()
        .withMessage("La presentación del medicamento es requerida y debe ser un texto."),
    
    check("unidades_por_presentacion").exists().notEmpty().isInt({ min: 1 }).toInt()
        .withMessage("Las unidades por presentación deben ser un número entero positivo."),
    
    check("med_descripcion").optional().isString().trim()
        .withMessage("La descripción debe ser un texto."),
    
    (req, res, next) => validateResult(req, res, next),
];



const validatorStockMedicamento = [

    // ✅ Validar que la cantidad del medicamento sea un número entero positivo
    check("med_total_unidades_disponibles")
        .exists().withMessage("La cantidad de medicamentos es requerida.")
        .notEmpty().withMessage("La cantidad de medicamentos no puede estar vacía.")
        .isInt({ min: 1 }).withMessage("La cantidad debe ser un número entero positivo.")
        .toInt(),




    (req, res, next) => validateResult(req, res, next),
]; 



const validatorActualizarMedicamento = [
    check("med_nombre").optional().isString().trim().notEmpty()
    .withMessage("El nombre del medicamento es requerido y debe ser un texto."),
    check("med_presentacion").optional().isString().trim().notEmpty()
    .withMessage("La presentación del medicamento es requerida y debe ser un texto."),
    check("unidades_por_presentacion").optional().isInt({ min: 1 })
    .withMessage("Las unidades por presentación deben ser un número entero positivo."),
    check("med_descripcion").optional().isString().trim().withMessage("La descripción debe ser un texto."),
    
    (req, res, next) => validateResult(req, res, next),

];






module.exports = { validatorCrearMedicamento, validatorStockMedicamento, validatorActualizarMedicamento };


