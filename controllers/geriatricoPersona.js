const { Op } = require("sequelize");
const { sequelize } = require('../config/mysql'); 
const { geriatricoPersonaModel, personaModel, rolModel, geriatricoModel, sedeModel, geriatricoPersonaRolModel, sedePersonaRolModel } = require('../models');



// para ver en que geriatricos esta vinculada una persona (super admin) OPCIONAL PREGUNTARRRRRRRRRRRRRRRRRRR ????????
const vinculoGeriatricoPersona = async (req, res) => {
    try {
        const { per_id } = req.params;

        if (!per_id) {
            return res.status(400).json({ message: "Se requiere el ID de la persona en los parámetros." });
        }

        // Obtener TODOS los geriátricos a los que está vinculada la persona
        const vinculaciones = await geriatricoPersonaModel.findAll({
            where: { per_id },
            include: [
                {
                    model: geriatricoModel,
                    as: "geriatrico",
                    attributes: ["ge_id", "ge_nombre", "ge_nit"]
                }
            ],
            attributes: ["gp_fecha_vinculacion", "gp_activo"], // Datos de la vinculación
            order: [["gp_activo", "DESC"], ["gp_fecha_vinculacion", "DESC"]] // Activos primero y luego por fecha
        });

        if (vinculaciones.length === 0) {
            return res.status(404).json({ message: "Esta persona no está vinculada a ningún geriátrico." });
        }

        // Mapear la respuesta
        const geriatricoVinculado = vinculaciones.map(vinculo => ({
            ge_id: vinculo.geriatrico.ge_id,
            ge_nombre: vinculo.geriatrico.ge_nombre,
            ge_nit: vinculo.geriatrico.ge_nit,
            gp_fecha_vinculacion: vinculo.gp_fecha_vinculacion,
            gp_activo: vinculo.gp_activo // Estado de la vinculación
        }));

        return res.status(200).json({
            message: "Geriátricos vinculados encontrados",
            data: geriatricoVinculado
        });

    } catch (error) {
        console.error("Error al obtener geriátricos vinculados:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
};





//  ver personas vinculadas en cada geriatrico en particular (vista super admin)
const personasVinculadasPorGeriatrico = async (req, res) => {
    try {
        const { ge_id } = req.params;

        if (!ge_id) {
            return res.status(400).json({ message: "Se requiere el ID del geriátrico en los parámetros." });
        }

        // Obtener TODAS las personas vinculadas al geriátrico según el ID proporcionado
        const personasVinculadas = await geriatricoPersonaModel.findAll({
            where: { ge_id },
            include: [
                {
                    model: personaModel,
                    as: "persona",
                    attributes: ["per_id", "per_nombre_completo", "per_foto", "per_documento", "per_genero", "per_telefono", "per_correo"]
                }
            ],
            attributes: ["gp_fecha_vinculacion", "gp_activo"], // Datos de la vinculación
            order: [['gp_activo', 'DESC']] // Ordenar primero los activos
        });

        if (personasVinculadas.length === 0) {
            return res.status(404).json({ message: "No hay personas vinculadas a este geriátrico." });
        }

        // Mapear datos en un solo objeto por persona sin roles
        const personasVinculadasGer = personasVinculadas.map(vinculo => ({
            per_id: vinculo.persona.per_id,
            per_nombre: vinculo.persona.per_nombre_completo,
            per_foto: vinculo.persona.per_foto,
            per_documento: vinculo.persona.per_documento,
            per_telefono: vinculo.persona.per_telefono,
            per_genero: vinculo.persona.per_genero,
            per_correo: vinculo.persona.per_correo,
            gp_fecha_vinculacion: vinculo.gp_fecha_vinculacion,
            gp_activo: vinculo.gp_activo // Persona activa o inactiva en geriátrico
        }));

        return res.status(200).json({
            message: "Personas vinculadas encontradas",
            data: personasVinculadasGer
        });

    } catch (error) {
        console.error("Error al obtener personas vinculadas:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
};





// vista super admin, para ver roles de una persona vinculadas en cada geriatrico en particular
const obtenerPersonaRolesPorGeriatrico = async (req, res) => {
    try {
        const { per_id, ge_id } = req.params;

        if (!per_id || !ge_id) {
            return res.status(400).json({ message: "Se requieren los IDs de la persona y el geriátrico en los parámetros." });
        }

        // Buscar datos básicos de la persona
        const persona = await personaModel.findOne({
            where: { per_id },
            attributes: ['per_documento', 'per_nombre_completo']
        });

        if (!persona) {
            return res.status(404).json({ message: "Persona no encontrada." });
        }

        // Obtener roles en el geriátrico específico
        const rolesGeriatrico = await geriatricoPersonaRolModel.findAll({
            where: { per_id, ge_id },
            include: [
                {
                    model: rolModel,
                    as: 'rol',
                    attributes: ['rol_id', 'rol_nombre']
                }
            ],
            attributes: ['gp_activo', 'gp_fecha_inicio', 'gp_fecha_fin'],
            order: [['gp_activo', 'DESC']] // Ordenamos primero los activos
        });

        // 🔹 Agrupar roles del geriátrico por rol_id
        let rolesGeriatricoAgrupados = {};

        rolesGeriatrico.forEach(rg => {
            const { rol_id, rol_nombre } = rg.rol || { rol_id: null, rol_nombre: "Sin rol" };

            if (!rolesGeriatricoAgrupados[rol_id]) {
                rolesGeriatricoAgrupados[rol_id] = {
                    rol_id,
                    rol_nombre,
                    periodos: []
                };
            }

            rolesGeriatricoAgrupados[rol_id].periodos.push({
                activo: rg.gp_activo,
                fechaInicio: rg.gp_fecha_inicio,
                fechaFin: rg.gp_fecha_fin
            });
        });


        // Obtener roles en sedes del geriátrico
        const rolesSede = await sedePersonaRolModel.findAll({
            where: { per_id },
            include: [
                {
                    model: sedeModel,
                    as: 'sede',
                    attributes: ['se_id', 'se_nombre'],
                    where: { ge_id } // Filtrar solo sedes del geriátrico seleccionado
                },
                {
                    model: rolModel,
                    as: 'rol',
                    attributes: ['rol_id', 'rol_nombre']
                }
            ],
            attributes: ['sp_activo', 'sp_fecha_inicio', 'sp_fecha_fin'],
            order: [['sp_activo', 'DESC']] // Ordenamos primero los activos
        });

        // Agrupar roles por sede y por rol dentro de cada sede
        let sedesAgrupadas = {};

        rolesSede.forEach(rs => {
            const { se_id, se_nombre } = rs.sede;
            const { rol_id, rol_nombre } = rs.rol || { rol_id: null, rol_nombre: "Sin rol" };

            if (!sedesAgrupadas[se_id]) {
                sedesAgrupadas[se_id] = {
                    se_id,
                    se_nombre,
                    roles: {}
                };
            }

            if (!sedesAgrupadas[se_id].roles[rol_id]) {
                sedesAgrupadas[se_id].roles[rol_id] = {
                    rol_id,
                    rol_nombre,
                    periodos: []
                };
            }

            sedesAgrupadas[se_id].roles[rol_id].periodos.push({
                rol_activo: rs.sp_activo,
                fechaInicio: rs.sp_fecha_inicio,
                fechaFin: rs.sp_fecha_fin
            });
        });

        // Convertir los objetos en arrays para la respuesta JSON
        return res.status(200).json({
            message: "Roles de la persona en el geriátrico obtenidos exitosamente",
            persona: {
                documento: persona.per_documento,
                nombre: persona.per_nombre_completo,
                rolesGeriatrico: Object.values(rolesGeriatricoAgrupados), // 🔹 Ahora agrupados por rol
                sedes: Object.values(sedesAgrupadas).map(sede => ({
                    se_id: sede.se_id,
                    se_nombre: sede.se_nombre,
                    roles: Object.values(sede.roles)
                }))
            }
        });
        
    } catch (error) {
        console.error("Error al obtener roles de la persona en el geriátrico:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
};





//(admin geriatrico y admin sede) ver personas vinculadas activas e inactivas en MI geriatrico para asignarles roles 
const personasVinculadasMiGeriatrico = async (req, res) => {
    try {
        const ge_id = req.session.ge_id;

        if (!ge_id) {
            return res.status(403).json({ message: "No tienes un geriátrico asignado en la sesión." });
        }

        // Obtener TODAS las personas vinculadas al geriátrico en sesión
        const personasVinculadas = await geriatricoPersonaModel.findAll({
            where: { ge_id },
            include: [
                {
                    model: personaModel,
                    as: "persona",
                    attributes: ["per_id", "per_nombre_completo", "per_foto", "per_documento",  "per_genero", "per_telefono", "per_correo"]
                }
            ],
            attributes: ["gp_fecha_vinculacion", "gp_activo"], // Datos de la vinculación
            order: [['gp_activo', 'DESC']] // Ordenar primero los activos
        });

        if (personasVinculadas.length === 0) {
            return res.status(404).json({ message: "No hay personas vinculadas a este geriátrico." });
        }

        // Mapear datos en un solo objeto por persona sin roles
        const personasVinculadasGer = personasVinculadas.map(vinculo => ({
            per_id: vinculo.persona.per_id,
            per_nombre: vinculo.persona.per_nombre_completo,
            per_foto: vinculo.persona.per_foto,
            per_documento: vinculo.persona.per_documento,
            per_telefono: vinculo.persona.per_telefono,
            per_genero:vinculo.persona.per_genero,
            per_correo: vinculo.persona.per_correo,
            gp_fecha_vinculacion: vinculo.gp_fecha_vinculacion,
            gp_activo: vinculo.gp_activo // Persona activa o inactiva en geriátrico
        }));

        return res.status(200).json({
            message: "Personas vinculadas encontradas",
            data: personasVinculadasGer
        });

    } catch (error) {
        console.error("Error al obtener personas vinculadas:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
};





// (admin sede y admin geriatrico) roles activos e inactivos de cada persona, para poderlos inactivar segun rol
const obtenerPersonaRolesMiGeriatricoSede = async (req, res) => {
    try {
        const { per_id } = req.params;
        const ge_id = req.session.ge_id;

        if (!ge_id) {
            return res.status(403).json({ message: "No tienes un geriátrico asignado en la sesión." });
        }

        const vinculacion = await geriatricoPersonaModel.findOne({ where: { per_id, ge_id } });

        if (!vinculacion) {
            return res.status(403).json({ message: "Esta persona no está vinculada a tu geriátrico." });
        }

        const persona = await personaModel.findOne({
            where: { per_id },
            attributes: ['per_documento', 'per_nombre_completo']
        });

        if (!persona) {
            return res.status(404).json({ message: "Persona no encontrada." });
        }

        const rolesGeriatrico = await geriatricoPersonaRolModel.findAll({
            where: { per_id, ge_id },
            include: [{ model: rolModel, as: 'rol', attributes: ['rol_id', 'rol_nombre'] }],
            attributes: ['gp_activo', 'gp_fecha_inicio', 'gp_fecha_fin'],
            order: [['gp_activo', 'DESC']]
        });

        const sedes = await sedeModel.findAll({
            where: { ge_id },
            attributes: ['se_id', 'se_nombre']
        });

        const sedeIds = sedes.map(sede => sede.se_id);

        const rolesSede = await sedePersonaRolModel.findAll({
            where: { per_id, se_id: sedeIds },
            include: [
                { model: sedeModel, as: 'sede', attributes: ['se_id', 'se_nombre', 'ge_id'] },
                { model: rolModel, as: 'rol', attributes: ['rol_id', 'rol_nombre'] }
            ],
            attributes: ['sp_activo', 'sp_fecha_inicio', 'sp_fecha_fin'],
            order: [['sp_activo', 'DESC']]
        });


        // 🔹 Agrupar roles del geriátrico por rol_id
        const rolesGeriatricoAgrupados = {};

        rolesGeriatrico.forEach(rg => {
            const rolId = rg.rol?.rol_id || null;
            const rolNombre = rg.rol?.rol_nombre || "Sin rol";
        
            if (!rolesGeriatricoAgrupados[rolId]) {
                rolesGeriatricoAgrupados[rolId] = {
                    rol_id: rolId,
                    rol_nombre: rolNombre,
                    periodos: []
                };
            }
        
            rolesGeriatricoAgrupados[rolId].periodos.push({
                activo: rg.gp_activo,
                fechaInicio: rg.gp_fecha_inicio,
                fechaFin: rg.gp_fecha_fin
            });
        });


        // 🔹 Agrupar roles dentro de cada sede
        const sedesAgrupadas = sedes.map(sede => {
            const rolesAgrupados = {};

            // Recorrer los roles y agrupar por rol_id dentro de cada sede
            rolesSede.forEach(rs => {
                if (rs.sede.se_id === sede.se_id) {
                    const rolId = rs.rol?.rol_id || null;
                    const rolNombre = rs.rol?.rol_nombre || "Sin rol";

                    if (!rolesAgrupados[rolId]) {
                        rolesAgrupados[rolId] = {
                            rol_id: rolId,
                            rol_nombre: rolNombre,
                            periodos: []
                        };
                    }

                    rolesAgrupados[rolId].periodos.push({
                        activo: rs.sp_activo,
                        fechaInicio: rs.sp_fecha_inicio,
                        fechaFin: rs.sp_fecha_fin
                    });
                }
            });

            return {
                se_id: sede.se_id,
                se_nombre: sede.se_nombre,
                ge_id: ge_id,
                roles: Object.values(rolesAgrupados)
            };
        }).filter(sede => sede.roles.length > 0);

        return res.status(200).json({
            message: "Persona obtenida exitosamente",
            persona: {
                documento: persona.per_documento,
                nombre: persona.per_nombre_completo,
                rolesGeriatrico: Object.values(rolesGeriatricoAgrupados), // 🔹 Ahora agrupados por rol
                sedes: sedesAgrupadas
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




// Reactivar vinculacion para volver asignar roles, roles como nuevos registros (admin geriatrico)
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





module.exports = { vinculoGeriatricoPersona, personasVinculadasPorGeriatrico, obtenerPersonaRolesPorGeriatrico, personasVinculadasMiGeriatrico, obtenerPersonaRolesMiGeriatricoSede, inactivarVinculacionGeriatrico, reactivarVinculacionGeriatrico  };








// vista super admin, para ver roles de una persona vinculadas en cada geriatrico en particular
/* const obtenerPersonaRolesPorGeriatrico = async (req, res) => {
    try {
        const { per_id, ge_id } = req.params;

        if (!per_id || !ge_id) {
            return res.status(400).json({ message: "Se requieren los IDs de la persona y el geriátrico en los parámetros." });
        }

        // Buscar datos básicos de la persona
        const persona = await personaModel.findOne({
            where: { per_id },
            attributes: ['per_documento', 'per_nombre_completo']
        });

        if (!persona) {
            return res.status(404).json({ message: "Persona no encontrada." });
        }

        // Obtener roles en el geriátrico específico
        const rolesGeriatrico = await geriatricoPersonaRolModel.findAll({
            where: { per_id, ge_id },
            include: [
                {
                    model: rolModel,
                    as: 'rol',
                    attributes: ['rol_id', 'rol_nombre']
                }
            ],
            attributes: ['gp_activo', 'gp_fecha_inicio', 'gp_fecha_fin'],
            order: [['gp_activo', 'DESC']]
        });


        // Obtener roles en sedes del geriátrico
        const rolesSede = await sedePersonaRolModel.findAll({
            where: { per_id },
            include: [
                {
                    model: sedeModel,
                    as: 'sede',
                    attributes: ['se_id', 'se_nombre'],
                    where: { ge_id } // Filtrar solo sedes del geriátrico seleccionado
                },
                {
                    model: rolModel,
                    as: 'rol',
                    attributes: ['rol_id', 'rol_nombre']
                }
            ],
            attributes: ['sp_activo', 'sp_fecha_inicio', 'sp_fecha_fin'],
            order: [['sp_activo', 'DESC']]
        });

        // Agrupar roles por sede
        let sedesAgrupadas = {};

        rolesSede.forEach(rs => {
            const { se_id, se_nombre } = rs.sede;

            if (!sedesAgrupadas[se_id]) {
                sedesAgrupadas[se_id] = {
                    se_id,
                    se_nombre,
                    roles: []
                };
            }

            sedesAgrupadas[se_id].roles.push({
                rol_id: rs.rol?.rol_id || null,
                rol_nombre: rs.rol?.rol_nombre || "Sin rol",
                activoRolSede: rs.sp_activo,
                fechaInicio: rs.sp_fecha_inicio,
                fechaFin: rs.sp_fecha_fin
            });
        });

        return res.status(200).json({
            message: "Roles de la persona en el geriátrico obtenidos exitosamente",
            persona: {
                documento: persona.per_documento,
                nombre: persona.per_nombre_completo,
                rolesGeriatrico: rolesGeriatrico.map(rg => ({
                    rol_id: rg.rol.rol_id,
                    rol_nombre: rg.rol.rol_nombre,
                    activoRolGer: rg.gp_activo,
                    fechaInicio: rg.gp_fecha_inicio,
                    fechaFin: rg.gp_fecha_fin
                })),
                sedes: Object.values(sedesAgrupadas) // Convertimos el objeto en un array
            }
        });

    } catch (error) {
        console.error("Error al obtener roles de la persona en el geriátrico:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
};
 */




/* const obtenerPersonaRolesMiGeriatricoSede = async (req, res) => {
    try {
        const { per_id } = req.params;
        const ge_id = req.session.ge_id; // Obtener el geriátrico desde la sesión

        if (!ge_id) {
            return res.status(403).json({ message: "No tienes un geriátrico asignado en la sesión." });
        }

        // Verificar si la persona está vinculada al geriátrico
        const vinculacion = await geriatricoPersonaModel.findOne({ 
            where: { per_id, ge_id }
        });

        if (!vinculacion) {
            return res.status(403).json({ message: "Esta persona no está vinculada a tu geriátrico." });
        }

        // Buscar datos básicos de la persona
        const persona = await personaModel.findOne({
            where: { per_id },
            attributes: ['per_documento', 'per_nombre_completo']
        });

        if (!persona) {
            return res.status(404).json({ message: "Persona no encontrada." });
        }

        // Obtener roles en geriátrico
        const rolesGeriatrico = await geriatricoPersonaRolModel.findAll({
            where: { per_id, ge_id }, // Filtra solo por geriátrico en sesión
            include: [
                {
                    model: rolModel,
                    as: 'rol',
                    attributes: ['rol_id', 'rol_nombre']
                },
                {
                    model: geriatricoModel,
                    as: 'geriatrico',
                    attributes: ['ge_id']
                }
            ],
            attributes: ['gp_activo', 'gp_fecha_inicio', 'gp_fecha_fin'],
            order: [['gp_activo', 'DESC']] // Ordenar primero los activos
        });


        // 🔹 Obtener todas las sedes del geriátrico en sesión
        const sedes = await sedeModel.findAll({
            where: { ge_id }, 
            attributes: ['se_id', 'se_nombre']
        });

        const sedeIds = sedes.map(sede => sede.se_id); // Obtener solo los IDs de las sedes


        // Obtener roles en sedes dentro del geriátrico en sesión
        const rolesSede = await sedePersonaRolModel.findAll({
            where: { per_id, se_id: sedeIds },
            include: [
                {
                    model: sedeModel,
                    as: 'sede',
                    attributes: ['se_id', 'se_nombre', 'ge_id'],
                },
                {
                    model: rolModel,
                    as: 'rol',
                    attributes: ['rol_id', 'rol_nombre']
                }
            ],
            attributes: ['sp_id', 'sp_activo', 'sp_fecha_inicio', 'sp_fecha_fin'],
            order: [['sp_activo', 'DESC']]
        });

        return res.status(200).json({
            message: "Persona obtenida exitosamente",
            persona: {
                documento: persona.per_documento,
                nombre: persona.per_nombre_completo,
                rolesGeriatrico: rolesGeriatrico.map(rg => ({
                    rol_id: rg.rol.rol_id,
                    rol_nombre: rg.rol.rol_nombre,
                    activoRolGer: rg.gp_activo, // Estado del rol en geriátrico
                    fechaInicio: rg.gp_fecha_inicio,
                    fechaFin: rg.gp_fecha_fin,                    
                    ge_id: rg.geriatrico.ge_id,
                    
                })),
                rolesSede: rolesSede.map(rs => ({
                    sp_id: rs.sp_id,
                    rol_id: rs.rol?.rol_id || null,
                    rol_nombre: rs.rol?.rol_nombre || "Sin rol",
                    activoRolSede: rs.sp_activo, // Estado del rol en sede
                    fechaInicio: rs.sp_fecha_inicio,
                    fechaFin: rs.sp_fecha_fin,
                    se_id: rs.sede.se_id,
                    se_nombre: rs.sede.se_nombre,
                    ge_id: rs.sede.ge_id,
                }))
            }
        });

    } catch (error) {
        console.error("Error al obtener persona:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
}; */




/* const obtenerPersonaRolesMiGeriatricoSede = async (req, res) => {
    try {
        const { per_id } = req.params;
        const ge_id = req.session.ge_id; // Obtener el geriátrico desde la sesión

        if (!ge_id) {
            return res.status(403).json({ message: "No tienes un geriátrico asignado en la sesión." });
        }

        // Verificar si la persona está vinculada al geriátrico
        const vinculacion = await geriatricoPersonaModel.findOne({ where: { per_id, ge_id } });

        if (!vinculacion) {
            return res.status(403).json({ message: "Esta persona no está vinculada a tu geriátrico." });
        }

        // Buscar datos básicos de la persona
        const persona = await personaModel.findOne({
            where: { per_id },
            attributes: ['per_documento', 'per_nombre_completo']
        });

        if (!persona) {
            return res.status(404).json({ message: "Persona no encontrada." });
        }

        // Obtener roles en geriátrico
        const rolesGeriatrico = await geriatricoPersonaRolModel.findAll({
            where: { per_id, ge_id },
            include: [{ model: rolModel, as: 'rol', attributes: ['rol_id', 'rol_nombre'] }],
            attributes: ['gp_activo', 'gp_fecha_inicio', 'gp_fecha_fin'],
            order: [['gp_activo', 'DESC']]
        });

        // Obtener todas las sedes del geriátrico en sesión
        const sedes = await sedeModel.findAll({
            where: { ge_id },
            attributes: ['se_id', 'se_nombre']
        });

        const sedeIds = sedes.map(sede => sede.se_id);

        // Obtener roles en sedes dentro del geriátrico en sesión
        const rolesSede = await sedePersonaRolModel.findAll({
            where: { per_id, se_id: sedeIds },
            include: [
                { model: sedeModel, as: 'sede', attributes: ['se_id', 'se_nombre', 'ge_id'] },
                { model: rolModel, as: 'rol', attributes: ['rol_id', 'rol_nombre'] }
            ],
            attributes: ['sp_activo', 'sp_fecha_inicio', 'sp_fecha_fin'],
            order: [['sp_activo', 'DESC']]
        });

        // 🔹 Agrupar roles por sede
        const sedesAgrupadas = sedes.map(sede => {
            return {
                se_id: sede.se_id,
                se_nombre: sede.se_nombre,
                ge_id: ge_id,
                roles: rolesSede
                    .filter(rs => rs.sede.se_id === sede.se_id)
                    .map(rs => ({
                        rol_id: rs.rol?.rol_id || null,
                        rol_nombre: rs.rol?.rol_nombre || "Sin rol",
                        activo: rs.sp_activo,
                        fechaInicio: rs.sp_fecha_inicio,
                        fechaFin: rs.sp_fecha_fin
                    }))
            };
        }).filter(sede => sede.roles.length > 0); // Filtrar solo las sedes que tengan roles asignados

        return res.status(200).json({
            message: "Persona obtenida exitosamente",
            persona: {
                documento: persona.per_documento,
                nombre: persona.per_nombre_completo,
                rolesGeriatrico: rolesGeriatrico.map(rg => ({
                    rol_id: rg.rol.rol_id,
                    rol_nombre: rg.rol.rol_nombre,
                    activo: rg.gp_activo,
                    fechaInicio: rg.gp_fecha_inicio,
                    fechaFin: rg.gp_fecha_fin
                })),
                sedes: sedesAgrupadas
            }
        });

    } catch (error) {
        console.error("Error al obtener persona:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
}; */

