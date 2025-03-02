const { sequelize } = require('../config/mysql'); 
const { Op } = require('sequelize');
const { matchedData } = require('express-validator');
const { personaModel,rolModel, sedeModel, sedePersonaRolModel, geriatricoPersonaModel, geriatricoModel, geriatricoPersonaRolModel  } = require('../models');
const { tokenSign } = require('../utils/handleJwt'); 
const jwt = require('jsonwebtoken');




// ID de roles válidos para asignarse en geriátricos, (los asigna el super admin)
const ROLES_GERIATRICO = [2]; // por ahora rol id 2: "Administrador Geriátrico" , se pueden añadir mas roles
const ROLES_UNICOS_GERIATRICO = [2]; // solo puede haber un admin por geriátrico (id 2: Admin Geriátrico)


// Controlador para asignar roles de geriátrico (super admin)
const asignarRolGeriatrico = async (req, res) => {

    let transaction;


    try {
        const data = matchedData(req);
        const { per_id, ge_id, rol_id, gp_fecha_inicio, gp_fecha_fin } = data;

        // Validar que el rol solicitado sea un rol válido para geriátricos
        if (!ROLES_GERIATRICO.includes(rol_id)) {
            return res.status(400).json({ message: 'Este rol no es válido para asignar en un Geriátrico.' });
        }

        // Verificar si la persona existe
        const persona = await personaModel.findOne({ where: { per_id } });
        if (!persona) {
            return res.status(404).json({ message: 'Persona no encontrada.' });
        }

        // Verificar si el geriátrico existe y está activo
        const geriatrico = await geriatricoModel.findOne({ 
            where: { ge_id }, 
            attributes: ['ge_id', 'ge_nombre', 'ge_activo'],
        });
        if (!geriatrico) {
            return res.status(404).json({ message: 'Geriátrico no encontrado.' });
        }

        if (!geriatrico.ge_activo) {
            return res.status(400).json({ message: 'No se pueden asignar roles en un geriátrico inactivo.' });
        }

        const rol = await rolModel.findOne({
            where: { rol_id },
            attributes: ['rol_nombre'],
        });


        // Verificar si el rol ya está asignado a la persona en este geriátrico y está activo
        const rolExistente = await geriatricoPersonaRolModel.findOne({
            where: {
                per_id,
                ge_id,
                rol_id,
                gp_activo: true, // 🔹 Aseguramos que el rol esté activo
            }
        });

        if (rolExistente) {
            return res.status(400).json({ message: 'La persona ya tiene este rol activo en este Geriátrico.' });
        }

        // Validar si el rol es único por geriátrico (ej: solo un Admin Geriátrico activo)
        if (ROLES_UNICOS_GERIATRICO.includes(rol_id)) {
            const adminExistente = await geriatricoPersonaRolModel.findOne({
                where: {
                    ge_id,
                    rol_id,
                    gp_activo: true, // 🔹 Solo verificamos si hay un admin activo
                }
            });

            if (adminExistente) {
                return res.status(400).json({ message: 'Este geriátrico ya tiene un usuario con este rol activo.' });
            }
        }

        // Iniciar transacción para garantizar consistencia en la BD
        transaction = await sequelize.transaction();

        
        try {
            // Asignar el rol a la persona en el geriátrico
            const nuevaVinculacionRol = await geriatricoPersonaRolModel.create({
                per_id,
                ge_id,
                rol_id,
                gp_fecha_inicio,
                gp_fecha_fin: gp_fecha_fin || null,
                gp_activo: true // 🔹 Se asigna como activo
            }, { transaction });


             // 🔹 Verificar si la persona ya está vinculada al geriátrico
        let vinculoGeriatrico = await geriatricoPersonaModel.findOne({
            where: { per_id, ge_id }
        });

        if (vinculoGeriatrico) {
            if (!vinculoGeriatrico.gp_activo) {
                // Reactivar si estaba inactiva
                await vinculoGeriatrico.update({ gp_activo: true });
            }
        } else {
            // Si no está vinculada, crear la vinculación
            vinculoGeriatrico = await geriatricoPersonaModel.create({ 
                ge_id, 
                per_id, 
                gp_activo: true 
            }, { transaction });
        }

            
            // Confirmar la transacción
            await transaction.commit();

            return res.status(201).json({
                message: 'Rol asignado correctamente.',
                data: nuevaVinculacionRol,
                rolNombre: rol.rol_nombre,
                geriatrico: {
                    ge_id: geriatrico.ge_id,
                    ge_nombre: geriatrico.ge_nombre
                }
    
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error("Error al asignar rol en el geriátrico:", error);
        return res.status(500).json({
            message: "Error al asignar rol en el geriátrico.",
            error: error.message
        });
    }
};




// Controlador para inactivar un rol geriátrico (super admin)
const inactivarRolGeriatrico = async (req, res) => {
    try {
        const { per_id, ge_id, rol_id } = req.body;

        // Validar que el rol solicitado sea un rol válido para geriátricos
        if (!ROLES_GERIATRICO.includes(rol_id)) {
            return res.status(400).json({ message: 'Este rol no es válido para inactivar en un Geriátrico.' });
        }

        // Buscar si la persona tiene ese rol activo en el geriátrico
        const rolAsignado = await geriatricoPersonaRolModel.findOne({
            where: {
                per_id,
                ge_id,
                rol_id,
                gp_activo: true
            }
        });

        if (!rolAsignado) {
            return res.status(404).json({ message: 'La persona no tiene este rol activo en este geriátrico.' });
        }

        // Obtener el nombre del rol
        const rol = await rolModel.findOne({
            where: { rol_id },
            attributes: ['rol_nombre'],
        });

        // Obtener el nombre del geriátrico
        const geriatrico = await geriatricoModel.findOne({
            where: { ge_id },
            attributes: ['ge_nombre'],
        });


        // Obtener la fecha actual
        const fechaActual = new Date();

        // Inactivar el rol actualizando gp_activo a false y gp_fecha_fin con la fecha actual
        await rolAsignado.update({
            gp_activo: false,
            gp_fecha_fin: fechaActual
        });

        return res.status(200).json({
            message: 'Rol inactivado correctamente.',
            data: rolAsignado,
            rolNombre: rol ? rol.rol_nombre : 'Desconocido',
            geriatrico: {
                ge_id,
                ge_nombre: geriatrico ? geriatrico.ge_nombre : 'Desconocido'
            }
        });

    } catch (error) {
        console.error("Error al inactivar rol en el geriátrico:", error);
        return res.status(500).json({ message: "Error en el servidor.", error: error.message });
    }
};




module.exports = { asignarRolGeriatrico, inactivarRolGeriatrico };


