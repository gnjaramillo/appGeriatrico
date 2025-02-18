const { Op } = require('sequelize');
const { matchedData } = require('express-validator');
const { personaModel, rolModel, sedeModel, geriatricoModel, sedePersonaRolModel, geriatricoPersonaRolModel } = require('../models');
const { tokenSign } = require('../utils/handleJwt'); 
const jwt = require('jsonwebtoken');




// ID de roles válidos para geriátricos, los asigna el super admin
const ROLES_GERIATRICO = [2]; // por ahora rol id 2: "Administrador Geriátrico" , se pueden añadir mas roles

// Controlador para asignar roles de geriátrico
const asignarRolGeriatrico = async (req, res) => {
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

        // Verificar si el geriátrico existe
        const geriatrico = await geriatricoModel.findOne({ where: { ge_id } });
        if (!geriatrico) {
            return res.status(404).json({ message: 'Geriátrico no encontrado.' });
        }

        // Verificar si el geriátrico está activo
        if (!geriatrico.ge_activo) {
            return res.status(400).json({ message: 'El geriátrico está inactivo. Actualmente, no se pueden asignar roles.' });
        }

        // Verificar si el rol ya está asignado a la persona en este geriátrico
        const rolExistente = await geriatricoPersonaRolModel.findOne({
            where: {
                per_id,
                ge_id,
                rol_id,
                [Op.or]: [
                    { gp_fecha_fin: null },
                    { gp_fecha_fin: { [Op.gt]: new Date() } }
                ]
            }
        });

        if (rolExistente) {
            return res.status(400).json({ message: 'La persona ya tiene este rol asignado en este Geriátrico.' });
        }

        // Asignar el rol a la persona en el geriátrico
        const nuevaVinculacion = await geriatricoPersonaRolModel.create({
            per_id,
            ge_id,
            rol_id,
            gp_fecha_inicio,
            gp_fecha_fin: gp_fecha_fin || null
        });

        return res.status(201).json({
            message: 'Rol asignado correctamente.',
            data: nuevaVinculacion
        });
        
    } catch (error) {
        console.error("Error al asignar rol en el geriátrico:", error);
        return res.status(500).json({
            message: "Error al asignar rol en el geriátrico.",
            error: error.message
        });
    }
};

module.exports = { asignarRolGeriatrico };


