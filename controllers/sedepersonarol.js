const { Op } = require('sequelize');
const { matchedData } = require('express-validator');
const { personaModel, rolModel, sedeModel, geriatricoModel, sedePersonaRolModel, geriatricoPersonaRolModel } = require('../models');
const { tokenSign } = require('../utils/handleJwt'); 
const jwt = require('jsonwebtoken');




// asignar roles administrativos dentro de una sede (lo hace el admin geriatrico)
// ID de roles válidos para sedes
const ROLES_ADMINISTRATIVOS_SEDE = [3]; // // por ahora rol id 3: "Administrador Sede" , se pueden añadir mas roles
const ROLES_UNICOS_SEDE = [3]; // Definir explícitamente qué roles son únicos

const asignarRolAdminSede = async (req, res) => {
    try {
        const data = matchedData(req); // Obtén datos validados
        const { per_id, se_id, rol_id, sp_fecha_inicio, sp_fecha_fin } = data;

        // Validar que el rol solicitado sea un rol válido para sedes
        if (!ROLES_ADMINISTRATIVOS_SEDE.includes(rol_id)) {
            return res.status(400).json({ message: 'Este rol no es válido para asignar roles administrativos en una Sede.' });
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




// lista de sus roles visibles a cada usuario
const obtenerRolesAsignados = async (req, res) => {
    try {

        const { id } = req.user; // Se obtiene desde el token del middleware

        // Obtener asignaciones de roles en sedes
        const rolesSede = await sedePersonaRolModel.findAll({
            where: { per_id: id },
            include: [
                { model: rolModel, as: 'rol', attributes: ['rol_id', 'rol_nombre'] },
                { model: sedeModel, as: 'sede', attributes: ['se_id', 'se_nombre'] },
            ],
        });

        // Obtener asignaciones de roles en geriátricos
        const rolesGeriatrico = await geriatricoPersonaRolModel.findAll({
            where: { per_id: id },
            include: [
                { model: rolModel, as: 'rol', attributes: ['rol_id', 'rol_nombre'] },
                { model: geriatricoModel, as: 'geriatrico', attributes: ['ge_id', 'ge_nombre'] },
            ],
        });

        // Determinar el mensaje según si tiene asignaciones
        const message = (rolesSede.length === 0 && rolesGeriatrico.length === 0)
            ? 'Aún no tienes roles ni sedes/geriátricos asignados. Comunícate con un administrador.'
            : 'Selecciona un rol asignado para continuar.';


        // Construir la respuesta
        const opcionesSede = rolesSede.map(a => ({
            rol_id: a.rol_id,
            rol_nombre: a.rol.rol_nombre,
            se_id: a.se_id,
            se_nombre: a.sede.se_nombre,
        }));

        const opcionesGeriatrico = rolesGeriatrico.map(a => ({
            rol_id: a.rol_id,
            rol_nombre: a.rol.rol_nombre,
            ge_id: a.ge_id,
            ge_nombre: a.geriatrico.ge_nombre,
        }));

        return res.status(200).json({
            message,
            opcionesSede,
            opcionesGeriatrico
        });

    } catch (error) {
        console.error('Error al obtener roles:', error);
        return res.status(500).json({ message: 'Error al obtener roles' });
    }
};


  


// seleccionar uno de los roles asignados (aplica para todos, menos super usuario)
const seleccionarRolYSede = async (req, res) => {
    try {
        const { rol_id, se_id, ge_id } = req.body; // Incluimos `ge_id` para geriátricos
        const { id } = req.user; // ID del usuario obtenido desde el token del middleware

        let asignacion = null;
        let tipoAsignacion = null;

        // Verificar si se seleccionó una sede
        if (se_id) {
            asignacion = await sedePersonaRolModel.findOne({
                where: { per_id: id, rol_id, se_id },
                include: [
                    { model: rolModel, as: 'rol', attributes: ['rol_nombre'] },
                    { model: sedeModel, as: 'sede', attributes: ['se_nombre'] },
                ],
            });
            tipoAsignacion = 'sede';
        }

        // Verificar si se seleccionó un geriátrico
        if (ge_id) {
            asignacion = await geriatricoPersonaRolModel.findOne({
                where: { per_id: id, rol_id, ge_id },
                include: [
                    { model: rolModel, as: 'rol', attributes: ['rol_nombre'] },
                    { model: geriatricoModel, as: 'geriatrico', attributes: ['ge_nombre'] },
                ],
            });
            tipoAsignacion = 'geriatrico';
        }

        // Si no se encuentra asignación válida, retornar un error
        if (!asignacion || !asignacion.rol || (!asignacion.sede && !asignacion.geriatrico)) {
            return res.status(404).json({ message: 'Rol, sede o geriátrico no encontrados' });
        }

        // Guardar la información seleccionada en la sesión del usuario
        req.session.rol_id = rol_id;
        req.session[tipoAsignacion === 'sede' ? 'se_id' : 'ge_id'] = tipoAsignacion === 'sede' ? se_id : ge_id;

        // Guardar la sesión
        req.session.save((err) => {
            if (err) {
                console.error('Error al guardar la sesión:', err);
            } else {
                console.log('Sesión guardada correctamente:', req.session);
            }
        });

        // Construir la respuesta
        const response = {
            message: 'Rol seleccionado exitosamente',
            rol: asignacion.rol.rol_nombre,
            rol_id: asignacion.rol_id,
        };

        if (tipoAsignacion === 'sede') {
            response.sede = asignacion.sede.se_nombre;
            response.se_id = asignacion.se_id;
        } else {
            response.geriatrico = asignacion.geriatrico.ge_nombre;
            response.ge_id = asignacion.ge_id;
        }

        return res.status(200).json(response);
    } catch (error) {
        console.error('Error al seleccionar rol, sede o geriátrico:', error);
        return res.status(500).json({ message: 'Error al seleccionar rol, sede o geriátrico' });
    }
};



// roles asignados dentro de la sede (asignados por el admin sede)
const asignarRol = async (req, res) => {
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


        return res.status(200).json({
            message: 'Rol asignado correctamente.',
            nuevaVinculacion,
        });
    } catch (error) {
        console.error('Error al asignar rol:', error);
        return res.status(500).json({
            message: 'Error al asignar rol.',
            error: error.message,
        });
    }
};



// trae todos los roles dentro de una sede especifica, omite el del admin sede
const obtenerPersonasConRoles = async (req, res) => {
    try {
         // Obtener el `se_id` de la sesión
         const se_id = req.session.se_id;

        if (!se_id) return res.status(403).json({ message: 'No se ha seleccionado una sede' });

        // listado de personas con sus roles en la sede
        const personasConRoles = await sedePersonaRolModel.findAll({
            where: { se_id },
            include: [
                {
                    model: personaModel, 
                    as: 'persona',
                    attributes: ['per_nombre_completo', 'per_usuario', 'per_telefono'] // Atributos básicos
                },
                {
                    model: rolModel, 
                    as: 'rol',
                    attributes: ['rol_nombre'],
                    where: {
                        rol_nombre: { [Op.ne]: 'administrador sede' } // Excluir el rol "administrador sede"
                    }
                }
            
            ]
        });

        return res.status(200).json({
            message: 'Listado de personas con roles',
            data: personasConRoles
        });
    } catch (error) {
        console.error("Error al obtener el listado de personas con roles:", error);
        return res.status(500).json({
            message: "Error al obtener el listado de personas con roles",
            error: error.message,
        });
    }
};





module.exports = { asignarRolAdminSede, asignarRol, obtenerRolesAsignados, seleccionarRolYSede, obtenerPersonasConRoles };


