const { matchedData } = require('express-validator');
const { encrypt, compare } = require('../utils/handlePassword');
const { personaModel, rolModel, sedeModel, sedePersonaRolModel } = require('../models');
const { tokenSign } = require('../utils/handleJwt'); 
const { subirImagenACloudinary } = require('../utils/handleCloudinary'); 
const cloudinary = require('../config/cloudinary'); 


// controllers/personasController.js
const registrarPersona = async (req, res) => {
    try {
        // Obtener los datos validados del formulario
        const data = matchedData(req);
        const { per_correo, per_documento, per_nombre_completo, per_telefono, per_genero, per_usuario, per_password } = data;

        // Validar si el correo ya está registrado
        const correoExiste = await personaModel.findOne({ where: { per_correo } });
        if (correoExiste) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }

        // Validar si el documento ya está registrado
        const documentoExiste = await personaModel.findOne({ where: { per_documento } });
        if (documentoExiste) {
            return res.status(400).json({ message: 'El documento ya está registrado' });
        }

        // Encriptar la contraseña del usuario
        const per_password_encriptada = await encrypt(per_password);

        console.log("Contraseña recibida:", per_password_encriptada);


        // Crear la persona en la base de datos
        const nuevaPersona = await personaModel.create({
            per_correo,
            per_documento,
            per_nombre_completo,
            per_telefono,
            per_genero,
            per_usuario,
            per_password: per_password_encriptada, 
        });

        // Manejar la subida de la foto (opcional)
        let per_foto = null;
        if (req.file) {
            // Subir la imagen a Cloudinary (función que ya tienes configurada)
            const resultado = await subirImagenACloudinary(req.file, "personas");
            per_foto = resultado.secure_url; // URL de la imagen subida

            nuevaPersona.per_foto = per_foto;
            await nuevaPersona.save();

        }

        // Generar token de inicio de sesión
        const token = await tokenSign(nuevaPersona, {}, {});


        // Ocultar la contraseña en la respuesta para no exponerla
        nuevaPersona.set('per_contraseña', undefined, { strict: false });

        // Responder con éxito y devolver los datos del usuario y el token
        return res.status(201).json({
            message: "Persona registrada con éxito",
            data: {
                token, // Token de autenticación
                user: nuevaPersona, // Datos del usuario sin la contraseña
            },
        });

    } catch (error) {
        console.error("Error al registrar persona:", error);
        return res.status(500).json({
            message: "Error al registrar persona",
            error: error.message,
        });
    }
};



const loginPersona = async (req, res) => {
    try {
      const data = matchedData(req);
      const { per_usuario, per_password } = data;
  
      // Buscar al usuario
      const persona = await personaModel.findOne({ where: { per_usuario } });
      if (!persona) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      // Verificar contraseña
      const hashPassword = persona.per_password;
      const check = await compare(per_password, hashPassword);
      if (!check) {
        return res.status(401).json({ message: 'Contraseña inválida' });
      }


     persona.set("password", undefined, { estrict: false });
  
      // Buscar todas las combinaciones de roles y sedes asignadas al usuario
      const asignaciones = await sedePersonaRolModel.findAll({
        where: { per_id: persona.per_id },
        include: [
          { model: rolModel, as: 'rol', attributes: ['rol_id', 'rol_nombre'] },
          { model: sedeModel, as: 'sede', attributes: ['se_id', 'se_nombre'] },
        ],
      });
  
      if (asignaciones.length === 0) {
        return res.status(403).json({
          message: 'No tienes roles ni sedes asignados. Comunícate con un administrador.',
        });
      }
  
      // Construir la lista de roles y sedes disponibles
      const opciones = asignaciones.map((a) => ({
        rol_id: a.rol_id,
        rol_nombre: a.rol.rol_nombre,
        se_id: a.se_id,
        se_nombre: a.sede.se_nombre,
      }));


      // Generar un token básico
    const token = await tokenSign({
        per_id: persona.per_id,
        per_nombre_completo: persona.per_nombre_completo
      });

      
  
      // Responder con las opciones disponibles
      return res.status(200).json({
        message: 'Inicio de sesión exitoso. Selecciona un rol y sede para continuar.',
        token,
        persona: {
          id: persona.per_id,
          nombre: persona.per_nombre_completo,
          usuario: persona.per_usuario,
        },
        opciones, // Enviar las combinaciones disponibles de roles y sedes
      });
    } catch (error) {
      console.error('Error en el login:', error);
      return res.status(500).json({ message: 'Error en el login' });
    }
  };


  

module.exports = { registrarPersona, loginPersona };









