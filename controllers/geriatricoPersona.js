const { Op } = require("sequelize");
const { sequelize } = require('../config/mysql'); 
const { geriatricoPersonaModel, personaModel, rolModel, geriatricoModel, sedeModel, geriatricoPersonaRolModel, sedePersonaRolModel } = require('../models');



// admin geriatrico y admin sede deben buscar si la persona ya esta registrada en otro geriatrico
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


// ver las personas vinculadas activas en mi geriatrico para asignarles roles (admin geriatrico y admin sede)
const personasVinculadasActivasMiGeriatrico = async (req, res) => {
    try {
        const ge_id = req.session.ge_id; // Obtener el geriátrico desde la sesión
        const usuarioEnSesion = req.session.per_id; // Usuario autenticado

        if (!ge_id) {
            return res.status(403).json({ message: "No tienes un geriátrico asignado en la sesión." });
        }

        // Buscar todas las personas ACTIVAS vinculadas al geriátrico actual
        const personasVinculadas = await geriatricoPersonaModel.findAll({
            where: { ge_id, 
                gp_activo: true,
                per_id: { [Op.ne]: usuarioEnSesion } // Excluir usuario en sesión

            }, // Filtra solo los activos
            include: [
                {
                    model: personaModel,
                    as: "persona",
                    attributes: ["per_id", "per_nombre_completo", "per_documento", "per_telefono", "per_correo"]
                }
            ]
        });

        if (personasVinculadas.length === 0) {
            return res.status(404).json({ message: "No hay personas activas vinculadas a este geriátrico." });
        }

        return res.status(200).json({
            message: "Personas activas vinculadas encontradas",
            data: personasVinculadas.map((vinculo) => ({
                per_id: vinculo.persona.per_id,
                per_nombre: vinculo.persona.per_nombre_completo,
                per_documento: vinculo.persona.per_documento,
                per_telefono: vinculo.persona.per_telefono,
                per_correo: vinculo.persona.per_correo,
                gp_fecha_vinculacion: vinculo.gp_fecha_vinculacion,
                gp_activo: vinculo.gp_activo
            }))
        });

    } catch (error) {
        console.error("Error al listar personas activas vinculadas:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
};



// inactivar vinculacion en geriatrico, inactiva sus roles en el geriatrico y sedes asociadas (admin geriatrico)
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
                gp_activo: false,
                gp_fecha_fin: new Date()
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

            // Inactivar roles en sede_persona_rol
            await sedePersonaRolModel.update(
                { sp_activo: false, sp_fecha_fin: new Date() },
                { where: { per_id, se_id: idsSedes, sp_activo: true }, transaction }
            );

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








module.exports = { vincularPersonaAGeriatrico, personasVinculadasActivasMiGeriatrico, inactivarVinculacionGeriatrico  };
