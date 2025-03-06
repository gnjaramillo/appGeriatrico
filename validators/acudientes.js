const { check } = require("express-validator");
const validateResult = require("../utils/handleValidator");

const validatorAcudiente = [
  check("per_id").exists().isInt().notEmpty().withMessage("El ID de la persona es obligatorio."),
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


  
  check("pac_id").exists().isInt().notEmpty().withMessage("El ID del paciente es obligatorio."),
  check("acu_parentesco").exists().isString().notEmpty().withMessage("El parentesco es obligatorio."),
  (req, res, next) => validateResult(req, res, next),
];

module.exports = { validatorAcudiente };
