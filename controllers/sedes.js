const { matchedData } = require("express-validator");
const { sequelize } = require('../config/mysql'); 
const { sedeModel, geriatricoModel, sedePersonaRolModel, personaModel } = require("../models");
const { subirImagenACloudinary } = require('../utils/handleCloudinary'); 
const cloudinary = require('../config/cloudinary'); 




// admin geriatrico crea sus sedes, quedan vinculadas al geriatrico a su cargo (ge id sesion)
const crearSede = async (req, res) => {
  try {
    // Obtener los datos validados del formulario
    const data = matchedData(req);
    const { se_nombre, se_telefono, se_direccion, cupos_totales, cupos_ocupados } = data;

    // cuando el admin geriatrico selecciona su rol, se guarda en sesion el id del geriatrico a su cargo
    const ge_id = req.session.ge_id;
    if (!ge_id) {
        return res.status(403).json({ message: 'No se ha seleccionado un geriatrico.' });
    } 

        // Verificar si el geriátrico existe
    const geriatrico = await geriatricoModel.findByPk(ge_id);
    if (!geriatrico) {
      return res.status(400).json({
        message: "El geriátrico con el ID proporcionado no existe.",
      });
    } 

    // Validar que los cupos ocupados no superen los cupos totales
    if (cupos_ocupados > cupos_totales) {
      return res.status(400).json({ message: "Los cupos ocupados no pueden superar los cupos totales." });
    }


  
    // foto de la sede 
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
      cupos_ocupados: cupos_ocupados || 0, // será 0 por defecto,
      ge_id, // Vincular la sede al geriátrico correspondiente
    });

    return res.status(201).json({
      message: `Sede creada y vinculada al geriátrico "${geriatrico.ge_nombre}" exitosamente`,
      sede: nuevaSede,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al crear la sede" });
  }
};



// todas las sedes visibles.. 
const obtenerSedes = async (req, res) => {
  try {
    // Obtener todas las sedes de la base de datos
    const sedes = await sedeModel.findAll({
      attributes: [
        "se_id",
        "se_foto",
        "se_nombre",
        "se_telefono",
        "se_direccion",
        "cupos_totales",
        "cupos_ocupados",
        "se_activo",
        [
          sequelize.literal("cupos_totales - cupos_ocupados"),
          "cupos_disponibles",
        ], // Aquí se calcula automáticamente
      ],
      include: [
        {
          model: geriatricoModel,
          as: "geriatrico",
          attributes: ["ge_nombre", "ge_nit", "ge_activo"],
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



// obtener sedes mi geriatrico (admin geriatrico)
const obtenerSedesMiGeriatrico = async (req, res) => {
  try {

    // Obtener el ID del geriátrico desde la sesión
    const ge_id = req.session.ge_id;
    if (!ge_id) {
      return res.status(403).json({ message: "No se ha seleccionado un geriátrico." });
    }

    // Obtener todas las sedes de mi geriatrico
    const sedes = await sedeModel.findAll({
      attributes: [
        "se_id",
        "se_foto",
        "se_nombre",
        "se_telefono",
        "se_direccion",
        "cupos_totales",
        "cupos_ocupados",
        "se_activo",
        [
          sequelize.literal("cupos_totales - cupos_ocupados"),
          "cupos_disponibles",
        ], // Aquí se calcula automáticamente
      ],

      where: {  ge_id }, // Filtrar para el geriatrico en sesion
      
    });

    // Verificar si existen sedes en la base de datos
    if (sedes.length === 0) {
      return res.status(404).json({ message: "No se han encontrado sedes para este geriatrico" });
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



// ver una sede especifica 
const obtenerDetalleSede = async (req, res) => {
  try {
    const { se_id } = req.params;

    // Buscar una sede por su ID incluyendo el geriatrico relacionado
    const sede = await sedeModel.findOne({
      attributes: [
        "se_id",
        "se_foto",
        "se_nombre",
        "se_telefono",
        "se_direccion",
        "cupos_totales",
        "cupos_ocupados",
        "se_activo",
        [
          sequelize.literal("cupos_totales - cupos_ocupados"),
          "cupos_disponibles",
        ], // Aquí se calcula automáticamente
      ],

      where: { se_id },
    
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



// admin geriatrico
const actualizarSede = async (req, res) => {
  try {
    const { se_id } = req.params;
    const ge_id_sesion = req.session.ge_id; // ID del geriátrico en sesión

    if (!ge_id_sesion) {
      return res.status(403).json({ message: "No se ha seleccionado un geriátrico." });
    }

    // Buscar la sede por ID con la relación al geriátrico
    const sede = await sedeModel.findByPk(se_id, {
      include: {
        model: geriatricoModel,
        as: "geriatrico",
        attributes: ["ge_nombre", "ge_id"],
      }
    });

    if (!sede) {
      return res.status(404).json({ message: "No se ha encontrado la sede." });
    }

 // 🔹 Validar que la sede pertenece al geriátrico del admin en sesión
    if (Number(sede.geriatrico.ge_id) !== Number(ge_id_sesion)) {
      return res.status(403).json({ message: "No tienes permiso para modificar esta sede." });
    }
    
    // 🔹 Si el usuario intenta actualizar `cupos_ocupados`, responder con error
    if ("cupos_ocupados" in req.body) {
      return res.status(400).json({ message: "No puedes actualizar el campo 'cupos_ocupados'." });
    }

    const data = matchedData(req);
    const { se_nombre, se_telefono, se_direccion, cupos_totales} = data;

    let updateData = {};

    // Verificar si se proporcionaron nuevos datos para actualizar
    if (se_nombre) updateData.se_nombre = se_nombre;
    if (se_telefono) updateData.se_telefono = se_telefono;
    if (se_direccion) updateData.se_direccion = se_direccion;
    if (cupos_totales) updateData.cupos_totales = cupos_totales;

    // Si no hay datos para actualizar, responder con un mensaje
    if (Object.keys(updateData).length === 0 && !req.file) {
      return res.status(400).json({ message: "No se han enviado datos para actualizar." });
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
    await sedeModel.update(updateData, {
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



// me carga los datos de la sede/geriatrico al q pertenezco en mi rol seleccionado antes
const obtenerHomeSede = async (req, res) => {
  try {
    
      const { se_id, per_id, rol_id } = req.session; // Datos guardados en sesión con mi rol escogido
      const rol_nombre = req.session.rol_nombre; 

      if (!se_id) {
          return res.status(400).json({ message: "No se ha seleccionado una sede." });
      }

      // Obtener datos de la sede junto con el geriátrico al que pertenece
      const sede = await sedeModel.findOne({
          where: { se_id },
          attributes: ['se_id', 'se_nombre', 'se_foto', 'se_telefono', 'se_direccion', 'cupos_totales', 'cupos_ocupados', 'ge_id'],
          include: [
              {
                  model: geriatricoModel,
                  as: 'geriatrico',
                  attributes: ['ge_id', 'ge_nombre', 'ge_logo', 'ge_color_principal', 'ge_color_secundario', 'ge_color_terciario']
              }
          ]
      });

      if (!sede) {
          return res.status(404).json({ message: "No se encontró la sede." });
      }

      // Obtener información del rol en la sede
      const sedeRol = await sedePersonaRolModel.findOne({
          where: {  se_id, per_id, rol_id },
          attributes: ['sp_fecha_inicio', 'sp_fecha_fin']
      });

      // Obtener datos de la persona
      const persona = await personaModel.findOne({
          where: { per_id },
          attributes: ['per_nombre_completo', 'per_documento', 'per_correo', 'per_telefono', 'per_foto']
      });

      return res.status(200).json({
          message: "Información de la sede y usuario obtenida correctamente",
          sede: {
              se_id: sede.se_id,
              se_nombre: sede.se_nombre,
              se_foto: sede.se_foto,
              se_telefono: sede.se_telefono,
              se_direccion: sede.se_direccion,
              cupos_totales: sede.cupos_totales,
              cupos_ocupados: sede.cupos_ocupados
          },
          geriatrico: {
              ge_id: sede.geriatrico.ge_id,
              ge_nombre: sede.geriatrico.ge_nombre,
              ge_logo: sede.geriatrico.ge_logo,
              colores: {
                  principal: sede.geriatrico.ge_color_principal,
                  secundario: sede.geriatrico.ge_color_secundario,
                  terciario: sede.geriatrico.ge_color_terciario
              }
          },
          rol: {
              nombre: rol_nombre,
              fecha_inicio: sedeRol ? sedeRol.sp_fecha_inicio : null,
              fecha_fin: sedeRol ? sedeRol.sp_fecha_fin : null
          },
          usuario: {
              nombre_completo: persona.per_nombre_completo,
              documento: persona.per_documento,
              correo: persona.per_correo,
              telefono: persona.per_telefono,
              foto: persona.per_foto
          }
      });

  } catch (error) {
      console.error('Error al obtener el home de la sede:', error);
      return res.status(500).json({ message: "Error al obtener la información de la sede." });
  }
};



// Se inactiva una sede (admin geriatrico)
const inactivarSede = async (req, res) => {
  try {
    const { se_id } = req.params;
    const ge_id_sesion = req.session.ge_id; // ID del geriátrico del admin en sesión

    if (!ge_id_sesion) {
      return res.status(403).json({ message: "No se ha seleccionado un geriátrico." });
    }

    // Buscar la sede con su geriátrico
    const sede = await sedeModel.findByPk(se_id, {
      attributes: ["se_nombre", "se_activo", "se_id"], // Ahora también traemos el nombre de la sede
      include: {
        model: geriatricoModel,
        as: "geriatrico",
        attributes: ["ge_nombre", "ge_id", "ge_nit"],
      }
    });

    if (!sede) {
      return res.status(404).json({ message: "Sede no encontrada" });
    }

    // Verificar si la sede pertenece al geriátrico del admin en sesión
    if (sede.geriatrico.ge_id !== ge_id_sesion) {
      return res.status(403).json({ message: "No tienes permiso para modificar esta sede." });
    }

    // Verificar si la sede ya está inactiva
    if (!sede.se_activo) {
      return res.status(400).json({ message: "La sede ya está inactiva" });
    }

    // Iniciar transacción
    const transaction = await sequelize.transaction();

    try {
      // Inactivar la sede
      await sede.update({ se_activo: false }, { transaction });

      // Inactivar todos los roles en sede_personas_roles
      await sedePersonaRolModel.update(
        { sp_activo: false, sp_fecha_fin: new Date() },
        { where: { se_id, sp_activo: true }, transaction }
      );

      // Confirmar la transacción
      await transaction.commit();

      return res.status(200).json({
        message: "Sede y todos sus roles vinculados han sido inactivados correctamente",
        sede: {
          se_nombre: sede.se_nombre, 
          se_activo: sede.se_activo,
          se_id: sede.se_id,
          geriatrico: {
            ge_nombre: sede.geriatrico.ge_nombre,
            ge_nit: sede.geriatrico.ge_nit
          }
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error("Error dentro de la transacción:", error);
      return res.status(500).json({ message: "Error al inactivar la sede" });
    }

  } catch (error) {
    console.error("Error general al inactivar sede:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
};



// Reactivar sede (solo admin geriátrico)
const reactivarSede = async (req, res) => {
  try {
    const { se_id } = req.params;
    const ge_id_sesion = req.session.ge_id; // ID del geriátrico del admin en sesión

    if (!ge_id_sesion) {
      return res.status(403).json({ message: "No se ha seleccionado un geriátrico." });
    }

    // Buscar la sede por ID con la relación al geriátrico
    const sede = await sedeModel.findByPk(se_id, {
      include: {
        model: geriatricoModel,
        as: "geriatrico",
        attributes: ["ge_nombre", "ge_activo", "ge_id"],
      }
    });

    if (!sede) {
      return res.status(404).json({ message: "Sede no encontrada" });
    }

    // 🔹 Validar que la sede pertenece al geriátrico del admin en sesión
    if (sede.geriatrico.ge_id !== ge_id_sesion) {
      return res.status(403).json({ message: "No tienes permiso para modificar esta sede." });
    }

    // Verificar si la sede ya está activa
    if (sede.se_activo) {
      return res.status(400).json({ message: "La sede ya está activa" });
    }

    // Reactivar la sede
    await sede.update({ se_activo: true });

    let message = `Sede "${sede.se_nombre}" activada correctamente`;

    if (!sede.geriatrico.ge_activo) {
      message += ` - Advertencia: El geriátrico "${sede.geriatrico.ge_nombre}" está inactivo.`;
    }

    return res.status(200).json({
      message,
      sede: {
        se_nombre: sede.se_nombre,
        se_telefono: sede.se_telefono,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al reactivar la sede" });
  }
};



module.exports = { 
  crearSede, 
  obtenerSedes, 
  obtenerSedesMiGeriatrico,
  obtenerDetalleSede,  
  actualizarSede, 
  obtenerHomeSede,
  inactivarSede,
  reactivarSede
};
