const { check } = require("express-validator");
const validateResult = require("../utils/handleValidator");

const validatorAcudiente = [
  check("per_id").exists().isInt().notEmpty().withMessage("El ID de la persona es obligatorio."),  
  check("pac_id").exists().isInt().notEmpty().withMessage("El ID del paciente es obligatorio."),
  check("pa_parentesco").exists().isString().notEmpty().withMessage("El parentesco es obligatorio."),
  (req, res, next) => validateResult(req, res, next),
];

const validatorRelacionAcudiente = [
  check("pa_id").exists().isInt({ min: 1 }).notEmpty().withMessage("El ID de la relacion acudiente_paciente es obligatorio."),  
  (req, res, next) => validateResult(req, res, next),
];



module.exports = { validatorAcudiente, validatorRelacionAcudiente };
