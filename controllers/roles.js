const { matchedData } = require('express-validator');
const { rolModel, sedePersonaRolModel, sedeModel, geriatricoPersonaRolModel, geriatricoModel } = require('../models');
const { limpiarSesion } = require('../utils/sessionUtils');



const crearRol = async (req, res) => {
  try {
    const data = matchedData(req);
    const { rol_nombre, rol_descripcion } = data;

    const nuevoRol = await rolModel.create({ rol_nombre, rol_descripcion });

    return res.status(201).json({
      message: 'Rol creado exitosamente',
      rol: nuevoRol,
    });

  } catch (error) {
    console.error('Error al crear el rol:', error);
    return res.status(500).json({ message: 'Error al crear el rol' });
  }
};



const obtenerRoles = async (req, res) => {
    try {
      const roles = await rolModel.findAll();
  
      if (!roles || roles.length === 0) {
        return res.status(404).json({ message: "No se han encontrado roles." });
      }
  
      return res.status(200).json({
        message: "Roles obtenidos exitosamente",
        roles,
      });
    } catch (error) {
      console.error("Error al obtener roles:", error);
      return res.status(500).json({ message: "Error al obtener roles." });
    }
};



const obtenerDetalleRol = async (req, res) => {
    try {
      const { rol_id } = req.params;
      const rol = await rolModel.findByPk(rol_id);
  
      if (!rol) {
        return res.status(404).json({ message: "No se ha encontrado el rol." });
      }
  
      return res.status(200).json({
        message: "Rol obtenido exitosamente",
        rol, 
      });
    } catch (error) {
      console.error("Error al obtener detalle del rol:", error);
      return res.status(500).json({ message: "Error al obtener el detalle del rol." });
    }
};



const actualizarRol = async (req, res) => {
  try {
    const { rol_id } = req.params;
    const { rol_nombre, rol_descripcion } = req.body; 

    const rolExistente = await rolModel.findByPk(rol_id);
    if (!rolExistente) {
      return res.status(404).json({ message: "Rol no encontrado." });
    }

    const updateData = {};
    if (rol_nombre) updateData.rol_nombre = rol_nombre;
    if (rol_descripcion) updateData.rol_descripcion = rol_descripcion;


    // Actualizar el rol
    const rolActualizado = await rolExistente.update(updateData);

    return res.status(200).json({
      message: "Rol actualizado exitosamente",
      rol: rolActualizado,
    });

  } catch (error) {
    console.error("Error al actualizar rol:", error);
    return res.status(500).json({ message: "Error al actualizar el rol." });
  }
};



// lista de sus roles visibles a cada usuario para poder seleccionar
const obtenerRolesAsignados = async (req, res) => {
  try {

      // const per_id = req.user.id;

      const { id } = req.user; // Se obtiene desde el token del middleware

      // Obtener asignaciones de roles ACTIVOS en sedes
      const rolesSede = await sedePersonaRolModel.findAll({
          where: { per_id: id, sp_activo: true },
          include: [
              { model: rolModel, as: 'rol', attributes: ['rol_id', 'rol_nombre'] },
              { model: sedeModel, as: 'sede', attributes: ['se_id', 'se_nombre'], 
                // where: { se_activo: true }  // Filtrar solo sedes activas 
              },
          ],
      });

      // Obtener asignaciones de roles ACTIVOS en geriátricos
      const rolesGeriatrico = await geriatricoPersonaRolModel.findAll({
          where: { per_id: id, gp_activo: true },
          include: [
              { model: rolModel, as: 'rol', attributes: ['rol_id', 'rol_nombre'] },
              { model: geriatricoModel, as: 'geriatrico', attributes: ['ge_id', 'ge_nombre'],
                // where: { ge_activo: true } // Filtrar solo geriátricos activos
              },
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
const seleccionarRol = async (req, res) => {
  try {
      const { rol_id, se_id, ge_id } = req.body; // Datos del rol en sede o geriátrico
      const { id } = req.user; // ID de usuario desde el token JWT

      if (!rol_id || (!se_id && !ge_id)) {
          return res.status(400).json({ message: 'Datos incompletos: se requiere rol_id y (se_id o ge_id)' });
      }

      // Limpiar sesión antes de asignar nuevos valores
      limpiarSesion(req);

      // Determinar qué modelo y condiciones usar
      const modelo = se_id ? sedePersonaRolModel : geriatricoPersonaRolModel;
      const condicion = se_id ? { per_id: id, rol_id, se_id } : { per_id: id, rol_id, ge_id };
      const include = [
          { model: rolModel, as: 'rol', attributes: ['rol_nombre'] },
          se_id
              ? { model: sedeModel, as: 'sede', attributes: ['se_nombre', 'ge_id'] }
              : { model: geriatricoModel, as: 'geriatrico', attributes: ['ge_nombre', 'ge_id'] }
      ];

      // Buscar la asignación del rol
      const asignacion = await modelo.findOne({ where: condicion, include });

      // Si no se encuentra, devolver error
      if (!asignacion || !asignacion.rol || (!asignacion.sede && !asignacion.geriatrico)) {
          return res.status(404).json({ message: 'Rol, sede o geriátrico no encontrados' });
      }

      const tipoAsignacion = se_id ? 'sede' : 'geriátrico';

      // Guardar en la sesión
      req.session.per_id = id;
      req.session.rol_id = rol_id;
      req.session.rol_nombre = asignacion.rol.rol_nombre;
      req.session[tipoAsignacion === 'sede' ? 'se_id' : 'ge_id'] = se_id || ge_id;
      req.session.nombre = se_id ? asignacion.sede.se_nombre : asignacion.geriatrico.ge_nombre;

      // Si es sede, guardar también el geriátrico asociado
      if (se_id && asignacion.sede.ge_id) {
          req.session.ge_id = asignacion.sede.ge_id;
      }

       // Guardar la sesión
       req.session.save((err) => {
        if (err) {
            console.error('Error al guardar la sesión:', err);
        } else {
            console.log('Sesión guardada correctamente:', req.session);
        }
    });

      // Respuesta exitosa
      return res.status(200).json({
          message: 'Rol seleccionado exitosamente',
          per_id: id,
          rol: asignacion.rol.rol_nombre,
          rol_id,
          ...(se_id
              ? { sede: asignacion.sede.se_nombre, se_id, ge_id: asignacion.sede.ge_id }
              : { geriátrico: asignacion.geriatrico.ge_nombre, ge_id })
      });

  } catch (error) {
      console.error('Error al seleccionar rol, sede o geriátrico:', error);
      return res.status(500).json({ message: 'Error al seleccionar rol, sede o geriátrico' });
  }
};











module.exports = { crearRol, obtenerRoles, obtenerDetalleRol, actualizarRol, obtenerRolesAsignados, seleccionarRol };
