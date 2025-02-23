const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 

const { matchedData } = require('express-validator');
const { personaModel, rolModel, sedeModel, geriatricoModel, geriatricoPersonaModel, sedePersonaRolModel, geriatricoPersonaRolModel } = require('../models');
const { tokenSign } = require('../utils/handleJwt'); 
const jwt = require('jsonwebtoken');




// asignar roles administrativos dentro de una sede (lo hace el admin geriatrico)
// ID de roles válidos para sedes
const ROLES_ADMINISTRATIVOS_SEDE = [3]; // por ahora rol id 3: "Administrador Sede" , se pueden añadir mas roles
const asignarRolAdminSede = async (req, res) => {
    
    try {
        const data = matchedData(req); // Obtén datos validados
        const { per_id, se_id, rol_id, sp_fecha_inicio, sp_fecha_fin } = data;

        // Recuperar el geriátrico al que pertenece el administrador desde la sesión
        const ge_id_sesion = req.session.ge_id;
        if (!ge_id_sesion) {
            return res.status(403).json({ message: 'No tienes un geriátrico asignado en la sesión.' });
        }

        // Validar que el rol solicitado sea un rol válido para sedes
        if (!ROLES_ADMINISTRATIVOS_SEDE.includes(rol_id)) {
            return res.status(400).json({ message: 'Este rol no es el indicado para asignar roles administrativos en una Sede.' });
        }

        // Verificar si la persona existe
        const persona = await personaModel.findOne({ where: { per_id } });
        if (!persona) {
            return res.status(404).json({ message: 'Persona no encontrada.' });
        }

        // Verificar si la sede existe y pertenece al geriátrico de la sesión
         const sede = await sedeModel.findOne({ 
            where: { se_id, ge_id: ge_id_sesion },
            attributes: ['se_id', 'se_nombre', 'se_activo'],
        
        });
         if (!sede) {
             return res.status(403).json({ message: 'No tienes permiso para asignar roles en esta sede. Esta sede no pertenece al geriatrico a tu cargo' });
         }

        if (!sede.se_activo) {
            return res.status(400).json({ message: 'No se pueden asignar roles en una sede inactiva.' });
        }

        // Verificar si la persona está vinculada y activa en el geriátrico
        const vinculoGeriatrico = await geriatricoPersonaModel.findOne({
            where: { per_id, ge_id: ge_id_sesion, gp_activo: true }
        });

        if (!vinculoGeriatrico) {
            return res.status(400).json({ message: 'La persona no está vinculada activamente al geriátrico, no se puede asignar el rol. Primero debe activarla nuevamente' });
        }

    
        // Verificar si el rol ya está asignado a la persona en esta sede
        const rolExistente = await sedePersonaRolModel.findOne({
            where: {
                per_id,
                se_id,
                rol_id,
                [Op.or]: [
                    { sp_fecha_fin: null },
                    { sp_fecha_fin: { [Op.gt]: new Date() } } // Rol activo
                ]
            }
        });


        
        if (rolExistente) {
            return res.status(400).json({ message: 'La persona ya tiene este rol asignado en esta Sede.' });
        }

        // Asignar el rol a la persona en la sede
        const nuevaVinculacion = await sedePersonaRolModel.create({
            per_id,
            se_id,
            rol_id,
            sp_fecha_inicio,
            sp_fecha_fin: sp_fecha_fin || null
        });

        const rol = await rolModel.findOne({
            where: { rol_id },
            attributes: ['rol_nombre'],
        });


        return res.status(200).json({
            message: 'Rol asignado correctamente.',
            nuevaVinculacion,
            rolNombre: rol.rol_nombre,
            sede: {
                se_id: sede.se_id,
                se_nombre: sede.se_nombre,
                se_nombre: sede.se_activo,
                
            },
        });     


    } catch (error) {
        console.error("Error al asignar rol en la sede:", error);
        return res.status(500).json({
            message: "Error al asignar rol en la sede.",
            error: error.message
        });
    }
};



// inactivar roles admin sede (solo lo puede hacer el admin geriatrico)
const inactivarRolAdminSede = async (req, res) => {
    try {
        const { per_id, se_id, rol_id } = req.body;

        const ge_id = req.session.ge_id;
        if (!ge_id) {
            return res.status(403).json({ message: 'No tienes un geriátrico asignado en la sesión.' });
        }

        // Validar que el rol solicitado sea un rol válido para sedes
        if (!ROLES_ADMINISTRATIVOS_SEDE.includes(rol_id)) {
            return res.status(400).json({ message: 'Este rol no es válido para inactivar en una Sede.' });
        }

        // Verificar que la sede pertenece al geriátrico del usuario en sesión
        const sede = await sedeModel.findOne({
            where: { se_id, ge_id: ge_id },
            attributes: ['se_id', 'se_nombre']
        });

        if (!sede) {
            return res.status(403).json({ message: 'No tienes permisos para inactivar roles en esta sede.' });
        }

       

        // Buscar si la persona tiene ese rol activo en la sede
        const rolAsignado = await sedePersonaRolModel.findOne({
            where: { 
                per_id, 
                se_id, 
                rol_id, 
                sp_activo: true }
        });

        if (!rolAsignado) {
            return res.status(404).json({ message: 'La persona no tiene este rol activo en esta sede.' });
        }

        // Obtener la información del rol
        const rol = await rolModel.findOne({
            where: { rol_id },
            attributes: ['rol_nombre']
        });

        // Obtener la información de la persona
        const persona = await personaModel.findOne({
            where: { per_id },
            attributes: ['per_nombre_completo', 'per_documento']
        });

        // Obtener la fecha actual
        const fechaActual = new Date();

        // Inactivar el rol actualizando sp_activo a false y sp_fecha_fin con la fecha actual
        await rolAsignado.update({
            sp_activo: false,
            sp_fecha_fin: fechaActual
        });

        return res.status(200).json({
            message: 'Rol inactivado correctamente.',
            data: {
                nombre_rol: rol.rol_nombre,
                nombre_sede: sede.se_nombre,
                nombre_persona: persona.per_nombre_completo,
                documento_persona: persona.per_documento
            }
        });

    } catch (error) {
        console.error("Error al inactivar rol en la sede:", error);
        return res.status(500).json({ message: "Error en el servidor.", error: error.message });
    }
};




// roles dentro de la sede (asignados por el admin sede)
// ROLES_NO_PERMITIDOS = [1, 2, 3]; // Super Administrador, Admin Geriátrico, Admin Sede
const ROLES_PERMITIDOS_SEDE = [4, 5, 6, 7]; // paciente, enfermero, acudiente, colaborador

const asignarRolesSede = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const data = matchedData(req);
        const { per_id, rol_id, sp_fecha_inicio, sp_fecha_fin } = data;
        const se_id = req.session.se_id;
        const ge_id_sesion = req.session.ge_id;

        if (!se_id) {
            return res.status(403).json({ message: 'No se ha seleccionado una sede.' });
        }

        if (!ge_id_sesion) {
            return res.status(403).json({ message: 'No tienes un geriátrico asignado en la sesión.' });
        }

        if (!ROLES_PERMITIDOS_SEDE.includes(rol_id)) {
            return res.status(403).json({ message: 'Rol no permitido para asignar en esta sede.' });
        }

        // Verificar si la sede existe, pertenece al geriátrico y está activa
        const sede = await sedeModel.findOne({
            where: { se_id, ge_id: ge_id_sesion },
            attributes: ['se_id', 'se_activo', 'se_nombre', 'cupos_totales', 'cupos_ocupados'],
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        if (!sede) {
            return res.status(403).json({ message: 'No tienes permiso para asignar roles en esta sede. No pertenece a tu geriátrico.' });
        }

        if (!sede.se_activo) {
            return res.status(400).json({ message: 'No se pueden asignar roles en una sede inactiva.' });
        }

        // Verificar si la persona está activa en el geriátrico dueño de la sede
        const vinculoGeriatrico = await geriatricoPersonaModel.findOne({
            where: { per_id, ge_id: ge_id_sesion, gp_activo: true },
            transaction: t,
        });

        if (!vinculoGeriatrico) {
            return res.status(400).json({ message: 'La persona no está vinculada activamente al geriátrico. Primero debe ser activada nuevamente.' });
        }

        const persona = await personaModel.findOne({ where: { per_id } });
        if (!persona) {
            return res.status(404).json({ message: 'Persona no encontrada.' });
        }

        // Verificar si la persona ya tiene el rol asignado en la sede
        const rolExistenteSede = await sedePersonaRolModel.findOne({
            where: {
                per_id,
                se_id,
                rol_id,
                [Op.or]: [
                    { sp_fecha_fin: null }, 
                    { sp_fecha_fin: { [Op.gt]: new Date() } }],
            },
            transaction: t,
        });

        if (rolExistenteSede) {
            return res.status(400).json({ message: 'Este rol ya está asignado a la persona en esta sede.' });
        }

        let cuposTotales = sede.cupos_totales;
        let cuposOcupados = sede.cupos_ocupados;

        // Si es un paciente (rol_id === 4), verificar y actualizar cupos
        if (rol_id === 4) {
            if (sede.cupos_ocupados >= sede.cupos_totales) {
                return res.status(400).json({ message: 'No hay cupos disponibles en esta sede.' });
            }

            await sedeModel.update(
                { cupos_ocupados: sede.cupos_ocupados + 1 },
                { where: { se_id }, transaction: t }
            );

            cuposOcupados += 1;
        }

        // Asignar el rol
        const nuevaVinculacion = await sedePersonaRolModel.create(
            {
                per_id,
                se_id,
                rol_id,
                sp_fecha_inicio,
                sp_fecha_fin: sp_fecha_fin || null,
            },
            { transaction: t }
        );

        // Obtener el nombre del rol
        const rol = await rolModel.findOne({
            where: { rol_id },
            attributes: ['rol_nombre'],
            transaction: t,
        });

        let mensajeAdicional = '';
        if (rol_id === 4) 
            mensajeAdicional = 'Has asignado el rol Paciente. Registra los datos adicionales del Paciente.';
        if (rol_id === 5) 
            mensajeAdicional = 'Has asignado el rol Enfermera(o). Registra los datos adicionales del Enfermera(o).';
        if (rol_id === 6)
            mensajeAdicional = 'Has asignado el rol de Acudiente. Registra los datos adicionales del acudiente.';

        await t.commit();

        return res.status(200).json({
            message: 'Rol asignado correctamente.',
            nuevaVinculacion,
            rolNombre: rol.rol_nombre,
            mensajeAdicional,
            sede: {
                se_id: sede.se_id,
                se_nombre: sede.se_nombre,
                cuposTotales: cuposTotales,
                cuposOcupados: cuposOcupados,
            },
        });
    } catch (error) {
        await t.rollback();
        console.error('Error al asignar rol:', error);
        return res.status(500).json({
            message: 'Error al asignar rol.',
            error: error.message,
        });
    }
};



const inactivarRolSede = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { per_id, se_id, rol_id } = req.body;
        const ge_id = req.session.ge_id;

        if (!ge_id) {
            return res.status(403).json({ message: 'No tienes un geriátrico asignado en la sesión.' });
        }

        if (!ROLES_PERMITIDOS_SEDE.includes(rol_id)) {
            return res.status(400).json({ message: 'No tienes permiso para inactivar este rol en una sede.' });
        }

        // Verificar que la sede pertenece al geriátrico del usuario en sesión
        const sede = await sedeModel.findOne({
            where: { se_id, ge_id },
            attributes: ['se_id', 'se_nombre', 'cupos_ocupados'],
            transaction: t
        });

        if (!sede) {
            await t.rollback();
            return res.status(403).json({ message: 'No tienes permisos para inactivar roles en esta sede.' });
        }

        // Buscar si la persona tiene ese rol activo en la sede
        const rolAsignado = await sedePersonaRolModel.findOne({
            where: {
                per_id,
                se_id,
                rol_id,
                sp_activo: true
            
            },
            transaction: t
        });

        if (!rolAsignado) {
            await t.rollback();
            return res.status(404).json({ message: 'La persona no tiene este rol activo en esta sede.' });
        }

        // Obtener la información del rol
        const rol = await rolModel.findOne({
            where: { rol_id },
            attributes: ['rol_nombre'],
            transaction: t
        });

        // Obtener la información de la persona
        const persona = await personaModel.findOne({
            where: { per_id },
            attributes: ['per_nombre_completo', 'per_documento'],
            transaction: t
        });

        // Obtener la fecha actual
        const fechaActual = new Date();

       // Inactivar el rol actualizando sp_activo a false y sp_fecha_fin con la fecha actual
       await rolAsignado.update({
        sp_activo: false,
        sp_fecha_fin: fechaActual
    });

        // Si el rol inactivado es paciente (rol_id === 4), disminuir los cupos ocupados
        if (rol_id === 4 && sede.cupos_ocupados > 0) {
            await sedeModel.update(
                { cupos_ocupados: sede.cupos_ocupados - 1 },
                { where: { se_id }, transaction: t }
            );
        }

        await t.commit();

        return res.status(200).json({
            message: 'Rol inactivado correctamente.',
            data: {
                nombre_rol: rol.rol_nombre,
                nombre_sede: sede.se_nombre,
                nombre_persona: persona.per_nombre_completo,
                documento_persona: persona.per_documento
            }
        });

    } catch (error) {
        await t.rollback();
        console.error("Error al inactivar rol en la sede:", error);
        return res.status(500).json({ message: "Error en el servidor.", error: error.message });
    }
};










module.exports = { 
    asignarRolAdminSede, 
    inactivarRolAdminSede,
    asignarRolesSede,
    inactivarRolSede
};


