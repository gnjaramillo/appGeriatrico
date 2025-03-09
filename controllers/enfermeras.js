const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 

const { matchedData } = require('express-validator');
const { enfermeraModel,sedeModel, personaModel,  geriatricoPersonaModel, sedePersonaRolModel } = require('../models');



const registrarEnfermera = async (req, res) => {
  try {
      const data = matchedData(req);
      const { per_id, enf_codigo } = data;

      // Verificar si la persona ya tiene estos datos adicionales como enfermera
      let datosEnfermera = await enfermeraModel.findOne({ where: { per_id } });

      if (!datosEnfermera) {
          datosEnfermera = await enfermeraModel.create({
              per_id,
              enf_codigo
          });
      } else {
          // Actualizar los datos de la enfermera si ya existe
          await datosEnfermera.update({
              enf_codigo
          });
      }

      return res.status(201).json({ 
          message: "Enfermera registrada con éxito.", 
          nuevaEnfermera: datosEnfermera,
      });

  } catch (error) {
      console.error("Error al registrar enfermera:", error);
      return res.status(500).json({ 
          message: "Error al registrar enfermera.", 
          error: error.message 
      });
  }
};




  const obtenerEnfermerasSede = async (req, res) => {
    try {
      const se_id = req.session.se_id;
  
      if (!se_id) {
        return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
      }
  
      // Obtener el geriátrico dueño de la sede en sesión
      const sede = await sedeModel.findOne({
        where: { se_id },
        attributes: ["ge_id"],
      });
  
      if (!sede) {
        return res.status(404).json({ message: "La sede no existe." });
      }
  
      const ge_id = sede.ge_id;
  
      const vinculaciones = await sedePersonaRolModel.findAll({
        where: { se_id, rol_id: 5 }, // Solo enfermeras de la sede
        attributes: ["sp_activo", "per_id"],
        include: [
          {
            model: personaModel,
            as: "persona",
            attributes: ["per_id", "per_nombre_completo", "per_documento"],
            include: [
              {
                model: enfermeraModel,
                as: "enfermera",
                attributes: ["enf_codigo", "enf_id"],
              },
              
            ],
          },
        ],
      });
  
      if (vinculaciones.length === 0) {
        return res.status(404).json({ message: "No hay enfermeras vinculadas a esta sede." });
      }
  
      // Mapa para agrupar enfermeras y evitar duplicados
      const enfermerasAgrupadas = new Map();
  
      for (const vinculo of vinculaciones) {
        const per_id = vinculo.persona.per_id;
  
        // Obtener TODOS los roles de enfermera de la persona en la sede
        const rolesEnfermera = await sedePersonaRolModel.findAll({
          where: { se_id, per_id, rol_id: 5 },
          attributes: ["sp_activo"],
        });
  
        // Verificar si hay al menos un `sp_activo === true`
        const tieneAlMenosUnRolActivo = rolesEnfermera.some((rol) => rol.sp_activo === true);
  
        if (!enfermerasAgrupadas.has(per_id)) {
          enfermerasAgrupadas.set(per_id, {
            per_id,
            enf_id: vinculo.persona.enfermera?.enf_id || null,
            enf_codigo: vinculo.persona.enfermera?.enf_codigo || null,
            per_nombre: vinculo.persona.per_nombre_completo,
            per_documento: vinculo.persona.per_documento,
            activoSede: tieneAlMenosUnRolActivo, // True si al menos un rol está activo, false si todos están inactivos
          });
        }
      }
  
      return res.status(200).json({
        message: "Enfermeras vinculadas encontradas",
        data: Array.from(enfermerasAgrupadas.values()).sort(
          (a, b) => Number(b.activoSede) - Number(a.activoSede) // Primero las activas en sede
        ),
      });
  
    } catch (error) {
      console.error("Error al obtener enfermeras vinculadas:", error);
      return res.status(500).json({ message: "Error en el servidor." });
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





  

module.exports = { registrarEnfermera, obtenerEnfermerasSede, obtenerRolesEnfermerasSede };





