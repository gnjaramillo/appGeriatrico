const { Op } = require('sequelize');
const { matchedData } = require('express-validator');
const { encrypt, compare } = require('../utils/handlePassword');
const { personaModel, rolModel, sedeModel, geriatricoModel, sedePersonaRolModel, geriatricoPersonaRolModel } = require('../models');
const { tokenSign } = require('../utils/handleJwt'); 
const { subirImagenACloudinary } = require('../utils/handleCloudinary'); 
const cloudinary = require('../config/cloudinary'); 


const registrarPersona = async (req, res) => {
    try {
        const data = matchedData(req);
        const { per_correo, per_documento, per_nombre_completo, per_telefono, per_genero, per_usuario, per_password } = data;

        // Validar correo 
        const correoExiste = await personaModel.findOne({ where: { per_correo } });
        if (correoExiste) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }

        // Validar documento
        const documentoExiste = await personaModel.findOne({ where: { per_documento } });
        if (documentoExiste) {
            return res.status(400).json({ message: 'El documento ya está registrado' });
        }

        // Encriptar la contraseña del usuario
        const per_password_encriptada = await encrypt(per_password);

        // console.log("Contraseña recibida:", per_password_encriptada);


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

        // subir foto (foto es opcional en registro)
        let per_foto = null;
        if (req.file) {
            // Subir la imagen a Cloudinary 
            const resultado = await subirImagenACloudinary(req.file, "personas");
            per_foto = resultado.secure_url; // URL imagen 

            nuevaPersona.per_foto = per_foto;
            await nuevaPersona.save();

        }

        // Ocultar la contraseña en la respuesta para no exponerla
        nuevaPersona.set('per_contraseña', undefined, { strict: false });


        // Responder con éxito y devolver los datos del usuario y el token
        return res.status(201).json({
            message: "Persona registrada con éxito",
            data: {
                per_id: nuevaPersona.per_id, 
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


    const persona = await personaModel.findOne({ where: { per_usuario } });
    if (!persona) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar contraseña
    const hashPassword = persona.per_password;
    const check = await compare(per_password, hashPassword);
    if (!check) {
      return res.status(401).json({ message: "Contraseña inválida" });
    }

    persona.set("password", undefined, { estrict: false });

    // Verificar si el usuario es Super Administrador
    const esSuperAdmin = await geriatricoPersonaRolModel.findOne({
      where: {
        per_id: persona.per_id,
        ge_id: 0, // geriatrico id 0
        rol_id: 1, // ID del rol Super Administrador
        [Op.or]: [
          { sp_fecha_fin: null },
          { sp_fecha_fin: { [Op.gt]: new Date() } },
        ],
      },
    });

    // Guardar en la sesión el rol si es super admin
    req.session.rol_id = esSuperAdmin ? 1 : null; 
    req.session.esSuperAdmin = !!esSuperAdmin; 


    console.log("rol_id en la sesión:", req.session.rol_id);

    
    const token = await tokenSign({
      per_id: persona.per_id,
      per_nombre_completo: persona.per_nombre_completo,
      esSuperAdmin: !!esSuperAdmin, // Booleano indicando si es Super Admin
    });

    // **Guardar el token en las cookies**
    res.cookie("authToken", token, {
      httpOnly: true, // Previene acceso al token desde JavaScript en el navegador
      secure: process.env.NODE_ENV === "production", // True solo en producción (HTTPS)
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' para producción (diferentes dominios)      
      maxAge: 2 * 60 * 60 * 1000, 

    });

    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      token,
      persona: {
        id: persona.per_id,
        nombre: persona.per_nombre_completo,
        usuario: persona.per_usuario,
        correo: persona.per_correo,
        foto: persona.per_foto,
        genero: persona.per_genero,
        telefono: persona.per_telefono,
        esSuperAdmin: !!esSuperAdmin,
      },
    });
  } catch (error) {
    console.error("Error en el login:", error);
    return res.status(500).json({ message: "Error en el login" });
  }
};




module.exports = { registrarPersona, loginPersona };









