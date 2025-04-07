
const { check , param} = require('express-validator');
const  validateResult  = require('../utils/handleValidator');

const validatorMedicamento = [

    // 🔢 Validar med_id desde params
    param("med_pac_id")
      .exists().withMessage("El ID del medicamento del paciente es requerido.")
      .isInt({ min: 1 }).withMessage("El ID del medicamento debe ser un número entero positivo."),
  
  
  
    // 🧪 Ejecutar middleware de resultados
    (req, res, next) => validateResult(req, res, next),


]; 


module.exports = { validatorMedicamento };
