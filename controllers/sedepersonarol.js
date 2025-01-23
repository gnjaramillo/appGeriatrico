const { Op } = require('sequelize');
const { matchedData } = require('express-validator');
const { personaModel, rolModel, sedeModel, geriatricoModel, sedePersonaRolModel, geriatricoPersonaRolModel } = require('../models');
const { tokenSign } = require('../utils/handleJwt'); 
const jwt = require('jsonwebtoken');








const ADMINISTRADOR_SEDE_ROL_ID = 2; // ID del rol administrador
// asignar rol admin de sede (este rol lo asigna el super usuario)

const asignarRolAdminSede = async (req, res) => {
    try {
        const data = matchedData(req);
        const { per_id, se_id, rol_id, sp_fecha_inicio, sp_fecha_fin } = data;

        // Validar que solo se puede asignar el rol de Administrador de Sede
        if (rol_id !== ADMINISTRADOR_SEDE_ROL_ID) {
            return res.status(400).json({ 
                message: 'Aquí solo se puede registrar Administradores de Sede.' 
            });
        }

        // Validar si la persona existe
        const persona = await personaModel.findOne({ where: { per_id } });
        if (!persona) {
            return res.status(404).json({ message: 'Persona no encontrada.' });
        }

        // Verificar si el rol existe, si no, crearlo
        let rol = await rolModel.findOne({ where: { rol_id: ADMINISTRADOR_SEDE_ROL_ID } });
        if (!rol) {
            rol = await rolModel.create({
                rol_id: ADMINISTRADOR_SEDE_ROL_ID,
                rol_nombre: 'Administrador Sede', 
                rol_descripcion: 'Rol con permisos en la sede a su cargo'
            });
            console.log("Rol 'Administrador Sede' creado.");
        }

        // Validar si la sede existe
        const sede = await sedeModel.findOne({ where: { se_id } });
        if (!sede) {
            return res.status(404).json({ message: 'Sede no encontrada.' });
        }

        // Validar si la sede ya tiene un administrador activo asignado
        const adminExistente = await sedePersonaRolModel.findOne({
            where: {
                se_id,
                rol_id: ADMINISTRADOR_SEDE_ROL_ID,
                [Op.or]: [
                    { sp_fecha_fin: null },
                    { sp_fecha_fin: { [Op.gt]: new Date() } }
                ]
            }
        });

        if (adminExistente) {
            return res.status(400).json({ message: 'Esta sede ya tiene un administrador activo.' });
        }

        // Verificar si la persona ya tiene el rol en la sede
        const relacionExistente = await sedePersonaRolModel.findOne({
            where: {
                per_id,
                se_id,
                rol_id: ADMINISTRADOR_SEDE_ROL_ID,
                [Op.or]: [
                    { sp_fecha_fin: null },
                    { sp_fecha_fin: { [Op.gt]: new Date() } }
                ]
            }
        });

        if (relacionExistente) {
            return res.status(400).json({
                message: 'Esta persona ya tiene el rol de "Administrador Sede" en esta sede.'
            });
        }

        // Asignar el rol a la persona en la sede
        const nuevaVinculacion = await sedePersonaRolModel.create({
            per_id,
            se_id,
            rol_id: ADMINISTRADOR_SEDE_ROL_ID,
            sp_fecha_inicio,
            sp_fecha_fin: sp_fecha_fin || null
        });

        return res.status(201).json({
            message: 'Rol "Administrador Sede" asignado correctamente.',
            data: nuevaVinculacion
        });
    } catch (error) {
        console.error("Error al asignar rol admin sede:", error);
        return res.status(500).json({
            message: "Error al asignar rol admin sede.",
            error: error.message
        });
    }
};



// lista de sus roles visibles a cada usuario
/* const obtenerRolesAsignados = async (req, res) => {
  try {
    // id del token básico
    const { id } = req.user;

    // Buscar las asignaciones de roles y sedes del usuario
    const rolesSede = await sedePersonaRolModel.findAll({
      where: { per_id: id },
      include: [
        { model: rolModel, as: "rol", attributes: ["rol_id", "rol_nombre"] },
        { model: sedeModel, as: "sede", attributes: ["se_id", "se_nombre"] },
      ],
    });

    // Obtener asignaciones de roles en geriátricos
    const rolesGeriatrico = await geriatricoPersonaRolModel.findAll({
      where: { per_id: id },
      include: [
        { model: rolModel, as: "rol", attributes: ["rol_id", "rol_nombre"] },
        {
          model: geriatricoModel,
          as: "geriatrico",
          attributes: ["ge_id", "ge_nombre"],
        },
      ],
    });

    // Determinar el mensaje según si tiene asignaciones
    const message =
      asignacionesSede.length === 0 && asignacionesGeriatrico.length === 0
        ? "Aún no tienes roles ni sedes/geriátricos asignados. Comunícate con un administrador."
        : "Selecciona un rol asignado para continuar.";

    // Construir la respuesta
    const opcionesSede = rolesSede.map((a) => ({
      rol_id: a.rol_id,
      rol_nombre: a.rol.rol_nombre,
      se_id: a.se_id,
      se_nombre: a.sede.se_nombre,
    }));

    const opcionesGeriatrico = rolesGeriatrico.map((a) => ({
      rol_id: a.rol_id,
      rol_nombre: a.rol.rol_nombre,
      ge_id: a.ge_id,
      ge_nombre: a.geriatrico.ge_nombre,
    }));

    return res.status(200).json({
      message,
      opcionesSede,
      opcionesGeriatrico,
    });
  } catch (error) {
    console.error("Error al obtener roles y sedes:", error);
    return res.status(500).json({ message: "Error al obtener roles y sedes" });
  }
}; 
 */

const obtenerRolesAsignados = async (req, res) => {
    try {
        const { id } = req.user; // Se obtiene desde el token del middleware

        // Obtener asignaciones de roles en sedes
        const rolesSede = await sedePersonaRolModel.findAll({
            where: { per_id: id },
            include: [
                { model: rolModel, as: 'rol', attributes: ['rol_id', 'rol_nombre'] },
                { model: sedeModel, as: 'sede', attributes: ['se_id', 'se_nombre'] },
            ],
        });

        // Obtener asignaciones de roles en geriátricos
        const rolesGeriatrico = await geriatricoPersonaRolModel.findAll({
            where: { per_id: id },
            include: [
                { model: rolModel, as: 'rol', attributes: ['rol_id', 'rol_nombre'] },
                { model: geriatricoModel, as: 'geriatrico', attributes: ['ge_id', 'ge_nombre'] },
            ],
        });

        // Determinar el mensaje según si tiene asignaciones
        const message = (rolesSede.length === 0 && rolesGeriatrico.length === 0)
            ? 'Aún no tienes roles ni sedes/geriátricos asignados. Comunícate con un administrador.'
            : 'Selecciona un rol asignado para continuar.';


        // Construir la respuesta
        const opcionesSede = rolesSede.map(a => ({
            rol_id: a.rol_id,
            rol_nombre: a.rol.rol_nombre,
            se_id: a.se_id,
            se_nombre: a.sede.se_nombre,
        }));

        const opcionesGeriatrico = rolesGeriatrico.map(a => ({
            rol_id: a.rol_id,
            rol_nombre: a.rol.rol_nombre,
            ge_id: a.ge_id,
            ge_nombre: a.geriatrico.ge_nombre,
        }));

        return res.status(200).json({
            message,
            opcionesSede,
            opcionesGeriatrico
        });

    } catch (error) {
        console.error('Error al obtener roles:', error);
        return res.status(500).json({ message: 'Error al obtener roles' });
    }
};


  


// una vez entro al sistema, escojo entre los roles q ya tengo asignados
const seleccionarRolYSede = async (req, res) => {
    try {
      const { rol_id, se_id } = req.body;
      const { id} = req.user; 


  
      const asignacion = await sedePersonaRolModel.findOne({
        where: { per_id: id, rol_id, se_id },
        include: [
          { model: rolModel, as: 'rol', attributes: ['rol_nombre'] },
          { model: sedeModel, as: 'sede', attributes: ['se_nombre'] },
        ],
      });      
  
      
  
      if (!asignacion || !asignacion.rol || !asignacion.sede) {
        return res.status(404).json({ message: 'Rol o sede no encontrados' });
      }   
  

    // Guardar `se_id` y `rol_id` en la sesión del usuario
    req.session.se_id = se_id;
    req.session.rol_id = rol_id;
    

    req.session.save((err) => {
        if (err) {
            console.error('Error al guardar la sesión:', err);
        } else {
            console.log('Sesión guardada correctamente:', req.session);
        }
    });
  

      return res.status(200).json({
        message: 'Rol seleccionado exitosamente',
        rol: asignacion.rol.rol_nombre,  
        sede: asignacion.sede.se_nombre,
        rol_id: asignacion.rol_id,
        se_id: asignacion.se_id,
      });
    } catch (error) {
      console.error('Error al seleccionar rol y sede:', error);
      return res.status(500).json({ message: 'Error al seleccionar rol y sede' });
    }
  };






// roles asignados dentro de la sede (asignados por el admin sede)
const asignarRol = async (req, res) => {
    try {
        const data = matchedData(req);
        const { per_id, rol_id, sp_fecha_inicio, sp_fecha_fin } = data;

         // Obtener el `se_id` de la sesión
         const se_id = req.session.se_id;
         if (!se_id) return res.status(403).json({ message: 'No se ha seleccionado una sede' });


        // Validar que el rol sea permitido
        const roles = await rolModel.findAll();
        const rolesPermitidos = roles.filter(role => role.rol_nombre !== 'Super Administrador' && role.rol_nombre !== 'administrador sede');
        const rolSolicitado = rolesPermitidos.find(role => role.rol_id === rol_id);

        if (!rolSolicitado) {
            return res.status(403).json({ message: 'Rol no permitido para asignar en esta sede.' });
        }


        // Validar que la persona exista
        const persona = await personaModel.findOne({ where: { per_id } });
        if (!persona) return res.status(404).json({ message: 'Persona no encontrada' });

        // Verificar si ya tiene el rol asignado en esta sede
        const rolExistenteSede = await sedePersonaRolModel.findOne({
            where: { per_id, se_id, rol_id, [Op.or]: [
                { sp_fecha_fin: null },
                { sp_fecha_fin: { [Op.gt]: new Date() } }
            ] }
        });

        if (rolExistenteSede) {
            return res.status(400).json({ message: 'Este rol ya está asignado a la persona en esta sede.' });
        }

        // Crear la nueva asignación
        const nuevaVinculacion = await sedePersonaRolModel.create({
            per_id,
            se_id,
            rol_id,
            sp_fecha_inicio,
            sp_fecha_fin: sp_fecha_fin || null,
        });

        // Guardar `se_id` y `rol_id` en la sesión del usuario
        req.session.se_id = se_id;
        req.session.rol_id = rol_id;

        req.session.save((err) => {
            if (err) {
                console.error('Error al guardar la sesión:', err);
            } else {
                console.log('Sesión guardada correctamente:', req.session);
            }
        });

        return res.status(200).json({
            message: 'Rol asignado correctamente',
            nuevaVinculacion,
        
        });

    } catch (error) {
        console.error("Error al asignar rol:", error);
        return res.status(500).json({
            message: "Error al asignar rol",
            error: error.message,
        });
    }
};



// trae todos los roles dentro de una sede especifica, omite el del admin sede
const obtenerPersonasConRoles = async (req, res) => {
    try {
         // Obtener el `se_id` de la sesión
         const se_id = req.session.se_id;

        if (!se_id) return res.status(403).json({ message: 'No se ha seleccionado una sede' });

        // listado de personas con sus roles en la sede
        const personasConRoles = await sedePersonaRolModel.findAll({
            where: { se_id },
            include: [
                {
                    model: personaModel, 
                    as: 'persona',
                    attributes: ['per_nombre_completo', 'per_usuario', 'per_telefono'] // Atributos básicos
                },
                {
                    model: rolModel, 
                    as: 'rol',
                    attributes: ['rol_nombre'],
                    where: {
                        rol_nombre: { [Op.ne]: 'administrador sede' } // Excluir el rol "administrador sede"
                    }
                }
            
            ]
        });

        return res.status(200).json({
            message: 'Listado de personas con roles',
            data: personasConRoles
        });
    } catch (error) {
        console.error("Error al obtener el listado de personas con roles:", error);
        return res.status(500).json({
            message: "Error al obtener el listado de personas con roles",
            error: error.message,
        });
    }
};





module.exports = { asignarRolAdminSede, asignarRol, obtenerRolesAsignados, seleccionarRolYSede, obtenerPersonasConRoles };


