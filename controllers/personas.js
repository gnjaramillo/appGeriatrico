const { matchedData } = require('express-validator');
const { encrypt, compare } = require('../utils/handlePassword');
const { personaModel,geriatricoPersonaModel, geriatricoModel, rolModel, sedeModel, sedePersonaRolModel, geriatricoPersonaRolModel } = require('../models');
const { tokenSign } = require('../utils/handleJwt'); 
const { subirImagenACloudinary } = require('../utils/handleCloudinary'); 
const cloudinary = require('../config/cloudinary'); 
const { sequelize } = require('../config/mysql');


// super admin accede a todas las personas registradas
const obtenerPersonasRegistradas = async (req, res) => {
    try {
      const personas = await personaModel.findAll();
  
      if (personas.length === 0) {
        return res
          .status(404)
          .json({ message: "No se han encontrado personas registradas" });
      }
  
      // Mapear todos los campos de la tabla
      const personasFiltradas = personas.map((persona) => ({
        id: persona.per_id,
        fechaRegistro: persona.per_fecha,
        foto: persona.per_foto,
        correo: persona.per_correo,
        documento: persona.per_documento,
        nombre: persona.per_nombre_completo,
        telefono: persona.per_telefono,
        genero: persona.per_genero,
        usuario: persona.per_usuario,
      }));
  
      return res.status(200).json({
        message: "Personas obtenidas exitosamente",
        personas: personasFiltradas,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener personas" });
    }
};



/* super admin mira todos los roles q tiene cada persona, de esta lista 
solo puede inactivar roles a su cargo como roles geriatrico */
const obtenerPersonaRoles = async (req, res) => {
    try {
        const { per_id } = req.params;

        // Buscar persona solo con documento y nombre completo
        const persona = await personaModel.findOne({
            where: { per_id },
            attributes: ['per_documento', 'per_nombre_completo'] // Solo estos dos campos
        });

        if (!persona) {
            return res.status(404).json({ message: "Persona no encontrada." });
        }
        

        // Obtener roles en geriátrico con estado de activación y fechas
        const rolesGeriatrico = await geriatricoPersonaRolModel.findAll({
            where: { per_id },
            include: [
                {
                    model: rolModel,
                    as: 'rol',
                    attributes: ['rol_id', 'rol_nombre']
                },
                {
                    model: geriatricoModel,
                    as: 'geriatrico',
                    attributes: ['ge_id', 'ge_nombre', 'ge_nit']
                }
            ],
            attributes: ['gp_activo', 'gp_fecha_inicio', 'gp_fecha_fin'], // Incluir fechas y estado activo
            order: [['gp_activo', 'DESC']]  // Ordenar por activo (TRUE primero)
        
        });

        // Obtener roles en sede con estado de activación y fechas
        const rolesSede = await sedePersonaRolModel.findAll({
            where: { per_id },
            include: [
                {
                    model: rolModel,
                    as: 'rol',
                    attributes: ['rol_id', 'rol_nombre']
                },
                {
                    model: sedeModel,
                    as: 'sede',
                    attributes: ['se_id', 'se_nombre'],
                    include: [
                        {
                            model: geriatricoModel,
                            as: 'geriatrico',
                            attributes: ['ge_id', 'ge_nombre', 'ge_nit']
                        }
                    ]
                }
                
            ],
            attributes: ['sp_activo', 'sp_fecha_inicio', 'sp_fecha_fin'], // Incluir fechas y estado activo
            order: [['sp_activo', 'DESC']]  // Ordenar por activo (TRUE primero)
        });

        return res.status(200).json({
            message: "Persona obtenida exitosamente",
            persona: {
                documento: persona.per_documento,
                nombre: persona.per_nombre_completo,
                rolesGeriatrico: rolesGeriatrico.map(rg => ({
                    rol_id: rg.rol.rol_id,
                    rol_nombre: rg.rol.rol_nombre,
                    rol_activo: rg.gp_activo, // Estado del rol en geriátrico
                    fechaInicio: rg.gp_fecha_inicio, 
                    fechaFin: rg.gp_fecha_fin, 
                    geriatrico: {
                        ge_id: rg.geriatrico.ge_id,
                        ge_nombre: rg.geriatrico.ge_nombre,
                        ge_nit: rg.geriatrico.ge_nit,
                    }                   
                })),
                rolesSede: rolesSede.map(rs => ({
                    rol_id: rs.rol.rol_id,
                    rol_nombre: rs.rol.rol_nombre,
                    rol_activo: rs.sp_activo, // Estado del rol en sede
                    fechaInicio: rs.sp_fecha_inicio, 
                    fechaFin: rs.sp_fecha_fin, 
                    sede: {
                        se_id: rs.sede.se_id,
                        se_nombre: rs.sede.se_nombre,
                        geriatrico:   { 
                            ge_id: rs.sede.geriatrico.ge_id, 
                            ge_nombre: rs.sede.geriatrico.ge_nombre,
                            ge_nit: rs.sede.geriatrico.ge_nit,
                        }
                    }
                }))
            }
        });

    } catch (error) {
        console.error("Error al obtener persona:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
};




// administradores puedan actualizar un dato mal registrado
const actualizarPersona = async (req, res) => {
    const { per_id } = req.params;
    const data = matchedData(req); 

    try {
        const persona = await personaModel.findByPk(per_id);
        if (!persona) {
            return res.status(404).json({ message: "Persona no encontrada" });
        }

        let updateData = {};

        // Validar si los datos están en uso antes de actualizar
        if (data.per_correo && data.per_correo !== persona.per_correo) {
            const correoExiste = await personaModel.findOne({ where: { per_correo: data.per_correo } });
            if (correoExiste) {
                return res.status(400).json({ message: "El correo ya está registrado por otra persona." });
            }
            updateData.per_correo = data.per_correo;
        }

        if (data.per_documento && data.per_documento !== persona.per_documento) {
            const documentoExiste = await personaModel.findOne({ where: { per_documento: data.per_documento } });
            if (documentoExiste) {
                return res.status(400).json({ message: "El documento ya está registrado por otra persona." });
            }
            updateData.per_documento = data.per_documento;
        }

        if (data.per_usuario && data.per_usuario !== persona.per_usuario) {
            const usuarioExiste = await personaModel.findOne({ where: { per_usuario: data.per_usuario } });
            if (usuarioExiste) {
                return res.status(400).json({ message: "El usuario ya está registrado por otra persona." });
            }
            updateData.per_usuario = data.per_usuario;
        }

        // Manejar la actualización de la imagen
        if (req.file) {
            const oldFoto = persona.per_foto;
            const publicId = oldFoto 
            ? oldFoto.split("/").slice(-1)[0].split(".")[0]
            : null;

            try {
                // Subir la nueva imagen
                const result = await subirImagenACloudinary(req.file, "personas");

                // Eliminar la imagen anterior si existe
                if (publicId) {
                    await cloudinary.uploader.destroy(`personas/${publicId}`);
                }

                updateData.per_foto = result.secure_url;

            } catch (error) {
                return res.status(500).json({ message: "Error al subir la imagen", error });
            }
        }

        // Encriptar la contraseña si se actualiza
        if (data.per_password) {
            updateData.per_password = await encrypt(data.per_password);
        }

        // Agregar otros campos si están definidos
        if (data.per_nombre_completo !== undefined) updateData.per_nombre_completo = data.per_nombre_completo;
        if (data.per_telefono !== undefined) updateData.per_telefono = data.per_telefono;
        if (data.per_genero !== undefined) updateData.per_genero = data.per_genero;

        // Solo actualizar si hay datos válidos
        if (Object.keys(updateData).length > 0) {
            await persona.update(updateData);
        }

        return res.status(200).json({ message: "Persona actualizada con éxito", persona });
    } catch (error) {
        return res.status(500).json({ message: "Error al actualizar persona", error: error.message });
    }
};



// ver mi perfil
const obtenerMiPerfil = async (req, res) => {
    try {
        const per_id = req.user.id; 

        // Buscar la persona en la base de datos
        const persona = await personaModel.findOne({ where: { per_id } });

        if (!persona) {
            return res.status(404).json({ message: "Persona no encontrada" });
        }

        // Formatear la respuesta con los datos necesarios
        const personaFiltrada = {
            id: persona.per_id,
            fechaRegistro: persona.per_fecha,
            foto: persona.per_foto,
            correo: persona.per_correo,
            documento: persona.per_documento,
            nombre: persona.per_nombre_completo,
            telefono: persona.per_telefono,
            genero: persona.per_genero,
            usuario: persona.per_usuario,
        };

        return res.status(200).json({
            message: "Persona autenticada obtenida exitosamente",
            persona: personaFiltrada,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener la persona autenticada" });
    }
};



// datos q puede actualizar cada usuario en su perfil: correo, telefono, usuario, contraseña, foto
const actualizarPerfil = async (req, res) => {
    const per_id = req.user.id;
    const data = matchedData(req); 
    console.log("Datos recibidos:", data);

    const camposPermitidos = ['per_correo', 'per_telefono', 'per_usuario', 'per_password', 'per_foto'];
    
    // Verificar si hay campos no permitidos
    const camposInvalidos = Object.keys(req.body).filter(field => !camposPermitidos.includes(field));
    if (camposInvalidos.length > 0) {
        return res.status(400).json({
            message: `Los siguientes campos no se pueden actualizar: ${camposInvalidos.join(", ")}`
        });
    }

    try {
        const persona = await personaModel.findByPk(per_id);
        if (!persona) {
            return res.status(404).json({ message: "Persona no encontrada" });
        }

        let updateData = {};

        // Validar y actualizar los campos permitidos
        if (data.per_correo && data.per_correo !== persona.per_correo) {
            const correoExiste = await personaModel.findOne({ where: { per_correo: data.per_correo } });
            if (correoExiste) {
                return res.status(400).json({ message: "El correo ya está registrado por otra persona." });
            }
            updateData.per_correo = data.per_correo;
        }

        if (data.per_usuario && data.per_usuario !== persona.per_usuario) {
            const usuarioExiste = await personaModel.findOne({ where: { per_usuario: data.per_usuario } });
            if (usuarioExiste) {
                return res.status(400).json({ message: "El usuario ya está registrado por otra persona." });
            }
            updateData.per_usuario = data.per_usuario;
        }

        if (data.per_password) {
            updateData.per_password = await encrypt(data.per_password);
        }

        if (data.per_telefono) {
            updateData.per_telefono = data.per_telefono;
        }

        // Manejar la actualización de la imagen
        if (req.file) {
            const oldFoto = persona.per_foto;
            const publicId = oldFoto 
            ? oldFoto.split("/").slice(-1)[0].split(".")[0]
            : null;

            try {
                // Subir la nueva imagen
                const result = await subirImagenACloudinary(req.file, "personas");

                // Eliminar la imagen anterior si existe
                if (publicId) {
                    await cloudinary.uploader.destroy(`personas/${publicId}`);
                }

                updateData.per_foto = result.secure_url;
            } catch (error) {
                return res.status(500).json({ message: "Error al subir la imagen", error });
            }
        }

        // Si hay datos para actualizar, proceder
        if (Object.keys(updateData).length > 0) {
            await persona.update(updateData);
        }

        // Volver a obtener los datos completos para enviarlos en la respuesta
        const personaActualizada = await personaModel.findByPk(per_id);

        return res.status(200).json({
            message: "Perfil actualizado con éxito",
            persona: {
                id: personaActualizada.per_id,
                fechaRegistro: personaActualizada.per_fecha,
                foto: personaActualizada.per_foto,
                nombre: personaActualizada.per_nombre_completo,
                documento: personaActualizada.per_documento,
                genero: personaActualizada.per_genero,
                correo: personaActualizada.per_correo,
                telefono: personaActualizada.per_telefono,
                usuario: personaActualizada.per_usuario
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Error al actualizar perfil", error: error.message });
    }
};



// buscar persona por documento para ver si ya esta registrada en sistema
const buscarPersonaPorDocumento = async (req, res) => {
    try {
        const { per_documento } = req.params;

        // Buscar a la persona en la base de datos
        const persona = await personaModel.findOne({
            where: { per_documento },
            attributes: ["per_id", "per_nombre_completo", "per_documento"]
        });

        if (!persona) {
            return res.status(404).json({
                message: "Persona no encontrada. ¿Desea registrarla?",
                action: "register"
            });
        }

        return res.status(200).json({
            message: "Persona encontrada. ¿Desea asignarle un rol?",
            action: "assign_role",
            per_id: persona.per_id,
            per_nombre: persona.per_nombre_completo,
            per_documento: persona.per_documento
        });

    } catch (error) {
        console.error("Error al buscar persona por documento:", error);
        return res.status(500).json({ message: "Error en el servidor." });
    }
};




module.exports = { obtenerPersonasRegistradas,obtenerPersonaRoles, actualizarPersona, actualizarPerfil, obtenerMiPerfil, buscarPersonaPorDocumento  };

