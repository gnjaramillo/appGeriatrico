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



// lista de sus roles visibles a cada usuario
const obtenerRolesAsignados = async (req, res) => {
  try {

      // const per_id = req.user.id;


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
const seleccionarRol = async (req, res) => {
  try {
      const { rol_id, se_id, ge_id } = req.body; // rol en sede o geriatrico
      const { id } = req.user; // desde el token jwt

      let asignacion = null;
      let tipoAsignacion = null;

      // Limpiar sesión antes de asignar nuevos valores
      limpiarSesion(req);

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
     
        // Guardar los datos en la sesión
        req.session.rol_id = rol_id;
        req.session.rol_nombre = asignacion.rol.rol_nombre;
        req.session[tipoAsignacion === 'sede' ? 'se_id' : 'ge_id'] = tipoAsignacion === 'sede' ? se_id : ge_id;
        req.session.nombre = tipoAsignacion === 'sede' ? asignacion.sede.se_nombre : asignacion.geriatrico.ge_nombre;

        // Guardar la sesión
        req.session.save((err) => {
            if (err) {
                console.error('Error al guardar la sesión:', err);
            } else {
                console.log('Sesión guardada correctamente:', req.session);
            }
        });

        return res.status(200).json({
            message: 'Rol seleccionado exitosamente',
            rol: asignacion.rol.rol_nombre,
            rol_id: asignacion.rol_id,
            ...(tipoAsignacion === 'sede' ? { sede: asignacion.sede.se_nombre, se_id: asignacion.se_id } : { geriatrico: asignacion.geriatrico.ge_nombre, ge_id: asignacion.ge_id })
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









module.exports = { crearRol, obtenerRoles, obtenerDetalleRol, actualizarRol, obtenerRolesAsignados, seleccionarRol };
