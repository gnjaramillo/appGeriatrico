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
      .isIn(["unidades", "mililitros", "gramos", "gotas"])
      .withMessage("El tipo de cantidad no es válido."),
  
    // Validar formato de hora 24h
    check("admin_hora")
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage("La hora debe estar en formato HH:MM (24 horas)."),
  
    // Validar método de administración
    check("admin_metodo")
      .isIn(["Oral", "Intravenosa", "Subcutánea", "Tópica", "Inhalación"])
      .withMessage("Método de administración no válido."),
  
    // Validar estado solo si viene (debe ser 'Pendiente' o 'Suspendido')
/*     check("admin_estado")
      .optional()
      .isIn(["Pendiente", "Suspendido"])
      .withMessage("El estado solo puede ser 'Pendiente' o 'Suspendido'."), */

      
  
    (req, res, next) => validateResult(req, res, next),
  ];


  
  
  module.exports = { validatorCrearFormulacion };





