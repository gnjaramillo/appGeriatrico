const { matchedData } = require('express-validator');
const { rolModel } = require('../models');


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


/* Filtrar roles permitidos (por rol_nombre) para ser asignados dentro de las sedes
los asigna el administrador de sede */
const obtenerRolesSede = async (req, res) => {
  try {
      // Obtener todos los roles
      const roles = await rolModel.findAll();

      // Filtrar los roles no permitidos
      const rolesPermitidos = roles.filter(role => role.rol_nombre !== 'Super Administrador' && role.rol_nombre !== 'administrador sede');

      // Responder con los roles permitidos
      return res.status(200).json({
          message: 'Roles obtenidos exitosamente',
          roles: rolesPermitidos,
      });
  } catch (error) {
      console.error("Error al obtener roles:", error);
      return res.status(500).json({
          message: "Error al obtener roles",
          error: error.message,
      });
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









module.exports = { crearRol, obtenerRoles, obtenerDetalleRol, actualizarRol, obtenerRolesSede };
