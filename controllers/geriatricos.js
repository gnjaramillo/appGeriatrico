const { matchedData } = require('express-validator');
const { sedeModel, geriatricoModel } = require('../models');
const { subirImagenACloudinary } = require('../utils/handleCloudinary'); 
const cloudinary = require('../config/cloudinary'); 


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
            geriatrico: nuevoGeriatrico
        });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al crear el geriátrico" });
    }
};



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



const obtenerDetalleGeriatrico = async (req, res) => {
    try {
        // Obtener el ID del geriátrico desde los parámetros de la URL
        const { ge_id } = req.params;

        // Obtener todos los geriátricos de la base de datos
        const geriatrico = await geriatricoModel.findByPk(ge_id);

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
      // Obtener el public_id de la imagen anterior si existe
      const oldLogo = geriatrico.ge_logo; // URL de la imagen actual
      const publicId = oldLogo
        ? oldLogo.split("/").slice(-1)[0].split(".")[0]
        : null; // Extraer el public_id

      try {
        // Subir la nueva imagen a Cloudinary, usando la función modular
        const result = await subirImagenACloudinary(req.file, "geriatricos");

        // Si se subió una nueva imagen correctamente, eliminar la anterior
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





module.exports = { crearGeriatrico, obtenerGeriatricos, obtenerDetalleGeriatrico, actualizarGeriatrico};
