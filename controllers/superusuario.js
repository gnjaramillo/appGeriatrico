const { Op } = require('sequelize');
const { matchedData } = require('express-validator');
const { personaModel, rolModel, sedeModel, sedePersonaRolModel, geriatricoPersonaRolModel } = require('../models');




const SUPER_ADMIN_ROL_ID = 1; // ID del rol super_admin (super administrador)
const GERIATRICO_GLOBAL_ID = 0; // ID del geriátrico global

const asignarRolSuperUsuario = async (req, res) => {
    try {
        const { per_id, sp_fecha_inicio, sp_fecha_fin } = matchedData(req);

        // Validar si la persona existe
        const persona = await personaModel.findByPk(per_id);
        if (!persona) {
            return res.status(404).json({ message: 'Persona no encontrada' });
        }

        

        // Verificar si el rol super usuario existe, si no, crearlo
        let rol = await rolModel.findOne({ where: { rol_id: SUPER_ADMIN_ROL_ID } });
        if (!rol) {
            rol = await rolModel.create({
                rol_id: SUPER_ADMIN_ROL_ID,
                rol_nombre: 'Super Administrador', 
                rol_descripcion: 'Rol con permisos especiales en el sistema'
            });
        }

        // Verificar si ya existe un super usuario
        const rolExistenteActivo = await geriatricoPersonaRolModel.findOne({
            where: {
                ge_id: GERIATRICO_GLOBAL_ID,
                rol_id: SUPER_ADMIN_ROL_ID,
                [Op.or]: [
                    { sp_fecha_fin: null },  
                    { sp_fecha_fin: { [Op.gt]: new Date() } }  
                ]
            }
        });

        if (rolExistenteActivo) {
            return res.status(400).json({ message: 'Ya existe un super usuario registrado.' });
        }

        // Crear el vínculo en la tabla geriatrico_persona_rol
        const nuevaVinculacion = await geriatricoPersonaRolModel.create({
            per_id,
            ge_id: GERIATRICO_GLOBAL_ID,
            rol_id: SUPER_ADMIN_ROL_ID,
            sp_fecha_inicio,
            sp_fecha_fin: sp_fecha_fin || null,
        });

        return res.status(201).json({
            message: 'Super usuario asignado correctamente.',
            data: nuevaVinculacion
        });
    } catch (error) {
        console.error('Error al asignar rol super usuario:', error);
        return res.status(500).json({
            message: 'Error al asignar rol super usuario',
            error: error.message,
        });
    }
};

module.exports = {asignarRolSuperUsuario}
