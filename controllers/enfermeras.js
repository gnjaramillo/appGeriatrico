const { Op } = require('sequelize');
const { matchedData } = require('express-validator');
const { enfermeraModel, personaModel, sedePersonaRolModel } = require('../models');



const registrarEnfermera = async (req, res) => {
    try {
        const data = matchedData(req);
        const { per_id, enf_codigo } = data;


        // Verificar si la persona ya tiene estos datos adicionales como enfermera
        const datosEnfermeraExistente = await enfermeraModel.findOne({
            where: { per_id },
            include: [{
                model: personaModel,  
                as: 'persona',  
                attributes: ['per_nombre_completo', 'per_documento']
            }]
        });

       

        if (datosEnfermeraExistente) {
            return res.status(400).json({
                message: 'La persona ya está registrada como enfermera(o) con su respectivo código.',
                datosEnfermeraExistente: {
                    nombre: datosEnfermeraExistente.persona.per_nombre_completo,  // Acceder con el alias correcto
                    documento: datosEnfermeraExistente.persona.per_documento,
                    enf_codigo: datosEnfermeraExistente.enf_codigo
                }
            });
        }


        // Registrar enfermera
        const nuevaEnfermera = await enfermeraModel.create({ per_id, enf_codigo });

        return res.status(201).json({ 
            message: "Enfermera registrada con éxito.", 
            nuevaEnfermera 
        });

    } catch (error) {
        console.error("Error al registrar enfermera:", error);
        return res.status(500).json({ 
            message: "Error al registrar enfermera.", 
            error: error.message 
        });
    }
};



// ver TODAS las enfermeras de mi sede  (admin sede)
const obtenerRolesEnfermerasSede = async (req, res) => {
    try {
      const se_id = req.session.se_id;
  
      if (!se_id) {
        return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
      }
  
      const enfermeras = await sedePersonaRolModel.findAll({
        where: { se_id, rol_id: 5 }, // Filtrar solo enfermeras en la sede del admin
        attributes: ["sp_fecha_inicio", "sp_fecha_fin", "sp_activo"],
        include: [
          {
            model: personaModel,
            as: "persona",
            attributes: ["per_id", "per_nombre_completo", "per_documento"],
            include: [
              {
                model: enfermeraModel, // Incluir datos adicionales de enfermera
                as: "enfermera",
                attributes: ["enf_id"],
              }
            ]
          },
        ],
        order: [['sp_activo', 'DESC']] // Ordenar primero los activos
      });
  
      if (enfermeras.length === 0) {
        return res.status(404).json({ message: "No hay enfermeras vinculadas a esta sede." });
      }
  
      const respuestaEnfermeras = enfermeras.map((e) => ({
        per_id: e.persona.per_id,
        nombre: e.persona.per_nombre_completo,
        documento: e.persona.per_documento,
        fechaInicio: e.sp_fecha_inicio,
        fechaFin: e.sp_fecha_fin,
        enfermeraActiva: e.sp_activo,
        enf_codigo: e.persona.enfermera?.enf_id || null, // Puede ser null si aun no tiene registro en enfermeraModel
      }));
  
      return res.status(200).json({
        message: "Enfermeras obtenidas exitosamente",
        enfermeras: respuestaEnfermeras,
      });
    } catch (error) {
      console.error("Error al obtener enfermeras por sede:", error);
      return res.status(500).json({ message: "Error al obtener enfermeras." });
    }
};



// obtener detalle enfermera



  

module.exports = { registrarEnfermera, obtenerRolesEnfermerasSede };





