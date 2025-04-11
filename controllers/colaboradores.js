const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 
const { matchedData } = require('express-validator');
const { enfermeraModel,sedeModel,rolModel, turnoModel, personaModel, sedePersonaRolModel } = require('../models');







// lista Colaboradores rol id 7 que pertenecen a la sede, 
const obtenerColaboradoresSede = async (req, res) => {
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
      where: { se_id, rol_id: 7 }, // Solo colaboradores de la sede
      attributes: ["sp_activo", "per_id"],
      include: [
        {
          model: personaModel,
          as: "persona",
          attributes: ["per_id", "per_nombre_completo", "per_documento"],


        },
      ],
    });

    if (vinculaciones.length === 0) {
      return res.status(404).json({ message: "No hay colaboradores vinculados a esta sede." });
    }

    // Mapa para agrupar Colaboradores y evitar duplicados
    const colaboradoresAgrupados = new Map();

    for (const vinculo of vinculaciones) {
      const per_id = vinculo.persona.per_id;

      // Obtener TODOS los roles de enfermera de la persona en la sede
      const rolesColaborador = await sedePersonaRolModel.findAll({
        where: { se_id, per_id, rol_id: 7 },
        attributes: ["sp_activo"],
      });

      // Verificar si hay al menos un `sp_activo === true`
      const tieneAlMenosUnRolActivo = rolesColaborador.some((rol) => rol.sp_activo === true);

      if (!colaboradoresAgrupados.has(per_id)) {
        colaboradoresAgrupados.set(per_id, {
          per_id,
          per_nombre: vinculo.persona.per_nombre_completo,
          per_documento: vinculo.persona.per_documento,
          activoSede: tieneAlMenosUnRolActivo, // True si al menos un rol está activo, false si todos están inactivos
        });
      }
    }

    return res.status(200).json({
      message: "Colaboradores vinculados encontradas",
      data: Array.from(colaboradoresAgrupados.values()).sort(
        (a, b) => Number(b.activoSede) - Number(a.activoSede) // Primero las activas en sede
      ),
    });

  } catch (error) {
    console.error("Error al obtener colaboradores vinculadas:", error);
    return res.status(500).json({ message: "Error en el servidor." });
  }
};




// ver TODAS las Colaboradores de mi sede, con sus roles y fechas  (admin sede)
const obtenerRolesColaboradoresSede = async (req, res) => {
    try {
      const { per_id } = req.params;
      const se_id = req.session.se_id;
  
      if (!se_id) {
        return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
      }
  
      const rolesColaboradores = await sedePersonaRolModel.findAll({
        where: { per_id, se_id, rol_id: 7 }, // Filtrar solo Colaboradores en la sede del admin
        attributes: ["sp_fecha_inicio", "sp_fecha_fin", "sp_activo"],
        include: [
            {
            model: personaModel,
            as: "persona",
            attributes: ["per_id", "per_nombre_completo", "per_documento"],
            },
            {
            model: rolModel,
            as: "rol",
            attributes: ["rol_id", "rol_nombre"],
            },

        ],
        order: [['sp_activo', 'DESC']] // Ordenar primero los activos
      });
  
      if (rolesColaboradores.length === 0) {
        return res.status(404).json({ message: "No tiene un rol Colaborador vinculado a esta sede." });
      }
  
      const respuestaColaboradores = rolesColaboradores.map((e) => ({
        // per_id: e.persona.per_id,
        // nombre: e.persona.per_nombre_completo,
        // documento: e.persona.per_documento,
        rol_id: e.rol.rol_id,
        rol: e.rol.rol_nombre,
        fechaInicio: e.sp_fecha_inicio,
        fechaFin: e.sp_fecha_fin,
        activoSede: e.sp_activo,
      }));
  
      return res.status(200).json({
        message: "Roles Colaborador obtenidos exitosamente",
        Colaboradores: respuestaColaboradores,
      });
    } catch (error) {
      console.error("Error al obtener Colaboradores por sede:", error);
      return res.status(500).json({ message: "Error al obtener Colaboradores." });
    }
};








  

module.exports = {obtenerColaboradoresSede, obtenerRolesColaboradoresSede };





