const { Op } = require('sequelize');
const { matchedData } = require('express-validator');
const { personaModel, rolModel, sedeModel, geriatricoModel, sedePersonaRolModel, geriatricoPersonaRolModel } = require('../models');
const { tokenSign } = require('../utils/handleJwt'); 
const jwt = require('jsonwebtoken');




// asignar roles administrativos dentro de una sede (lo hace el admin geriatrico)
// ID de roles válidos para sedes
const ROLES_ADMINISTRATIVOS_SEDE = [3]; // // por ahora rol id 3: "Administrador Sede" , se pueden añadir mas roles
const ROLES_UNICOS_SEDE = [3]; // Definir explícitamente qué roles son únicos , solo 1 admin por sede?? 

const asignarRolAdminSede = async (req, res) => {
    try {
        const data = matchedData(req); // Obtén datos validados
        const { per_id, se_id, rol_id, sp_fecha_inicio, sp_fecha_fin } = data;

        // Validar que el rol solicitado sea un rol válido para sedes
        if (!ROLES_ADMINISTRATIVOS_SEDE.includes(rol_id)) {
            return res.status(400).json({ message: 'Este rol no es el indicado para asignar roles administrativos en una Sede.' });
        }

        // Verificar si la persona existe
        const persona = await personaModel.findOne({ where: { per_id } });
        if (!persona) {
            return res.status(404).json({ message: 'Persona no encontrada.' });
        }

        // Verificar si la sede existe
        const sede = await sedeModel.findOne({ where: { se_id } });
        if (!sede) {
            return res.status(404).json({ message: 'Sede no encontrada.' });
        }

        // **Validar si el rol es único por sede**
        if (ROLES_UNICOS_SEDE.includes(rol_id)){ // 3: Administrador de Sede (en caso de un unico admin por sede)
            const adminExistente = await sedePersonaRolModel.findOne({
                where: {
                    se_id,
                    rol_id,
                    [Op.or]: [
                        { sp_fecha_fin: null },
                        { sp_fecha_fin: { [Op.gt]: new Date() } } // Admin activo
                    ]
                }
            });
        
            if (adminExistente) {
                return res.status(400).json({ message: 'Esta sede ya tiene un Administrador activo asignado.' });
            }
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

        return res.status(201).json({
            message: 'Rol asignado correctamente.',
            data: nuevaVinculacion
        });
    } catch (error) {
        console.error("Error al asignar rol en la sede:", error);
        return res.status(500).json({
            message: "Error al asignar rol en la sede.",
            error: error.message
        });
    }
};



// roles dentro de la sede (asignados por el admin sede)
const asignarRolesSede = async (req, res) => {
    try {
        const data = matchedData(req);
        const { per_id, rol_id, sp_fecha_inicio, sp_fecha_fin } = data;

        // Obtener el `se_id` de la sesión
        const se_id = req.session.se_id;
        if (!se_id) {
            return res.status(403).json({ message: 'No se ha seleccionado una sede.' });
        }

        // Definir los roles que pueden ser asignados por el Administrador de Sede
        const ROLES_NO_PERMITIDOS = [1, 2, 3]; // Super Administrador, Admin Geriátrico, Admin Sede
        const ROLES_PERMITIDOS = [4, 5, 6, 7]; // Paciente, Enfermera(o), Acudiente, Colaborador

        // Validar que el rol solicitado esté permitido
        if (!ROLES_PERMITIDOS.includes(rol_id)) {
            return res.status(403).json({ message: 'Rol no permitido para asignar en esta sede.' });
        }

        // Validar que la persona exista
        const persona = await personaModel.findOne({ where: { per_id } });
        if (!persona) {
            return res.status(404).json({ message: 'Persona no encontrada.' });
        }

        // Verificar si ya tiene el rol asignado en esta sede
        const rolExistenteSede = await sedePersonaRolModel.findOne({
            where: {
                per_id,
                se_id,
                rol_id,
                [Op.or]: [
                    { sp_fecha_fin: null }, // Rol activo
                    { sp_fecha_fin: { [Op.gt]: new Date() } }, // Fecha de finalización futura
                ],
            },
        });

        if (rolExistenteSede) {
            return res.status(400).json({ message: 'Este rol ya está asignado a la persona en esta sede.' });
        }

        // Crear la nueva asignación
        const nuevaVinculacion = await sedePersonaRolModel.create({
            per_id,
            se_id,
            rol_id,
            sp_fecha_inicio,
            sp_fecha_fin: sp_fecha_fin || null, // Si no se proporciona, será indefinido
        });

        const rolNombre = await rolModel.findOne({
            where: {rol_id },
            attributes: ['rol_nombre'],
        })



        let mensajeAdicional = '';

        if (rol_id === 4) { // Paciente
            mensajeAdicional = 'Has asignado el rol Paciente. Registra los datos adicionales de la enfermera.';
        } else if (rol_id === 5) { // Enfermera(o)
            mensajeAdicional = 'Has asignado el rol Enfermera(o). Registra los datos adicionales del paciente.';
        } else if (rol_id === 6) { // Acudiente
            mensajeAdicional = 'Has asignado el rol de Acudiente. Registra los datos adicionales del acudiente.';
        }



        return res.status(200).json({
            message: 'Rol asignado correctamente.',
            nuevaVinculacion,
            rolNOmbre,
            mensajeAdicional,  
        });

    } catch (error) {
        console.error('Error al asignar rol:', error);
        return res.status(500).json({
            message: 'Error al asignar rol.',
            error: error.message,
        });
    }
}; 



// ver  personas con roles dentro de un geriatrico especifico, ruta disponible para administradores de geriatrico y/o sede
const obtenerPersonasPorSede = async (req, res) => {
    try {
        console.log("Sesión del usuario:", req.session);

        const { rol_id, se_id } = req.session;

        if (!rol_id || !se_id) {
            return res.status(400).json({ message: 'No has seleccionado un rol o ubicación válida' });
        }

        // Obtener el geriátrico al que pertenece la sede
        const sedeActual = await sedeModel.findOne({
            where: { se_id },
            attributes: ['ge_id'],
        });

        if (!sedeActual || !sedeActual.ge_id) {
            return res.status(404).json({ message: 'No se encontró la sede o su geriátrico' });
        }

        // Obtener todas las sedes del geriátrico
        const sedesDelGeriatrico = await sedeModel.findAll({
            where: { ge_id: sedeActual.ge_id },
            attributes: ['se_id'],
        });

        const idsSedes = sedesDelGeriatrico.map(s => s.se_id);

        // Obtener personas con roles en las sedes del geriátrico
        const personas = await sedePersonaRolModel.findAll({
            where: { se_id: idsSedes },
            include: [
                { model: personaModel, as: 'persona', attributes: ['per_id', 'per_nombre_completo', 'per_documento', 'per_correo', 'per_telefono'] },
                { model: rolModel, as: 'rol', attributes: ['rol_id', 'rol_nombre'] },
                { model: sedeModel, as: 'sede', attributes: ['se_id', 'se_nombre', 'se_telefono'] },
            ],
            attributes: ['sp_fecha_inicio', 'sp_fecha_fin'],
        });

        // Obtener roles asignados directamente al geriátrico
        const rolesGeriatrico = await geriatricoPersonaRolModel.findAll({
            where: { ge_id: sedeActual.ge_id },
            include: [
                { model: personaModel, as: 'persona', attributes: ['per_id', 'per_nombre_completo', 'per_documento', 'per_correo', 'per_telefono'] },
                { model: rolModel, as: 'rol', attributes: ['rol_id', 'rol_nombre'] },
                { model: geriatricoModel, as: 'geriatrico', attributes: [ 'ge_nombre'] },

            ],
            attributes: ['gp_fecha_inicio', 'gp_fecha_fin'],
        });

        //🔹 Formatear datos de personas en sedes
        const resultadoPersonas = personas.map(p => ({
            per_id: p.persona.per_id,
            per_nombre: p.persona.per_nombre_completo,
            per_documento: p.persona.per_documento,
            per_correo: p.persona.per_correo,
            per_telefono: p.persona.per_telefono,
            rol_id: p.rol.rol_id,
            rol_nombre: p.rol.rol_nombre,
            sede_id: p.sede ? p.sede.se_id : null,
            sede: p.sede ? p.sede.se_nombre : null,
            sede_tel: p.sede ? p.sede.se_telefono : null,
            sp_fecha_inicio: p.sp_fecha_inicio, 
            sp_fecha_fin: p.sp_fecha_fin 

            
        }));

        // 🔹 Formatear datos de roles del geriátrico
        const resultadoRolesGeriatrico = rolesGeriatrico.map(r => ({
            per_id: r.persona.per_id,
            per_nombre: r.persona.per_nombre_completo,
            per_documento: r.persona.per_documento,
            per_correo: r.persona.per_correo,
            per_telefono: r.persona.per_telefono,
            rol_id: r.rol.rol_id,
            rol_nombre: r.rol.rol_nombre,
            ge_nombre: r.geriatrico ? r.geriatrico.ge_nombre : null,
            gp_fecha_inicio: r.gp_fecha_inicio, 
            gp_fecha_fin: r.gp_fecha_fin 
        }));

        return res.status(200).json({
            resultadoPersonas,
            resultadoRolesGeriatrico
        });

    } catch (error) {
        console.error('Error al obtener personas por sede:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
};



// ver todas las personas con roles dentro de un geriatrico especifico, ruta disponible para administradores de geriatrico y/o sede
const obtenerPersonasPorGeriatrico = async (req, res) => {
    try {
        console.log("Sesión del usuario:", req.session);
        const { rol_id, ge_id } = req.session;

        if (!rol_id || !ge_id) {
            return res.status(400).json({ message: 'No has seleccionado un rol o ubicación válida' });
        }

        // Obtener todas las sedes del geriátrico
        const sedesDelGeriatrico = await sedeModel.findAll({
            where: { ge_id },
            attributes: ['se_id'],
        });

        const idsSedes = sedesDelGeriatrico.map(s => s.se_id);

        // Obtener personas con roles en las sedes del geriátrico        
        const personas = await sedePersonaRolModel.findAll({
            where: { se_id: idsSedes },
            include: [
                { model: personaModel, as: 'persona', attributes: ['per_id', 'per_nombre_completo', 'per_documento', 'per_correo', 'per_telefono'] },
                { model: rolModel, as: 'rol', attributes: ['rol_id', 'rol_nombre'] },
                { model: sedeModel, as: 'sede', attributes: ['se_id', 'se_nombre', 'se_telefono'] },
            ],
            attributes: ['sp_fecha_inicio', 'sp_fecha_fin'],

        });

        // Obtener roles asignados directamente al geriátrico
        const rolesGeriatrico = await geriatricoPersonaRolModel.findAll({
            where: { ge_id },
            include: [
                { model: personaModel, as: 'persona', attributes: ['per_id', 'per_nombre_completo', 'per_documento', 'per_correo', 'per_telefono'] },
                { model: rolModel, as: 'rol', attributes: ['rol_id', 'rol_nombre'] },
                { model: geriatricoModel, as: 'geriatrico', attributes: [ 'ge_nombre'] },

            ],
            attributes: ['gp_fecha_inicio', 'gp_fecha_fin'],

        });

                //🔹 Formatear datos de personas en sedes
        const resultadoPersonas = personas.map(p => ({
            per_id: p.persona.per_id,
            per_nombre: p.persona.per_nombre_completo,
            per_documento: p.persona.per_documento,
            per_correo: p.persona.per_correo,
            per_telefono: p.persona.per_telefono,
            rol_id: p.rol.rol_id,
            rol_nombre: p.rol.rol_nombre,
            sede_id: p.sede ? p.sede.se_id : null,
            sede: p.sede ? p.sede.se_nombre : null,
            sede_tel: p.sede ? p.sede.se_telefono : null,
            sp_fecha_inicio: p.sp_fecha_inicio, 
            sp_fecha_fin: p.sp_fecha_fin 

            
        }));

        // 🔹 Formatear datos de roles del geriátrico
        const resultadoRolesGeriatrico = rolesGeriatrico.map(r => ({
            per_id: r.persona.per_id,
            per_nombre: r.persona.per_nombre_completo,
            per_documento: r.persona.per_documento,
            per_correo: r.persona.per_correo,
            per_telefono: r.persona.per_telefono,
            rol_id: r.rol.rol_id,
            rol_nombre: r.rol.rol_nombre,
            ge_nombre: r.geriatrico ? r.geriatrico.ge_nombre : null,
            gp_fecha_inicio: r.gp_fecha_inicio, 
            gp_fecha_fin: r.gp_fecha_fin 
        }));

        return res.status(200).json({
            resultadoPersonas,
            resultadoRolesGeriatrico
        });



    } catch (error) {
        console.error('Error al obtener personas por geriátrico:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
};




module.exports = { asignarRolAdminSede, asignarRolesSede, obtenerPersonasPorSede, obtenerPersonasPorGeriatrico };


