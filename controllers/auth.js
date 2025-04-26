const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 
const { matchedData } = require('express-validator');
const { encrypt, compare } = require('../utils/handlePassword');
const { tokenSign } = require('../utils/handleJwt'); 
const { subirImagenACloudinary } = require('../utils/handleCloudinary'); 
const { limpiarSesion } = require('../utils/sessionUtils');
const { personaModel, geriatricoPersonaRolModel } = require('../models');




const registrarPersona = async (req, res) => {
  const transaction = await personaModel.sequelize.transaction(); // Iniciar transacción

  try {
      const data = matchedData(req);
      const { per_correo, per_documento, per_nombre_completo, per_telefono, per_genero, per_usuario, per_password } = data;

      // Validar correo
      const correoExiste = await personaModel.findOne({ where: { per_correo } });
      if (correoExiste) {
          return res.status(400).json({ message: 'El correo ya está registrado' });
      }

      // Validar usuario
      const usuarioExiste = await personaModel.findOne({ where: { per_usuario } });
      if (usuarioExiste) {
          return res.status(400).json({ message: 'El usuario no esta disponible' });
      }

      // Validar documento
      const documentoExiste = await personaModel.findOne({ where: { per_documento } });
      if (documentoExiste) {
          return res.status(400).json({ message: 'El documento ya está registrado' });
      }

      // Encriptar la contraseña del usuario
      const per_password_encriptada = await encrypt(per_password);

      // Crear la persona en la base de datos dentro de la transacción
      const nuevaPersona = await personaModel.create({
          per_correo,
          per_documento,
          per_nombre_completo,
          per_telefono,
          per_genero,
          per_usuario,
          per_password: per_password_encriptada, 
      }, { transaction });

      // Subir foto (foto es opcional en registro)
      let per_foto = null;
      if (req.file) {
          try {
              const resultado = await subirImagenACloudinary(req.file, "personas");
              per_foto = resultado.secure_url; // URL imagen 
              nuevaPersona.per_foto = per_foto;
              await nuevaPersona.save({ transaction });
          } catch (error) {
              console.error("Error al subir la imagen:", error);
              await transaction.rollback(); // Deshacer todo si la imagen falla
              return res.status(500).json({ message: "Error al subir la imagen" });
          }
      }

      // Confirmar la transacción
      await transaction.commit();

      // Ocultar la contraseña en la respuesta
      nuevaPersona.set('per_password', undefined, { strict: false });

      return res.status(201).json({
          message: "Persona registrada con éxito",
          data: {
              per_id: nuevaPersona.per_id,
              user: nuevaPersona,
          },
      });

  } catch (error) {
      await transaction.rollback(); // Deshacer cualquier cambio en caso de error
      console.error("Error al registrar persona:", error);
      return res.status(500).json({ message: "Error al registrar persona", error: error.message });
  }
};




const loginPersona = async (req, res) => {
  try {
    const data = matchedData(req);
    const { per_usuario, per_password } = data;

     // Limpiar sesión antes de asignar nuevos valores
     limpiarSesion(req);

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
          { gp_fecha_fin: null },
          { gp_fecha_fin: { [Op.gt]: new Date() } },
        ],
      },
    });

    // Guardar en la sesión el rol si es super admin
    req.session.rol_id = esSuperAdmin ? 1 : null; 
    req.session.esSuperAdmin = !!esSuperAdmin; 
    req.session.ge_id = esSuperAdmin ? 0 : null;

    
    // guardar la sesión
    req.session.save((err) => {
      if (err) {
        console.error("Error al guardar la sesión:", err);
      } else {
        console.log("Sesión guardada correctamente:", req.session);
      }
    });
    
    // console.log("Sesión disponible:", req.session); 


    const token = await tokenSign({
      per_id: persona.per_id,
      per_nombre_completo: persona.per_nombre_completo,
      esSuperAdmin: !!esSuperAdmin, // Booleano indicando si es Super Admin
    });

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









