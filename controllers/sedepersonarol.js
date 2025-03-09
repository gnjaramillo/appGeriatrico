const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 

const { matchedData } = require('express-validator');
const { personaModel, rolModel, sedeModel, geriatricoModel, pacienteAcudienteModel, geriatricoPersonaModel, sedePersonaRolModel, geriatricoPersonaRolModel } = require('../models');
const { tokenSign } = require('../utils/handleJwt'); 
const jwt = require('jsonwebtoken');







// asignar roles administrativos dentro de una sede (lo hace el admin geriatrico)
const ROLES_ADMINISTRATIVOS_SEDE = [3]; // por ahora rol id 3: "Administrador Sede" , se pueden añadir mas roles
const asignarRolAdminSede = async (req, res) => {
    try {
        const data = matchedData(req);
        const { per_id, se_id, rol_id, sp_fecha_inicio, sp_fecha_fin } = data;

        const ge_id_sesion = req.session.ge_id;
        if (!ge_id_sesion) {
            return res.status(403).json({ message: 'No tienes un geriátrico asignado en la sesión.' });
        }

        if (!ROLES_ADMINISTRATIVOS_SEDE.includes(rol_id)) {
            return res.status(400).json({ message: 'Este rol no es válido para una sede.' });
        }

        // 🔹 Consultas sin transacción (solo lectura, no bloquean registros)
        const persona = await personaModel.findByPk(per_id);
        if (!persona) {
            return res.status(404).json({ message: 'Persona no encontrada.' });
        }

        const sede = await sedeModel.findOne({ 
            where: { se_id, ge_id: ge_id_sesion, se_activo: true },
            attributes: ['se_id', 'se_nombre']
        });

        if (!sede) {
            return res.status(403).json({ message: 'No tienes permiso para asignar roles en esta sede o está inactiva.' });
        }

        const rolExistente = await sedePersonaRolModel.findOne({
            where: { per_id, se_id, rol_id, sp_activo: true }
        });

        if (rolExistente) {
            return res.status(400).json({ message: 'La persona ya tiene este rol asignado y activo en esta sede.' });
        }

        // 🔹 Iniciar transacción para las modificaciones
        const transaction = await sequelize.transaction();

        try {
            // 🔹 Verificar y manejar la vinculación al geriátrico dentro de la transacción
            let vinculoGeriatrico = await geriatricoPersonaModel.findOne({
                where: { per_id, ge_id: ge_id_sesion }
            });

            if (vinculoGeriatrico) {
                if (!vinculoGeriatrico.gp_activo) {
                    await vinculoGeriatrico.update({ gp_activo: true }, { transaction });
                }
            } else {
                vinculoGeriatrico = await geriatricoPersonaModel.create({ 
                    ge_id: ge_id_sesion, 
                    per_id, 
                    gp_activo: true 
                }, { transaction });
            }

            // 🔹 Asignar el rol en la sede
            const nuevaVinculacion = await sedePersonaRolModel.create({
                per_id,
                se_id,
                rol_id,
                sp_fecha_inicio,
                sp_fecha_fin: sp_fecha_fin || null
            }, { transaction });

            const rol = await rolModel.findOne({
                where: { rol_id },
                attributes: ['rol_nombre']
            });

            await transaction.commit(); // ✅ Confirmar transacción

            return res.status(200).json({
                message: 'Rol asignado correctamente.',
                nuevaVinculacion,
                rolNombre: rol.rol_nombre,
                sede: {
                    se_id: sede.se_id,
                    se_nombre: sede.se_nombre
                }
            });

        } catch (error) {
            await transaction.rollback(); // ❌ Revertir en caso de error
            throw error;
        }

    } catch (error) {
        console.error("Error al asignar rol en la sede:", error);
        return res.status(500).json({
            message: "Error en el servidor.",
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





const ROLES_PERMITIDOS_SEDE = [4, 5, 6, 7]; // Paciente, Enfermero, Acudiente, Colaborador
const asignarRolesSede = async (req, res) => {
    let t;

    try {
        const data = matchedData(req);
        const { per_id, rol_id, sp_fecha_inicio, sp_fecha_fin } = data;
        const se_id = req.session.se_id;
        const ge_id_sesion = req.session.ge_id;

        if (!se_id) {
            return res.status(403).json({ message: "No se ha seleccionado una sede." });
        }

        if (!ge_id_sesion) {
            return res.status(403).json({ message: "No tienes un geriátrico asignado en la sesión." });
        }

        if (!ROLES_PERMITIDOS_SEDE.includes(rol_id)) {
            return res.status(403).json({ message: "Rol no permitido para asignar en esta sede." });
        }

        // Verificar si la sede pertenece al geriátrico en sesión y está activa
        const sede = await sedeModel.findOne({
            where: { se_id, ge_id: ge_id_sesion },
            attributes: ["se_id", "se_activo", "se_nombre", "cupos_totales", "cupos_ocupados"],
        });

        if (!sede) {
            return res.status(403).json({ message: "No tienes permiso para asignar roles en esta sede. No pertenece a tu geriátrico." });
        }

        if (!sede.se_activo) {
            return res.status(400).json({ message: "No se pueden asignar roles en una sede inactiva." });
        }

        // Verificar si la persona ya tiene el rol asignado en la sede
        const rolExistenteSede = await sedePersonaRolModel.findOne({
            where: { per_id, se_id, rol_id, sp_activo: true },
        });

        if (rolExistenteSede) {
            return res.status(400).json({ message: "Este rol ya está asignado a la persona en esta sede." });
        }

        // Obtener el nombre del rol
        const rol = await rolModel.findOne({
            where: { rol_id },
            attributes: ["rol_nombre"],
        });

        // Validar que un paciente NO esté en dos sedes activas del mismo geriátrico
        if (rol_id === 4) {
            const pacienteEnOtraSede = await sedePersonaRolModel.findOne({
                where: {
                    per_id,
                    rol_id: 4, // Paciente
                    sp_activo: true,
                    se_id: { [Op.ne]: se_id }, // Asegura que la sede es diferente a la actual
                },
                include: {
                    model: sedeModel,
                    as: "sede",
                    attributes: ["se_id", "se_nombre", "ge_id"],
                    include: {
                        model: geriatricoModel,
                        as: "geriatrico",
                        attributes: ["ge_id", "ge_nombre"],
                    },
                },
            });

            if (pacienteEnOtraSede) {
                return res.status(400).json({
                    message: "El paciente ya está registrado en otra sede de otro geriátrico. Debe ser retirado antes de registrarlo en una nueva sede.",
                    sedeActual: {
                        se_id: pacienteEnOtraSede.sede.se_id,
                        se_nombre: pacienteEnOtraSede.sede.se_nombre,
                    },
                    geriatricoActual: {
                        ge_id: pacienteEnOtraSede.sede.geriatrico.ge_id,
                        ge_nombre: pacienteEnOtraSede.sede.geriatrico.ge_nombre,
                    },
                });
            }
        }


        // Iniciar transacción
        t = await sequelize.transaction();

        // Verificar y manejar la vinculación al geriátrico dentro de la transacción
        let vinculoGeriatrico = await geriatricoPersonaModel.findOne({
            where: { per_id, ge_id: ge_id_sesion },
        });

        if (vinculoGeriatrico) {
            if (!vinculoGeriatrico.gp_activo) {
                await vinculoGeriatrico.update({ gp_activo: true }, { transaction: t });
            }
        } else {
            vinculoGeriatrico = await geriatricoPersonaModel.create(
                { ge_id: ge_id_sesion, per_id, gp_activo: true },
                { transaction: t }
            );
        }

        const cuposTotales = sede.cupos_totales;
        let cuposOcupados = sede.cupos_ocupados;

        // Si es paciente (rol_id === 4), verificar y actualizar cupos
        if (rol_id === 4) {
            if (sede.cupos_ocupados >= sede.cupos_totales) {
                return res.status(400).json({ message: "No hay cupos disponibles en esta sede." });
            }

            await sedeModel.update(
                { cupos_ocupados: sede.cupos_ocupados + 1 },
                { where: { se_id }, transaction: t }
            );

            cuposOcupados += 1;
        }     

        // Si el rol es Acudiente (rol_id === 6), verificar si ya existe
        let nuevaVinculacion;
        if (rol_id === 6) {
            let rolExistente = await sedePersonaRolModel.findOne({
                where: { per_id, se_id, rol_id: 6 },
                transaction: t
            });

            if (rolExistente) {
                if (!rolExistente.sp_activo) {
                    await rolExistente.update(
                        { sp_activo: true, sp_fecha_fin: null },
                        { transaction: t }
                    );
                }
                nuevaVinculacion = rolExistente;
            } else {
                nuevaVinculacion = await sedePersonaRolModel.create({
                    per_id,
                    se_id,
                    rol_id: 6,
                    sp_fecha_inicio,
                    sp_fecha_fin: sp_fecha_fin || null,
                    sp_activo: true
                }, { transaction: t });
            }
        } else {
            nuevaVinculacion = await sedePersonaRolModel.create(
                {
                    per_id,
                    se_id,
                    rol_id,
                    sp_fecha_inicio,
                    sp_fecha_fin: sp_fecha_fin || null,
                    sp_activo: true
                },
                { transaction: t }
            );
        }

        await t.commit();

        return res.status(200).json({
            message: "Rol asignado correctamente.",
            nuevaVinculacion,
            rolNombre: rol.rol_nombre,
            sede: {
                se_id: sede.se_id,
                se_nombre: sede.se_nombre,
                cuposTotales: cuposTotales,
                cuposOcupados: cuposOcupados,
            },
        });
    
    } catch (error) {
        if (t && !t.finished) {
            await t.rollback();
        }
        console.error("Error al asignar rol:", error);
        return res.status(500).json({
            message: "Error al asignar rol.",
            error: error.message,
        });
    }
};






// roles enfermera, paciente, acudiente.. roles que solo puede inactivar el admin sede
const ROLES_SEDE = [4, 5, 6, 7]; // Paciente, Enfermero, Acudiente, Colaborador
const inactivarRolSede = async (req, res) => {
    
    const { per_id, se_id, rol_id } = req.body;
    const ge_id = req.session.ge_id;
    const se_id_sesion = req.session.se_id; // sede del admin sede


    if (!ge_id) {
        return res.status(403).json({ message: 'No tienes un geriátrico asignado en la sesión.' });
    }


    if (!se_id_sesion) {
        return res.status(403).json({ message: 'No tienes una sede asignada en la sesión.' });
    }


    if (!ROLES_SEDE.includes(rol_id)) {
        return res.status(400).json({ message: 'No tienes permiso para inactivar este rol en una sede.' });
    }

    try {

        // Verificar que la sede que intenta modificar es la misma que tiene asignada
        if (se_id !== se_id_sesion) {
            return res.status(403).json({ message: 'No puedes inactivar roles en sedes que no están a tu cargo.' });
        }


        // Verificar que la sede pertenece al geriátrico del usuario en sesión
        const sede = await sedeModel.findOne({
            where: { se_id, ge_id },
            attributes: ['se_id', 'se_nombre', 'cupos_ocupados']
        });

        if (!sede) {
            return res.status(403).json({ message: 'No tienes permisos para inactivar roles en esta sede.' });
        }

        
        // Buscar si la persona tiene ese rol activo en la sede y obtener la info necesaria en una sola consulta
        const rolAsignado = await sedePersonaRolModel.findOne({
            where: { per_id, se_id, rol_id, sp_activo: true },
            include: [
                { model: rolModel, as: 'rol', attributes: ['rol_nombre'] },
                { model: personaModel, as: 'persona', attributes: ['per_nombre_completo', 'per_documento'] }
            ],
        });
        
        if (!rolAsignado) {
            return res.status(404).json({ message: 'La persona no tiene este rol activo en esta sede.' });
        }

        const t = await sequelize.transaction();

        // Inactivar el rol actualizando `sp_activo` y `sp_fecha_fin`
        await rolAsignado.update(
            { sp_activo: false, sp_fecha_fin: new Date() },
            { transaction: t }
        );

        // Si el rol inactivado es paciente (rol_id === 4), disminuir los cupos ocupados
        if (rol_id === 4 && sede.cupos_ocupados > 0) {
            await sede.update(
                { cupos_ocupados: sede.cupos_ocupados - 1 },
                { transaction: t }
            );
        }

        // Si el rol inactivado es Acudiente, inactivar también en acudienteModel
        if (rol_id === 6) {
            await pacienteAcudienteModel.update(
                { pa_activo: false },
                { where: { per_id }, transaction: t }
            );
        }    
        
        

        await t.commit();

        return res.status(200).json({
            message: 'Rol inactivado correctamente.',
            data: {
                nombre_rol: rolAsignado.rol.rol_nombre,
                nombre_sede: sede.se_nombre,
                nombre_persona: rolAsignado.persona.per_nombre_completo,
                documento_persona: rolAsignado.persona.per_documento
            }
        });

    } catch (error) {
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


