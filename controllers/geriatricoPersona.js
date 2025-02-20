const { Op } = require("sequelize");
const { geriatricoPersonaModel, personaModel } = require('../models');



// admin geriatrico y admin sede deben buscar si la persona ya esta registrada en otro geriatrico
const vincularPersonaAGeriatrico = async (req, res) => {
    try {
        const { per_id } = req.body; // Solo necesitamos el ID de la persona
        const ge_id = req.session.ge_id; // Obtener el geriátrico de la sesión

        if (!ge_id) {
            return res.status(400).json({ message: "Error: No se pudo determinar el geriátrico." });
        }

        // Verificar si la persona ya está vinculada al geriátrico
        const vinculoExistente = await geriatricoPersonaModel.findOne({
            where: { per_id, ge_id }
        });

        if (vinculoExistente) {
            return res.status(400).json({ message: "La persona ya está vinculada a este geriátrico." });
        }

        // Vincular persona al geriátrico
        await geriatricoPersonaModel.create({ ge_id, per_id });

        return res.status(201).json({ message: "Persona vinculada exitosamente al geriátrico." });

    } catch (error) {
        console.error("Error al vincular persona:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
};


// ver las personas vinculadas en mi geriatrico para asignarles roles (admin geriatrico y admin sede)
const personasVinculadasActivasMiGeriatrico = async (req, res) => {
    try {
        const ge_id = req.session.ge_id; // Obtener el geriátrico desde la sesión

        if (!ge_id) {
            return res.status(403).json({ message: "No tienes un geriátrico asignado en la sesión." });
        }

        // Buscar todas las personas ACTIVAS vinculadas al geriátrico actual
        const personasVinculadas = await geriatricoPersonaModel.findAll({
            where: { ge_id, gp_activo: true }, // Filtra solo los activos
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




module.exports = { vincularPersonaAGeriatrico, personasVinculadasActivasMiGeriatrico };
