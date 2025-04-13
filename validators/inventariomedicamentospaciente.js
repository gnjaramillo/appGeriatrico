const { check , param} = require('express-validator')   ;
const  validateResult  = require('../utils/handleValidator');
const moment = require("moment-timezone");




const validatorPrimerMovimiento = [
    // 🔢 Validar med_id desde params
    param("med_id")
      .exists().withMessage("El ID del medicamento es requerido.")
      .isInt({ min: 1 }).withMessage("El ID del medicamento debe ser un número entero positivo."),


    // 🔢 Validar pac_id desde params
    param("pac_id")
      .exists().withMessage("El ID del paciente es requerido.")
      .isInt({ min: 1 }).withMessage("El ID del paciente debe ser un número entero positivo."),
  

    // 🧮 Validar cantidad desde body
    check("cantidad")
      .exists().withMessage("La cantidad es obligatoria.")
      .isInt({ min: 0 }).withMessage("La cantidad debe ser un número entero positivo."),
  
    // 🏷️ Validar med_origen desde body
    check("med_origen")
      .exists().withMessage("El origen del medicamento es obligatorio.")
      .isIn(["EPS", "Compra Directa", "Donación", "Otro"])
      .withMessage("El origen del medicamento no es válido."),
  
    // 🧪 Ejecutar middleware de resultados
    (req, res, next) => validateResult(req, res, next),
  ];




  const validatorStockMedicamento = [

    // 🔢 Validar med_pac_id desde params
    param("med_pac_id")
      .exists().withMessage("El ID del medicamento en sede es requerido.")
      .isInt({ min: 1 }).withMessage("El ID del medicamento debe ser un número entero positivo."),
  
    // 🧮 Validar cantidad desde body
    check("cantidad")
      .exists().withMessage("La cantidad es obligatoria.")
      .isInt({ min: 1 }).withMessage("La cantidad debe ser un número entero positivo."),
  
    // 🏷️ Validar med_origen desde body
    check("med_origen")
      .exists().withMessage("El origen del medicamento es obligatorio.")
      .isIn(["EPS", "Compra Directa", "Donación", "Otro"])
      .withMessage("El origen del medicamento no es válido."),
  
    // 🧪 Ejecutar middleware de resultados
    (req, res, next) => validateResult(req, res, next),


]; 



const validatorSalidaMedicamento = [

    // 🔢 Validar med_pac_id desde params
    param("med_pac_id")
      .exists().withMessage("El ID del medicamento en sede es requerido.")
      .isInt({ min: 1 }).withMessage("El ID del medicamento debe ser un número entero positivo."),
  
    // 🧮 Validar cantidad desde body
    check("cantidad")
      .exists().withMessage("La cantidad es obligatoria.")
      .isInt({ min: 1 }).withMessage("La cantidad debe ser un número entero positivo."),
  
    // 🏷️ Validar med_origen desde body
    check("med_destino")
      .exists().withMessage("El destino del medicamento es obligatorio.")
      .isIn(["Baja", "Devolución", "Otro", "Administración Paciente"])
      .withMessage("El destino del medicamento no es válido."),
  
    // 🧪 Ejecutar middleware de resultados
    (req, res, next) => validateResult(req, res, next),


]; 




const validarPacId = [
    param('pac_id').isInt().withMessage('El ID del paciente debe ser un número entero'),

    (req, res, next) => validateResult(req, res, next),

];





module.exports = { validatorPrimerMovimiento, validatorStockMedicamento, validatorSalidaMedicamento, validarPacId };


