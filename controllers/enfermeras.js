const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 

const { matchedData } = require('express-validator');
const { enfermeraModel,sedeModel, personaModel,  geriatricoPersonaModel, sedePersonaRolModel } = require('../models');



/* const registrarEnfermera = async (req, res) => {
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
}; */



const registrarEnfermera = async (req, res) => {
    let t;
  
    try {
        const data = matchedData(req);
        const { per_id, enf_codigo, rol_id, sp_fecha_inicio, sp_fecha_fin } = data;
        
        if (rol_id !== 5) {
            return res.status(400).json({ message: "El rol asignado no es válido para un rol enfermera(o)." });
          }


        const se_id = req.session.se_id;
        const ge_id_sesion = req.session.ge_id;

      
  
        if (!se_id) {
            return res.status(403).json({ message: "No se ha seleccionado una sede." });
        }
  
        if (!ge_id_sesion) {
            return res.status(403).json({ message: "No tienes un geriátrico asignado en la sesión." });
        }
  
        // Verificar si la sede pertenece al geriátrico en sesión y está activa
        const sede = await sedeModel.findOne({
            where: { se_id, ge_id: ge_id_sesion },
            attributes: ["se_id", "se_activo", "se_nombre"]
        });
  
        if (!sede) {
            return res.status(403).json({ message: "No tienes permiso para asignar roles en esta sede." });
        }
  
        if (!sede.se_activo) {
            return res.status(400).json({ message: "No se pueden asignar roles en una sede inactiva." });
        }
  
        // Verificar si la persona ya tiene el rol asignado en la sede
        const rolExistenteSede = await sedePersonaRolModel.findOne({
            where: { per_id, se_id, rol_id, sp_activo: true }
        });
  
        if (rolExistenteSede) {
            return res.status(400).json({ message: "Este rol ya está asignado a la persona en esta sede." });
        }
  
        t = await sequelize.transaction();
  
        let datosEnfermera = await enfermeraModel.findOne({ where: { per_id }});
  
        if (!datosEnfermera) {
            datosEnfermera = await enfermeraModel.create(
                {
                    per_id,
                    enf_codigo
                },
                { transaction: t }
            );
        } else {
            // Actualizar los datos de la enfermera si ya existe
            await datosEnfermera.update(
                {
                    per_id,
                    enf_codigo
                },
                { transaction: t }
            );
        }
  
        // Verificar y manejar la vinculación al geriátrico
        let vinculoGeriatrico = await geriatricoPersonaModel.findOne({
            where: { per_id, ge_id: ge_id_sesion }
        });
  
        if (vinculoGeriatrico) {
            if (!vinculoGeriatrico.gp_activo) {
                await vinculoGeriatrico.update({ gp_activo: true }, { transaction: t });
            }
        } else {
            vinculoGeriatrico = await geriatricoPersonaModel.create({ 
                ge_id: ge_id_sesion, 
                per_id, 
                gp_activo: true 
            }, { transaction: t });
        }
  
        // ✅ Asignar rol de enfermera en la sede
        const nuevaVinculacion = await sedePersonaRolModel.create(
            {
                per_id,
                se_id,
                rol_id,
                sp_fecha_inicio,
                sp_fecha_fin: sp_fecha_fin || null
            },
            { transaction: t }
        );
  
        // Confirmar transacción
        await t.commit();
  
        return res.status(201).json({
            message: "Enfermera registrada y rol asignado con éxito.",
            nuevaVinculacion,
            datosEnfermera
        });
  
    } catch (error) {
        if (t && !t.finished) {
            await t.rollback();
        }
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
                attributes: ["enf_codigo"],
              },
              {
                model: geriatricoPersonaModel,
                as: "vinculosGeriatricos",
                where: { ge_id },
                attributes: ["gp_activo"],
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
            enf_codigo: vinculo.persona.enfermera?.enf_codigo || null,
            per_nombre: vinculo.persona.per_nombre_completo,
            per_documento: vinculo.persona.per_documento,
            activoSede: tieneAlMenosUnRolActivo, // True si al menos un rol está activo, false si todos están inactivos
            activoGeriatrico: vinculo.persona.vinculosGeriatricos[0]?.gp_activo || false, // Manejo seguro de array vacío
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





