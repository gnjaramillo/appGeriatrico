const { Op } = require("sequelize");
const { sequelize } = require('../config/mysql'); 
const { geriatricoPersonaModel, personaModel, rolModel, geriatricoModel, sedeModel, geriatricoPersonaRolModel, sedePersonaRolModel } = require('../models');



/* admin geriatrico y admin sede deben primero buscar si la persona ya esta 
registrada en otro geriatrico, luego hacerle la VINCULACION INICIAL */
const vincularPersonaAGeriatrico = async (req, res) => {
    try {
        const { per_id } = req.body; // Solo necesitamos el ID de la persona
        const ge_id = req.session.ge_id; // Obtener el geriátrico de la sesión

        const persona = await personaModel.findByPk(per_id);
        if (!persona) {
            return res.status(404).json({ message: 'Persona no encontrada.' });
        }

        if (!ge_id) {
            return res.status(400).json({ message: "Error: No se pudo determinar el geriátrico." });
        }

        // Verificar si la persona ya está vinculada al geriátrico
        const vinculoExistente = await geriatricoPersonaModel.findOne({
            where: { per_id, ge_id, gp_activo: true }
        });

        if (vinculoExistente) {
            return res.status(400).json({ message: "La persona ya está vinculada y activa este geriátrico." });
        }

        // Vincular persona al geriátrico
        await geriatricoPersonaModel.create({ ge_id, per_id, gp_activo: true });

        return res.status(201).json({ message: "Persona vinculada exitosamente al geriátrico." });

    } catch (error) {
        console.error("Error al vincular persona:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
};



//ver personas vinculadas activas e inactivas en mi geriatrico para asignarles roles (admin geriatrico y admin sede)
const personasVinculadasMiGeriatrico = async (req, res) => {
    try {
        const ge_id = req.session.ge_id; 
        // const usuarioEnSesion = req.session.per_id; // Usuario autenticado

        if (!ge_id) {
            return res.status(403).json({ message: "No tienes un geriátrico asignado en la sesión." });
        }

        // Obtener TODAS las personas vinculadas al geriátrico en sesión
        const personasVinculadas = await geriatricoPersonaModel.findAll({
            where: { ge_id
                // per_id: { [Op.ne]: usuarioEnSesion } // Excluir usuario en sesión
             },
            include: [
                {
                    model: personaModel,
                    as: "persona",
                    attributes: ["per_id", "per_nombre_completo", "per_documento", "per_telefono", "per_correo"]
                }
            ],
            order: [['gp_activo', 'DESC']] // Ordenar primero los activos
        });

        if (personasVinculadas.length === 0) {
            return res.status(404).json({ message: "No hay personas vinculadas a este geriátrico." });
        }

        // Extraer IDs de personas para buscar sus roles
        const personasIds = personasVinculadas.map(p => p.persona.per_id);

        // Obtener roles en geriátrico de todas las personas vinculadas
        const rolesGeriatrico = await geriatricoPersonaRolModel.findAll({
            where: { per_id: personasIds, ge_id },// Filtra por geriátrico en sesión
            include: [
                {
                    model: rolModel,
                    as: 'rol',
                    attributes: ['rol_id', 'rol_nombre']
                }
            ],
            attributes: ['per_id', 'gp_activo', 'gp_fecha_inicio', 'gp_fecha_fin', 'ge_id'],
            order: [['gp_activo', 'DESC']] // Ordenar primero los activos

        });

        // Obtener roles en sedes dentro del geriátrico en sesión
        const rolesSede = await sedePersonaRolModel.findAll({
            where: { per_id: personasIds },
            include: [
                {
                    model: sedeModel,
                    as: 'sede',
                    attributes: ['se_id', 'se_nombre'],
                    required: true,
                    include: [
                        {
                            model: geriatricoModel,
                            as: 'geriatrico',
                            attributes: ['ge_id'],
                            where: { ge_id } // Solo sedes del geriátrico en sesión
                        }
                    ]
                },
                {
                    model: rolModel,
                    as: 'rol',
                    attributes: ['rol_id', 'rol_nombre']
                }
            ],
            attributes: ['per_id', 'sp_activo', 'sp_fecha_inicio', 'sp_fecha_fin'],
            order: [['sp_activo', 'DESC']] // Ordenar primero los activos

        });

        // Mapear datos en un solo objeto por persona
        const personasConRoles = personasVinculadas.map(vinculo => {
            const per_id = vinculo.persona.per_id;
            return {
                per_id,
                per_nombre: vinculo.persona.per_nombre_completo,
                per_documento: vinculo.persona.per_documento,
                per_telefono: vinculo.persona.per_telefono,
                per_correo: vinculo.persona.per_correo,
                gp_fecha_vinculacion: vinculo.gp_fecha_vinculacion,
                gp_activo: vinculo.gp_activo,
                rolesGeriatrico: rolesGeriatrico
                    .filter(r => r.per_id === per_id)
                    .map(r => ({
                        rol_id: r.rol?.rol_id || null,
                        nombre: r.rol?.rol_nombre || "Sin rol",
                        activo: r.gp_activo,
                        ge_id: r.ge_id,
                        fechaInicio: r.gp_fecha_inicio,
                        fechaFin: r.gp_fecha_fin
                    })),
                rolesSede: rolesSede
                    .filter(r => r.per_id === per_id)
                    .map(r => ({
                        rol_id: r.rol?.rol_id || null,
                        nombre: r.rol?.rol_nombre || "Sin rol",
                        activo: r.sp_activo,
                        fechaInicio: r.sp_fecha_inicio,
                        fechaFin: r.sp_fecha_fin,
                        sede: {
                            id: r.sede.se_id,
                            nombre: r.sede.se_nombre
                        }
                    }))
            };
        });

        return res.status(200).json({
            message: "Personas vinculadas con roles encontradas",
            data: personasConRoles
        });

    } catch (error) {
        console.error("Error al obtener personas con roles:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
}; 




// roles (activos e inactivos) q tiene cada persona, visibles para admin sede y admin geriatrico para poderlos inactivar segun rol
const obtenerPersonaRolesMiGeriatricoSede = async (req, res) => {
    try {
        const { per_id } = req.params;
        const ge_id = req.session.ge_id; // Obtener el geriátrico desde la sesión

        if (!ge_id) {
            return res.status(403).json({ message: "No tienes un geriátrico asignado en la sesión." });
        }

        // Buscar persona solo con documento y nombre completo
        const persona = await personaModel.findOne({
            where: { per_id },
            attributes: ['per_documento', 'per_nombre_completo']
        });

        if (!persona) {
            return res.status(404).json({ message: "Persona no encontrada." });
        }

        // Obtener roles en geriátrico
        const rolesGeriatrico = await geriatricoPersonaRolModel.findAll({
            where: { per_id, ge_id }, // Filtra por geriátrico en sesión
            include: [
                {
                    model: rolModel,
                    as: 'rol',
                    attributes: ['rol_id', 'rol_nombre']
                },
                {
                    model: geriatricoModel,
                    as: 'geriatrico',
                    attributes: ['ge_id', 'ge_nombre', 'ge_nit']
                }
            ],
            attributes: ['gp_activo', 'gp_fecha_inicio', 'gp_fecha_fin'],
            order: [['gp_activo', 'DESC']] // Ordenar primero los activos

        });

        // Obtener roles en sede dentro del geriátrico en sesión
        const rolesSede = await sedePersonaRolModel.findAll({
            where: { per_id },
            include: [
                {
                    model: sedeModel,
                    as: 'sede',
                    attributes: ['se_id', 'se_nombre'],
                    required: true,
                    include: [
                        {
                            model: geriatricoModel,
                            as: 'geriatrico',
                            attributes: ['ge_id', 'ge_nombre', 'ge_nit'],
                            where: { ge_id } // Filtra solo sedes dentro del geriátrico en sesión
                        }
                    ]
                },
                {
                    model: rolModel,
                    as: 'rol',
                    attributes: ['rol_id', 'rol_nombre']
                }
            ],
            attributes: ['sp_activo', 'sp_fecha_inicio', 'sp_fecha_fin'],
            order: [['sp_activo', 'DESC']] // Ordenar primero los activos

        });


        return res.status(200).json({
            message: "Persona obtenida exitosamente",
            persona: {
                documento: persona.per_documento,
                nombre: persona.per_nombre_completo,
                rolesGeriatrico: rolesGeriatrico.map(rg => ({
                    rol_id: rg.rol?.rol_id || null,
                    nombre: rg.rol?.rol_nombre || "Sin rol",
                    activo: rg.gp_activo,
                    fechaInicio: rg.gp_fecha_inicio,
                    fechaFin: rg.gp_fecha_fin,
                    geriatrico: rg.geriatrico ? {
                        ge_id: rg.geriatrico.ge_id,
                        nombre: rg.geriatrico.ge_nombre,
                        nit: rg.geriatrico.ge_nit
                    } : null
                })),
                rolesSede: rolesSede.map(rs => {
                    if (!rs.sede) {
                        return {
                            rol_id: rs.rol?.rol_id || null,
                            nombre: rs.rol?.rol_nombre || "Sin rol",
                            activo: rs.sp_activo,
                            fechaInicio: rs.sp_fecha_inicio,
                            fechaFin: rs.sp_fecha_fin,
                            sede: null
                        };
                    }
                    return {
                        rol_id: rs.rol?.rol_id || null,
                        nombre: rs.rol?.rol_nombre || "Sin rol",
                        activo: rs.sp_activo,
                        fechaInicio: rs.sp_fecha_inicio,
                        fechaFin: rs.sp_fecha_fin,
                        sede: {
                            id: rs.sede.se_id,
                            nombre: rs.sede.se_nombre,
                            geriatrico: rs.sede.geriatrico ? {
                                id: rs.sede.geriatrico.ge_id,
                                nombre: rs.sede.geriatrico.ge_nombre
                            } : null
                        }
                    };
                })
            }
        });

    } catch (error) {
        console.error("Error al obtener persona:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
};





// inactivar vinculacion en geriatrico, INACTIVANDO TODOS sus roles en el geriatrico y sedes asociadas (admin geriatrico)
const inactivarVinculacionGeriatrico = async (req, res) => {
    try {
        const { per_id } = req.params;
        const ge_id = req.session.ge_id; // Geriátrico del admin en sesión

        if (!ge_id) {
            return res.status(400).json({ message: "Error: No se pudo determinar el geriátrico." });
        }

        // Iniciar una transacción
        const transaction = await sequelize.transaction();

        try {
            // Buscar la vinculación activa en geriátrico_persona
            const vinculo = await geriatricoPersonaModel.findOne({
                where: { per_id, ge_id, gp_activo: true },
                transaction
            });

            if (!vinculo) {
                await transaction.rollback();
                return res.status(404).json({ message: "La persona no tiene una vinculación activa en este geriátrico." });
            }

            // Inactivar la vinculación en geriátrico_persona
            await vinculo.update({
                gp_activo: false
            }, { transaction });

            // Obtener y actualizar roles en geriátrico_persona_rol
            const rolesGeriatrico = await geriatricoPersonaRolModel.findAll({
                where: { per_id, ge_id, gp_activo: true },
                include: [{
                    model: rolModel,
                    as: 'rol',
                    attributes: ['rol_id', 'rol_nombre']
                }],
                transaction
            });

            await geriatricoPersonaRolModel.update(
                { gp_activo: false, gp_fecha_fin: new Date() },
                { where: { per_id, ge_id, gp_activo: true }, transaction }
            );

            // Obtener sedes en las que tiene roles vinculados al geriátrico
            const rolesSede = await sedePersonaRolModel.findAll({
                where: { per_id },
                include: [
                    {
                        model: sedeModel,
                        as: 'sede',
                        attributes: ['se_id', 'se_nombre', 'ge_id'],
                        where: { ge_id } // Solo sedes del geriátrico
                    },
                    {
                        model: rolModel,
                        as: 'rol',
                        attributes: ['rol_id', 'rol_nombre']
                    }
                ],
                transaction
            });

            const idsSedes = rolesSede.map(r => r.se_id);

            // Verificar que hay sedes antes de intentar actualizar
            if (idsSedes.length > 0) {
                await sedePersonaRolModel.update(
                    { sp_activo: false, sp_fecha_fin: new Date() },
                    { where: { per_id, se_id: idsSedes, sp_activo: true }, transaction }
                );
            }

            

            // Obtener datos del geriátrico
            const geriatrico = await geriatricoModel.findOne({
                where: { ge_id },
                attributes: ['ge_id', 'ge_nombre'],
                transaction
            });

            // Confirmar la transacción
            await transaction.commit();

            return res.status(200).json({
                message: "Vinculación y roles inactivados correctamente.",
                rolesInactivados: {
                    geriatrico: rolesGeriatrico.map(rg => ({
                        id: rg.rol_id,
                        nombre: rg.rol.rol_nombre
                    })),
                    sedes: rolesSede.map(rs => ({
                        id: rs.rol_id,
                        nombre: rs.rol.rol_nombre,
                        sede: {
                            id: rs.sede.se_id,
                            nombre: rs.sede.se_nombre
                        }
                    })),
                    geriatrico: {
                        id: geriatrico.ge_id,
                        nombre: geriatrico.ge_nombre
                    }
                }
            });

        } catch (error) {
            await transaction.rollback();
            console.error("Error dentro de la transacción:", error);
            return res.status(500).json({ message: "Error en el servidor." });
        }

    } catch (error) {
        console.error("Error general al inactivar vinculación:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
};




// Reactivar vinculacion para volver asignar roles, roles como nuevos registros
const reactivarVinculacionGeriatrico = async (req, res) => {
    try {
        const { per_id } = req.params;
        const ge_id = req.session.ge_id; // Geriátrico del admin en sesión

        if (!ge_id) {
            return res.status(400).json({ message: "Error: No se pudo determinar el geriátrico." });
        }

        // Iniciar una transacción
        const transaction = await sequelize.transaction();

        try {
            // Buscar la vinculación inactiva en geriátrico_persona
            const vinculo = await geriatricoPersonaModel.findOne({
                where: { per_id, ge_id, gp_activo: false },
                transaction
            });

            if (!vinculo) {
                await transaction.rollback();
                return res.status(404).json({ message: "No hay una vinculación inactiva para reactivar." });
            }

            // Reactivar la vinculación en geriátrico_persona
            await vinculo.update(
                {gp_activo: true}, 
                { transaction }
            );

            // Obtener los datos de la persona reactivada
            const persona = await personaModel.findOne({
                where: { per_id },
                attributes: ['per_id', 'per_nombre_completo', 'per_documento'],
                transaction
            });

            if (!persona) {
                await transaction.rollback();
                return res.status(404).json({ message: "No se encontraron los datos de la persona." });
            }

            // Confirmar la transacción
            await transaction.commit();

            return res.status(200).json({
                message: "Vinculación reactivada correctamente. Los roles deben asignarse nuevamente.",
                persona: {
                    id: persona.per_id,
                    nombre_completo: persona.per_nombre_completo,
                    documento: persona.per_documento
                }
            });

        } catch (error) {
            await transaction.rollback();
            console.error("Error dentro de la transacción:", error);
            return res.status(500).json({ message: "Error en el servidor." });
        }

    } catch (error) {
        console.error("Error general al reactivar vinculación:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
};





module.exports = { vincularPersonaAGeriatrico, personasVinculadasMiGeriatrico, obtenerPersonaRolesMiGeriatricoSede, inactivarVinculacionGeriatrico, reactivarVinculacionGeriatrico  };
