const { matchedData } = require('express-validator');
const { sedeModel, geriatricoModel, geriatricoPersonaRolModel, personaModel } = require('../models');
const { subirImagenACloudinary } = require('../utils/handleCloudinary'); 
const cloudinary = require('../config/cloudinary'); 


// (super admin)
const crearGeriatrico = async (req, res) => {
    try {

        // Obtener los datos validados del formulario
        const data = matchedData(req);
        const { ge_nombre, ge_nit, ge_color_principal, ge_color_secundario, ge_color_terciario } = data;

        // Verificar si ya existe un geriátrico con el mismo NIT
        const existeGeriatrico = await geriatricoModel.findOne({ where: { ge_nit } });
        if (existeGeriatrico) {
            return res.status(400).json({ message: "Ya existe un geriátrico con este NIT" });
        }

        // Verificar si hay un archivo en la solicitud
        if (!req.file) {
            return res.status(400).json({ message: "El logo del geriátrico es obligatorio." });
        }

        // Llamada a la función
        const result = await subirImagenACloudinary(req.file, "geriatricos"); 



        // Crear el geriátrico en la base de datos con la URL de la imagen subida a Cloudinary
        const nuevoGeriatrico = await geriatricoModel.create({
            ge_logo: result.secure_url, // Guardar la URL de Cloudinary en la BD
            ge_nombre,
            ge_nit,
            ge_color_principal,
            ge_color_secundario,
            ge_color_terciario
        });

        return res.status(201).json({
            message: "Geriátrico creado exitosamente",
            geriatrico: nuevoGeriatrico,
        });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al crear el geriátrico" });
    }
};



// obtener todos los geriatricos
const obtenerGeriatricos = async (req, res) => {
  try {
    // Obtener todos los geriátricos de la base de datos
    const geriatricos = await geriatricoModel.findAll({
      include: [
        {
          model: sedeModel, // Modelo de sedes
          as: "sedes", // Alias definido en la asociación
        },
      ],
    });

    // Verificar si existen geriátricos en la base de datos
    if (geriatricos.length === 0) {
      return res.status(404).json({ message: "No se han encontrado geriátricos." });
    }

    return res.status(200).json({
      message: "Geriátricos obtenidos exitosamente",
      geriatricos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener los geriátricos" });
  }
};



// Obtener los geriátricos activos junto con sus sedes (super admin)
const obtenerGeriatricosActivos = async (req, res) => {
  try {
    const geriatricos = await geriatricoModel.findAll({
      where: { ge_activo: true }, // Filtrar solo los activos
      include: [
        {
          model: sedeModel, // Incluir las sedes
          as: "sedes",
        },
      ],
    });

    if (geriatricos.length === 0) {
      return res.status(404).json({ message: "No hay geriátricos activos." });
    }

    return res.status(200).json({
      message: "Geriátricos activos obtenidos exitosamente",
      geriatricos,
    });
  } catch (error) {
    console.error("Error al obtener geriátricos activos:", error);
    return res.status(500).json({ message: "Error al obtener los geriátricos activos" });
  }
};



// Obtener los geriátricos inactivos junto con sus sedes (super admin)
const obtenerGeriatricosInactivos = async (req, res) => {
  try {
      
      const geriatricosInactivos = await geriatricoModel.findAll({
          where: { ge_activo: false }, // Filtrar solo inactivos
          attributes: ['ge_id', 'ge_nombre'],
          include: [
              {
                  model: sedeModel, 
                  as: 'sedes', // Alias definido en la relación
                  attributes: ['se_id', 'se_nombre', 'se_activo'] 
              }
          ]
      });

      if (geriatricosInactivos.length === 0) {
          return res.status(404).json({ message: 'No hay geriátricos inactivos' });
      }

      return res.status(200).json({ geriatricosInactivos });

  } catch (error) {
      console.error('Error al obtener geriátricos inactivos:', error);
      return res.status(500).json({ message: 'Error al obtener geriátricos inactivos' });
  }
};



const obtenerDetalleGeriatrico = async (req, res) => {
    try {        

        // Obtener el ID del geriátrico desde los parámetros de la URL
        const { ge_id } = req.params;

        // Obtener todos los geriátricos de la base de datos
        const geriatrico = await geriatricoModel.findByPk(ge_id, {
          include: [
            {
              model: sedeModel, 
              as: "sedes", 
              attributes: ["se_id", "se_nombre", "se_direccion"], 
            },
          ],
        });

        // Verificar si existen geriátricos en la base de datos
        if (!geriatrico) {
            return res.status(404).json({ message: "No se han encontrado geriátrico." });
        }

        return res.status(200).json({
            message: "Geriátrico obtenido exitosamente",
            geriatrico
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al obtener geriátrico" });
    }
};



// (super admin)
const actualizarGeriatrico = async (req, res) => {
  try {
    const { ge_id } = req.params;
    const geriatrico = await geriatricoModel.findByPk(ge_id);

    // Verificar si existen geriátricos en la base de datos
    if (!geriatrico) {
      return res.status(404).json({ message: "No se han encontrado geriátrico." });
    }

    const data = matchedData(req); // Obtener los datos validados de la solicitud
    const {
      ge_nombre,
      ge_nit,
      ge_color_principal,
      ge_color_secundario,
      ge_color_terciario,
    } = data;

    // Crear un objeto con los datos a actualizar
    let updateData = {};

    if (ge_nombre) updateData.ge_nombre = ge_nombre;
    if (ge_nit) updateData.ge_nit = ge_nit;
    if (ge_color_principal) updateData.ge_color_principal = ge_color_principal;
    if (ge_color_secundario) updateData.ge_color_secundario = ge_color_secundario;
    if (ge_color_terciario) updateData.ge_color_terciario = ge_color_terciario;

    // Si se incluye una nueva foto en la solicitud, subirla a Cloudinary
    if (req.file) {
      // Obtener el public_id de la imagen anterior
      const oldLogo = geriatrico.ge_logo; // URL de la imagen actual
      const publicId = oldLogo
        ? oldLogo.split("/").slice(-1)[0].split(".")[0]
        : null; // Extraer el public_id

      try {
        // Subir la nueva imagen a Cloudinary
        const result = await subirImagenACloudinary(req.file, "geriatricos");

        //  si se actualiza imagen, eliminar la antigua
        if (publicId) {
          await cloudinary.uploader.destroy(`geriatricos/${publicId}`);
        }

        // Actualizar la URL de la imagen en la base de datos
        updateData.ge_logo = result.secure_url;
      } catch (error) {
        return res.status(500).json({ message: "Error al subir la imagen a Cloudinary", error });
      }
    }

    // Actualizar el geriátrico en la base de datos
    const updated = await geriatricoModel.update(updateData, {
      where: { ge_id },
    });

    if (!updated) {
      return res.status(404).json({ message: "Geriátrico no encontrado para actualizar." });
    }

    // Obtener el geriátrico actualizado
    const geriatricoActualizado = await geriatricoModel.findByPk(ge_id);

    return res.status(200).json({
      message: "Geriátrico actualizado exitosamente",
      geriatrico: geriatricoActualizado,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al actualizar el geriátrico" });
  }
};



// me carga los datos del geriatrico al q pertenezco (diseño)
const homeMiGeriatrico = async (req, res) => {
  try {
    const { ge_id, per_id, rol_id } = req.session; // geriátrico de la sesión, cuando elijo mi rol
    const rol_nombre = req.session.rol_nombre;

    if (!ge_id) {
      return res
        .status(400)
        .json({ message: "No tienes un geriátrico asignado" });
    }

    // Buscar información del geriátrico en la base de datos
    const geriatrico = await geriatricoModel.findOne({
      where: { ge_id },
      attributes: [
        "ge_id",
        "ge_nombre",
        "ge_logo",
        "ge_color_principal",
        "ge_color_secundario",
        "ge_color_terciario",
      ],
    });

    if (!geriatrico) {
      return res.status(404).json({ message: "Geriátrico no encontrado" });
    }

    const geriatricoRol = await geriatricoPersonaRolModel.findOne({
      where: { ge_id, per_id, rol_id },
      attributes: ["gp_fecha_inicio", "gp_fecha_fin"],
    });

    // Obtener datos de la persona
    const persona = await personaModel.findOne({
      where: { per_id },
      attributes: [
        "per_nombre_completo",
        "per_documento",
        "per_correo",
        "per_telefono",
        "per_foto",
      ],
    });

    return res.status(200).json({
      message: "Información del geriátrico y usuario obtenida correctamente.",
      geriatrico: {
        ge_id: geriatrico.ge_id,
        ge_nombre: geriatrico.ge_nombre,
        ge_logo: geriatrico.ge_logo,
        color_principal: geriatrico.ge_color_principal,
        color_secundario: geriatrico.ge_color_secundario,
        color_terciario: geriatrico.ge_color_terciario,
        
      },
      rol: {
        nombre: rol_nombre,
        fecha_inicio: geriatricoRol ? geriatricoRol.gp_fecha_inicio : null,
        fecha_fin: geriatricoRol ? geriatricoRol.gp_fecha_fin : null,
      },
      usuario: {
        nombre_completo: persona.per_nombre_completo,
        documento: persona.per_documento,
        correo: persona.per_correo,
        telefono: persona.per_telefono,
        foto: persona.per_foto,
      },
    });
  } catch (error) {
    console.error("Error al obtener geriátrico:", error);
    return res.status(500).json({ message: "Error al obtener geriátrico" });
  }
};



// Función para obtener colores del geriátrico por ID
const obtenerColoresGeriatrico = async (req, res) => {
    try {
        const { ge_id } = req.params;

        // Buscar el geriátrico por ID
        const geriatrico = await geriatricoModel.findOne({
            where: { ge_id },
            attributes: ['ge_color_principal', 'ge_color_secundario', 'ge_color_terciario']
        });

        if (!geriatrico) {
            return res.status(404).json({ message: "Geriátrico no encontrado" });
        }

        return res.status(200).json({
            message: "Colores obtenidos correctamente",
            colores: {
                principal: geriatrico.ge_color_principal,
                secundario: geriatrico.ge_color_secundario,
                terciario: geriatrico.ge_color_terciario
            }
        });

    } catch (error) {
        console.error("Error al obtener colores del geriátrico:", error);
        return res.status(500).json({ message: "Error al obtener colores del geriátrico" });
    }
};

    

// se inactiva un geriatrico y todas sus sedes vinculadas (super admin)
const inactivarGeriatrico = async (req, res) => {
  try {
    const { ge_id } = req.params;

    // Buscar el geriátrico
    const geriatrico = await geriatricoModel.findByPk(ge_id);
    if (!geriatrico) {
      return res.status(404).json({ message: "Geriátrico no encontrado" });
    }

    // Verificar si el geriátrico ya está inactivo
    if (!geriatrico.ge_activo) {
      return res.status(400).json({ message: "El geriátrico ya está inactivo" });
    }

    // Inactivar el geriátrico
    geriatrico.ge_activo = false;
    await geriatrico.save();

    // Inactivar todas sus sedes asociadas
    await sedeModel.update({ se_activo: false }, { where: { ge_id } });

    return res.status(200).json({
      message: "Geriátrico y sus sedes inactivados correctamente",
      geriatrico: {
        ge_nombre: geriatrico.ge_nombre,
        ge_nit: geriatrico.ge_nit
      }
    });
  } catch (error) {
    console.error("Error al inactivar geriátrico:", error);
    return res.status(500).json({ message: "Error al inactivar el geriátrico" });
  }
};



// se reactiva un geriatrico y todas sus sedes vinculadas (super admin)
const reactivarGeriatrico = async (req, res) => {
  try {
    const { ge_id } = req.params;

    // Buscar el geriátrico por ID
    const geriatrico = await geriatricoModel.findByPk(ge_id);
    if (!geriatrico) {
      return res.status(404).json({ message: "Geriátrico no encontrado" });
    }

    // Verificar si el geriátrico ya está activo
    if (geriatrico.ge_activo) {
      return res.status(400).json({ message: "El geriátrico ya está activo" });
    }

    // Reactivar el geriátrico
    await geriatrico.update({ ge_activo: true });

    // Reactivar todas las sedes asociadas a ese geriátrico
    await sedeModel.update({ se_activo: true }, { where: { ge_id } });

    return res.status(200).json({
      message: "Geriátrico y sus sedes activados correctamente",
      geriatrico: {
        ge_nombre: geriatrico.ge_nombre,
        ge_nit: geriatrico.ge_nit
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al reactivar el geriátrico y sus sedes" });
  }
};






module.exports = { 
  crearGeriatrico, 
  obtenerGeriatricos,
  obtenerGeriatricosActivos, 
  obtenerGeriatricosInactivos,
  obtenerDetalleGeriatrico, 
  actualizarGeriatrico, 
  homeMiGeriatrico, 
  obtenerColoresGeriatrico, 
  inactivarGeriatrico, 
  reactivarGeriatrico
};
