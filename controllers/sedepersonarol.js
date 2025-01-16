const { Op } = require('sequelize');
const { matchedData } = require('express-validator');
const { personaModel, rolModel, sedeModel, sedePersonaRolModel } = require('../models');
const { tokenSign } = require('../utils/handleJwt'); 
const jwt = require('jsonwebtoken');




const SUPER_ADMIN_ROL_ID = 1; // ID del rol super_admin (super administrador)
const SEDE_GLOBAL_ID = 0;     // ID de la sede global creada manualmente ( será 0)
// crear super usuario
const asignarRolSuperUsuario = async (req, res) => {

    try {
        const { per_id, sp_fecha_inicio, sp_fecha_fin } = matchedData(req);

        // Validar si la persona existe
        const persona = await personaModel.findOne({ where: { per_id } });
        if (!persona) {
            return res.status(404).json({ message: 'Persona no encontrada' });
        }

        // Verificar si el rol super_admin existe, si no, crearlo
        let rol = await rolModel.findOne({ where: { rol_id: SUPER_ADMIN_ROL_ID } });
        if (!rol) {
            // Si el rol no existe, crear uno
            rol = await rolModel.create({
                rol_id: SUPER_ADMIN_ROL_ID,
                rol_nombre: 'Super Administrador', 
                rol_descripcion: 'Rol con permisos especiales en el sistema'
            });
            console.log("Rol 'Super Administrador' creado.");
        }



        // Verificar si ya existe un super usuario con el rol "super_admin"
        const rolExistente = await sedePersonaRolModel.findOne({
            where: {
                se_id: SEDE_GLOBAL_ID,  // Usar la sede global (ID 0)
                rol_id: SUPER_ADMIN_ROL_ID, // Usar el rol "super_admin" (ID 1)
                [Op.or]: [
                    { sp_fecha_fin: null },  // No tiene fecha de fin, es activo indefinidamente
                    { sp_fecha_fin: { [Op.gt]: new Date() } }  // Tiene una fecha fin futura
                ]
            }
        });

        if (rolExistente) {
            return res.status(400).json({ message: 'Ya existe un super usuario registrado.' });
        }

        // Crear el vínculo en la tabla sede_personas_roles
        const nuevaVinculacion = await sedePersonaRolModel.create({
            per_id,
            se_id: SEDE_GLOBAL_ID,  // Usar la sede global (ID 0)
            rol_id: SUPER_ADMIN_ROL_ID,
            sp_fecha_inicio,
            sp_fecha_fin: sp_fecha_fin || null,
        });

        // Generar el token
        const token = await tokenSignBasico(persona, rol, { se_id: SEDE_GLOBAL_ID });

        return res.status(201).json({
            message: 'Super usuario asignado correctamente.',
            data: nuevaVinculacion,
            token,
        });
    } catch (error) {
        console.error('Error al asignar rol super usuario:', error);
        return res.status(500).json({
            message: 'Error al asignar rol super usuario',
            error: error.message,
        });
    }
};




// asignar rol admin de sede (los asigna el super usuario)
const asignarRolAdminSede = async (req, res) => {
    try {
        // Obtener los datos validados de la solicitud
        const data = matchedData(req);
        const { per_id, se_id, rol_id, sp_fecha_inicio, sp_fecha_fin } = data;

        // Verificar que el rol existe y corresponde al rol "Administrador Sede"
        const rol = await rolModel.findOne({ where: { rol_id } });
        if (!rol || rol.rol_nombre !== 'administrador sede') {
            return res.status(400).json({ 
                message: 'El rol proporcionado no es válido o no corresponde al rol "Administrador Sede".' 
            });
        }

        // Validar si la persona existe
        const persona = await personaModel.findOne({ where: { per_id } });
        if (!persona) {
            return res.status(404).json({ message: 'Persona no encontrada.' });
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
                rol_id,
                [Op.or]: [
                    { sp_fecha_fin: null },
                    { sp_fecha_fin: { [Op.gt]: new Date() } }
                ]
            }
        });

        if (adminExistente) {
            return res.status(400).json({ message: 'Esta sede ya tiene un administrador activo.' });
        }

        // Verificar si ya existe la misma relación activa entre persona, sede y rol
        const relacionExistente = await sedePersonaRolModel.findOne({
            where: {
                per_id,
                se_id,
                rol_id,
                [Op.or]: [
                    { sp_fecha_fin: null },
                    { sp_fecha_fin: { [Op.gt]: new Date() } }
                ]
            }
        });

        if (relacionExistente) {
            return res.status(400).json({
                message: 'Esta persona ya tiene el rol de "Administrador Sede" asignado en esta sede.'
            });
        }

        // Asignar el rol a la persona en la sede
        const nuevaVinculacion = await sedePersonaRolModel.create({
            per_id,
            se_id,
            rol_id,
            sp_fecha_inicio,
            sp_fecha_fin: sp_fecha_fin || null
        });

        // Responder con éxito
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





const obtenerRolesAsignados = async (req, res) => {
    try {

      // id del token básico
      const { id } = req.user; 
  
      // Buscar las asignaciones de roles y sedes del usuario
      const asignaciones = await sedePersonaRolModel.findAll({
        where: { per_id: id },
        include: [
          { model: rolModel, as: 'rol', attributes: ['rol_id', 'rol_nombre'] },
          { model: sedeModel, as: 'sede', attributes: ['se_id', 'se_nombre'] },
        ],
      });
  
      // Validar si hay roles y sedes asignados
      if (asignaciones.length === 0) {
        return res.status(404).json({ message: 'No tienes roles ni sedes asignados' });
      }
  
      // Formatear las asignaciones para enviarlas como respuesta
      const rolesYSedes = asignaciones.map((a) => ({
        rol_id: a.rol_id,
        rol_nombre: a.rol.rol_nombre,
        se_id: a.se_id,
        se_nombre: a.sede.se_nombre,
      }));
  
      return res.status(200).json({
        message: 'Roles y sedes obtenidos exitosamente',
        rolesYSedes,
      });
    } catch (error) {
      console.error('Error al obtener roles y sedes:', error);
      return res.status(500).json({ message: 'Error al obtener roles y sedes' });
    }
};

  




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
  

    // Generar el token con datos de rol y sede
    const token = await tokenSign(
        {
          per_id: id, 
          per_nombre_completo: req.user.nombre
        },
        se_id, // ID de la sede seleccionada
        rol_id, // ID del rol seleccionado
        asignacion.rol.dataValues.rol_nombre, 
        asignacion.sede.dataValues.se_nombre 
      );
      

     // console.log('Datos decodificados del token:', jwt.decode(token));
  

      return res.status(200).json({
        message: 'Rol seleccionado exitosamente',
        rol: asignacion.rol.rol_nombre,  
        sede: asignacion.sede.se_nombre,
        rol_id: asignacion.rol_id,
        se_id: asignacion.se_id,
        token,
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


        // Validar que el rol sea permitido
        const roles = await rolModel.findAll();
        const rolesPermitidos = roles.filter(role => role.rol_nombre !== 'Super Administrador' && role.rol_nombre !== 'administrador sede');
        const rolSolicitado = rolesPermitidos.find(role => role.rol_id === rol_id);

        if (!rolSolicitado) {
            return res.status(403).json({ message: 'Rol no permitido para asignar en esta sede.' });
        }

        // Validar sede
        const { se_id } = req.user;
        console.log("Usuario autenticado:", req.user);


        if (!se_id) return res.status(403).json({ message: 'No se ha seleccionado una sede' });

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

        return res.status(200).json({
            message: 'Rol asignado correctamente',
            data: nuevaVinculacion,
        });
    } catch (error) {
        console.error("Error al asignar rol:", error);
        return res.status(500).json({
            message: "Error al asignar rol",
            error: error.message,
        });
    }
};



module.exports = {asignarRolSuperUsuario,  asignarRolAdminSede, asignarRol, obtenerRolesAsignados, seleccionarRolYSede };