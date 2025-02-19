const { Op } = require("sequelize");
const { geriatricoPersonaModel, personaModel } = require('../models');



// admin geriatrico y admin sede deben buscar si la persona ya esta registrada en otro geriatrico
const buscarVincularPersona = async (req, res) => {
    try {
        const { documento, ge_id } = req.body; // Documento de la persona y geriátrico actual

        // Buscar la persona por documento
        const persona = await personaModel.findOne({ where: { per_documento: documento } });

        if (!persona) {
            return res.status(404).json({
                message: "Persona no encontrada. ¿Desea registrarla?",
                action: "register"
            });
        }

        // Verificar si ya está vinculada a este geriátrico
        const vinculoExistente = await geriatricoPersonaModel.findOne({
            where: { per_id: persona.per_id, ge_id }
        });

        if (vinculoExistente) {
            return res.status(400).json({
                message: "La persona ya está vinculada a este geriátrico.",
                action: "none"
            });
        }

        // Verificar si está en otros geriátricos
        const otrosGeriatricos = await geriatricoPersonaModel.findOne({
            where: { per_id: persona.per_id, ge_id: { [Op.ne]: ge_id } }
        });

        if (otrosGeriatricos) {
            return res.status(200).json({
                message: "La persona ya está vinculada en otro geriátrico. ¿Desea vincularla al suyo?",
                action: "link"
            });
        }

        // 4️⃣ Vincular la persona al geriátrico si el usuario lo decide
        await geriatricoPersonaModel.create({ ge_id, per_id: persona.per_id });

        return res.status(201).json({
            message: "Persona vinculada exitosamente al geriátrico.",
            action: "success"
        });

    } catch (error) {
        console.error("Error en la búsqueda o vinculación:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
};

module.exports = { buscarVincularPersona };
