const { matchedData } = require("express-validator");
const { sedeModel, geriatricoModel } = require("../models");
const { subirImagenACloudinary } = require('../utils/handleCloudinary'); 
const cloudinary = require('../config/cloudinary'); 


const crearSede = async (req, res) => {
  try {
    // Obtener los datos validados del formulario
    const data = matchedData(req);
    const { se_nombre, se_telefono, se_direccion, cupos_totales, cupos_ocupados, ge_id } = data;

    // Verificar si el geriátrico existe
    const geriatrico = await geriatricoModel.findByPk(ge_id);
    if (!geriatrico) {
      return res.status(400).json({
        message: "El geriátrico con el ID proporcionado no existe.",
      });
    }

    // Verificar si ya existe una sede con el mismo nombre vinculada al mismo geriátrico
    const existeSede = await sedeModel.findOne({
      where: { se_nombre, ge_id },
    });
    if (existeSede) {
      return res.status(400).json({ message: "Ya existe una sede con este nombre vinculada al mismo geriátrico" });
    }

    // Verificar si hay un archivo (foto de la sede) en la solicitud
    if (!req.file) {
      return res.status(400).json({ message: "La foto de la sede es obligatoria." });
    }

    // Subir la foto de la sede a Cloudinary solo después de las validaciones
    const result = await subirImagenACloudinary(req.file, "sedes");

    // Crear la sede en la base de datos
    const nuevaSede = await sedeModel.create({
      se_foto: result.secure_url, // Guardar la URL de la foto de Cloudinary en la BD
      se_nombre,
      se_telefono,
      se_direccion,
      cupos_totales,
      cupos_ocupados,
      ge_id, // Vincular la sede al geriátrico correspondiente
    });

    return res.status(201).json({
      message: "Sede creada y vinculada al geriátrico exitosamente",
      sede: nuevaSede,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al crear la sede" });
  }
};




const obtenerSedes = async (req, res) => {
  try {
    // Obtener todas las sedes de la base de datos
    const sedes = await sedeModel.findAll({
      include: [
        {
          model: geriatricoModel,
          as: "geriatrico",
          attributes: ["ge_nombre", "ge_nit"],
        },
      ],
    });

    // Verificar si existen sedes en la base de datos
    if (sedes.length === 0) {
      return res.status(404).json({ message: "No se han encontrado sedes." });
    }

    return res.status(200).json({
      message: "sedes obtenidas exitosamente",
      sedes,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener los sedes" });
  }
};


const obtenerDetalleSede = async (req, res) => {
  try {
    const { se_id } = req.params;

    // Buscar una sede por su ID incluyendo el geriatrico relacionado
    const sede = await sedeModel.findOne({
      where: { se_id },
      include: [
        {
          model: geriatricoModel,
          as: "geriatrico",
          attributes: ["ge_nombre", "ge_nit"],
        },
      ],
    });

    // Verificar si la sede existe
    if (!sede) {
      return res.status(404).json({ message: "No se ha encontrado la sede." });
    }

    return res.status(200).json({
      message: "Sede obtenida exitosamente",
      sede,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener la sede" });
  }
};


const actualizarSede = async (req, res) => {
  try {
    const { se_id } = req.params;
    const sede = await sedeModel.findByPk(se_id);

    // Verificar si la sede existe
    if (!sede) {
      return res.status(404).json({ message: "No se ha encontrado la sede." });
    }

    const data = matchedData(req);
    const {
      se_nombre,
      se_telefono,
      se_direccion,
      cupos_totales,
      cupos_ocupados,
      ge_id,
    } = data;

    let updateData = {};

    // Verificar si se proporcionaron nuevos datos para actualizar
    if (se_nombre) updateData.se_nombre = se_nombre;
    if (se_telefono) updateData.se_telefono = se_telefono;
    if (se_direccion) updateData.se_direccion = se_direccion;
    if (cupos_totales) updateData.cupos_totales = cupos_totales;
    if (cupos_ocupados) updateData.cupos_ocupados = cupos_ocupados;

    // Validar si el geriátrico existe antes de actualizar el ge_id
    if (ge_id) {
      const geriatrico = await geriatricoModel.findByPk(ge_id);
      if (!geriatrico) {
        return res.status(400).json({
          message: "El geriátrico con el ID proporcionado no existe.",
        });
      }
      updateData.ge_id = ge_id;
    }

    // Si hay un archivo (foto), manejar la foto de Cloudinary
    if (req.file) {
      const oldFoto = sede.se_foto; // URL de la imagen actual
      const publicId = oldFoto
        ? oldFoto.split("/").slice(-1)[0].split(".")[0]
        : null; // Extraer el public_id de la imagen anterior

      try {
        // Subir la nueva imagen a Cloudinary
        const result = await subirImagenACloudinary(req.file, "sedes");

        // Si se subió una nueva imagen correctamente, eliminar la anterior
        if (publicId) {
          await cloudinary.uploader.destroy(`sedes/${publicId}`);
        }

        // Actualizar la URL de la foto
        updateData.se_foto = result.secure_url;
      } catch (error) {
        return res.status(500).json({ message: "Error al subir la imagen a Cloudinary", error });
      }
    }

    // Actualizar los datos de la sede
    const updated = await sedeModel.update(updateData, {
      where: { se_id },
    });

   // Obtener la sede actualizada
    const sedeActualizada = await sedeModel.findByPk(se_id);

    return res.status(200).json({
      message: "Sede actualizada exitosamente",
      sede: sedeActualizada,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al actualizar sede" });
  }
};



module.exports = { crearSede,  obtenerSedes,  obtenerDetalleSede,  actualizarSede};
