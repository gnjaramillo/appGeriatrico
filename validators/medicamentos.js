const { check , param} = require('express-validator');
const  validateResult  = require('../utils/handleValidator');
const moment = require("moment-timezone");






const validatorCrearMedicamento = [
    check("med_nombre")
        .exists({ checkFalsy: true }).withMessage("El nombre del medicamento es obligatorio.")
        .isString().withMessage("El nombre del medicamento debe ser un texto.")
        .trim(),

    check("med_presentacion")
        .exists({ checkFalsy: true }).withMessage("La presentación del medicamento es obligatoria.")
        .isIn([
            "sachet", "unidad", "tableta", "blíster", "caja", "frasco", "crema", 
            "spray", "ampolla", "inyección", "parche", "supositorio", "gotas",
            "tubo", "cápsula"  // Nuevas opciones agregadas
        ]).withMessage("La presentación del medicamento no es válida."),

    check("unidades_por_presentacion")
        .exists({ checkFalsy: true }).withMessage("Las unidades por presentación son obligatorias.")
        .isInt({ min: 1 }).withMessage("Las unidades por presentación deben ser un número entero positivo.")
        .toInt(),

    check("med_tipo_contenido")
        .exists({ checkFalsy: true }).withMessage("El tipo de contenido es obligatorio.")
        .isIn([
            "mililitros", "gramos", "unidades", "tabletas", "cápsulas", "disparos", 
            "parches", "gotas", "supositorios", "otros"
        ]).withMessage("El tipo de contenido no es válido.")
        .trim(),

    check("med_descripcion")
        .optional()
        .isString().withMessage("La descripción debe ser un texto.")
        .trim(),

    (req, res, next) => validateResult(req, res, next),
];



const validatorActualizarMedicamento = [
    param("med_id")
        .exists().withMessage("El ID del medicamento es requerido.")
        .isInt({ min: 1 }).withMessage("El ID del medicamento debe ser un número entero positivo."),


    check("med_nombre")
        .optional()
        .isString().trim().notEmpty()
        .withMessage("Si se proporciona, el nombre del medicamento no puede estar vacío."),

    check("med_presentacion")
        .optional()
        .notEmpty()
        .withMessage("Si se proporciona, la presentación del medicamento no puede estar vacía.")
        .isIn([
            "sachet", "unidad", "tableta", "blíster", "caja", "frasco", "crema", 
            "spray", "ampolla", "inyección", "parche", "supositorio", "gotas",
            "tubo", "cápsula"  // Nuevas opciones agregadas
        ]).withMessage("La presentación del medicamento no es válida."),

    check("unidades_por_presentacion")
        .optional()
        .notEmpty()
        .isInt({ min: 1 })
        .withMessage("Si se proporciona, las unidades por presentación deben ser un número entero positivo."),
        

    check("med_tipo_contenido")
        .optional()
        .notEmpty()
        .isIn([
            "mililitros", "gramos", "unidades", "tabletas", "cápsulas", "disparos", 
            "parches", "gotas", "supositorios", "otros"
        ])
        .withMessage("El tipo de contenido no es válido."),


     check("med_descripcion")
        .optional().isString().trim()
        .withMessage("Si se envía una descripción, debe ser un texto."),

    (req, res, next) => validateResult(req, res, next),
];






module.exports = { validatorCrearMedicamento, validatorActualizarMedicamento };


