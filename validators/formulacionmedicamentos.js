const { check , param} = require('express-validator');
const  validateResult  = require('../utils/handleValidator');
const moment = require("moment-timezone");





const validatorCrearFormulacion = [
    // Validar el ID del paciente desde los parámetros de la URL
    param('pac_id')
      .isInt().withMessage('El ID del paciente debe ser un número entero')
      .exists().notEmpty(),
  


    // Validar que existan los campos requeridos
    check([
      "med_id",
      "admin_fecha_inicio",
      "admin_fecha_fin",
      "admin_dosis_por_toma",
      "admin_tipo_cantidad",
      "admin_hora",
      "admin_metodo"
    ])
      .exists().withMessage("Todos los campos son obligatorios.")
      .notEmpty().withMessage("Los campos no pueden estar vacíos."),
  



    // Validar fechas
    check("admin_fecha_inicio")
      .custom((value) => {
        if (!moment(value, "YYYY-MM-DD", true).isValid()) {
          throw new Error("La fecha de inicio debe estar en formato YYYY-MM-DD.");
        }
  
        const today = moment().tz("America/Bogota").startOf("day");
        const inputDate = moment.tz(value, "America/Bogota").startOf("day");
  
        if (inputDate.isBefore(today)) {
          throw new Error("La fecha de inicio no puede ser una fecha pasada.");
        }
  
        return true;
      }),



  
    check("admin_fecha_fin")
      .custom((value, { req }) => {
        if (!moment(value, "YYYY-MM-DD", true).isValid()) {
          throw new Error("La fecha de fin debe estar en formato YYYY-MM-DD.");
        }
  
        const fechaInicio = moment.tz(req.body.admin_fecha_inicio, "America/Bogota").startOf("day");
        const fechaFin = moment.tz(value, "America/Bogota").startOf("day");
  
        if (fechaFin.isBefore(fechaInicio)) {
          throw new Error("La fecha de fin no puede ser anterior a la fecha de inicio.");
        }
  
        return true;
      }),
  



    // Validar dosis por toma
    check("admin_dosis_por_toma")
      .isFloat({ min: 0.01 }).withMessage("La dosis por toma debe ser un número positivo."),



  
    // Validar tipo de cantidad (unidades, mililitros, gramos, gotas)
    check("admin_tipo_cantidad")
      .isIn(["unidades", "mililitros", "gramos", "gotas", "otro"])
      .withMessage("El tipo de cantidad no es válido."),



  
    // Validar formato de hora 24h
    check("admin_hora")
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage("La hora debe estar en formato HH:MM (24 horas)."),



  
    // Validar método de administración
    check("admin_metodo")
      .isIn(["Oral", "Intravenosa", "Subcutánea", "Tópica", "Inhalación", "Rectal", "Ótica", "Oftálmica", "Nasal", "Otro" ])
      .withMessage("Método de administración no válido."),

  
    (req, res, next) => validateResult(req, res, next),
];




const validatorUpdateFormulacion = [
  // Validar el ID de la formulación desde los parámetros de la URL
  param('admin_id')
    .isInt().withMessage('El ID de la formulación debe ser un número entero')
    .exists().notEmpty().withMessage("El ID de la formulación es obligatorio."),

  // Validar que existan los campos requeridos (si vienen)
  check("med_id")
    .optional().exists()
    .notEmpty().withMessage("El medicamento no puede estar vacío.")
    .isInt().withMessage("El ID del medicamento debe ser un número."),

  check("admin_fecha_inicio")
    .optional()
    .notEmpty().withMessage("La fecha de inicio no puede estar vacía.")
    .custom((value) => {
      if (!moment(value, "YYYY-MM-DD", true).isValid()) {
        throw new Error("La fecha de inicio debe estar en formato YYYY-MM-DD.");
      }

      const today = moment().tz("America/Bogota").startOf("day");
      const inputDate = moment.tz(value, "America/Bogota").startOf("day");

      if (inputDate.isBefore(today)) {
        throw new Error("La fecha de inicio no puede ser una fecha pasada.");
      }

      return true;
    }),

  check("admin_fecha_fin")
    .optional()
    .notEmpty().withMessage("La fecha de fin no puede estar vacía.")
    .custom((value, { req }) => {
      if (!moment(value, "YYYY-MM-DD", true).isValid()) {
        throw new Error("La fecha de fin debe estar en formato YYYY-MM-DD.");
      }

      const fechaInicio = moment.tz(req.body.admin_fecha_inicio || "1900-01-01", "America/Bogota").startOf("day");
      const fechaFin = moment.tz(value, "America/Bogota").startOf("day");

      if (req.body.admin_fecha_inicio && fechaFin.isBefore(fechaInicio)) {
        throw new Error("La fecha de fin no puede ser anterior a la fecha de inicio.");
      }

      return true;
    }),

  check("admin_dosis_por_toma").optional().notEmpty().withMessage("La dosis por toma no puede estar vacía.").isFloat({ min: 0.01 }).withMessage("La dosis por toma debe ser un número positivo."),

  check("admin_tipo_cantidad").optional().notEmpty().withMessage("El tipo de cantidad no puede estar vacío.").isIn(["unidades", "mililitros", "gramos", "gotas", "otro"]).withMessage("El tipo de cantidad no es válido."),

  check("admin_hora").optional().notEmpty().withMessage("La hora no puede estar vacía.").matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("La hora debe estar en formato HH:MM (24 horas)."),

  check("admin_metodo").optional().notEmpty().withMessage("El método de administración no puede estar vacío.").isIn(["Oral", "Intravenosa", "Subcutánea", "Tópica", "Inhalación", "Rectal", "Ótica", "Oftálmica", "Nasal", "Otro"]).withMessage("Método de administración no válido."),



  (req, res, next) => {
    if ("admin_estado" in req.body) {
      return res.status(400).json({
        message: "No se permite modificar el estado en este formulario.",
      });
    }

    next(); // <- avanzar al siguiente middleware
  },

  // ✅ Validación final
  (req, res, next) => validateResult(req, res, next),
];



const validatorIdFormulacion = [
  // Validar el ID de la formulación desde los parámetros de la URL
  param('admin_id')
    .isInt().withMessage('El ID de la formulación debe ser un número entero')
    .exists().notEmpty().withMessage("El ID de la formulación es obligatorio."),

  // ✅ Validación final
  (req, res, next) => validateResult(req, res, next),
];



const validatorSuspenderFormulacion = [
  // Validar el ID de la formulación desde los parámetros de la URL
  param('admin_id')
    .isInt().withMessage('El ID de la formulación debe ser un número entero')
    .exists().notEmpty().withMessage("El ID de la formulación es obligatorio."),

     // Validar que venga el motivo de suspensión
  check('admin_motivo_suspension')
  .exists().isString().trim()
  .notEmpty().withMessage("El motivo de suspensión no puede estar vacío.")
  .isLength({ max: 500 }).withMessage("El motivo no debe exceder los 500 caracteres."),

  // ✅ Validación final
  (req, res, next) => validateResult(req, res, next),


];




const validatorAmpliarFechaFin = [
  // Validar el ID de la formulación desde los parámetros de la URL
  param('admin_id')
    .isInt().withMessage('El ID de la formulación debe ser un número entero')
    .exists().notEmpty().withMessage("El ID de la formulación es obligatorio."),


  check("admin_fecha_fin")
    .exists().withMessage("La fecha de fin es obligatoria.")
    .isDate({ format: "YYYY-MM-DD" }).withMessage("Debe ser una fecha válida con formato YYYY-MM-DD."),

    (req, res, next) => validateResult(req, res, next),
];





module.exports = { validatorCrearFormulacion, validatorUpdateFormulacion, validatorIdFormulacion,validatorSuspenderFormulacion, validatorAmpliarFechaFin };





