const bcrypt = require('bcryptjs');

const { encrypt, compare } = require('../utils/handlePassword');

const { sequelize } = require('../config/mysql');
const { personaModel, geriatricoPersonaRolModel, rolModel } = require('../models');

const Persona = require('../models/personaModel');
const GeriatricoPersonaRol = require('../models/geriatricoPersonaRolModel');
const Rol = require('../models/rolModel');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión establecida correctamente.');

    // Buscar el rol superadmin (ajusta el nombre si es diferente en tu BD)
    const rolSuperadmin = await Rol.findOne({ where: { rol_nombre: 'SUPERADMIN' } });
    if (!rolSuperadmin) throw new Error('Rol SUPERADMIN no encontrado');

    // Verificar si ya existe un superadmin registrado (por correo)
    const correo = 'superadmin@correo.com';
    const existe = await Persona.findOne({ where: { per_correo: correo } });

    if (existe) {
      console.log('Ya existe un superadmin registrado.');
      return;
    }

    // Crear persona
    //const hashedPassword = await encrypt('admin123', 10); // contraseña inicial
    const hashedPassword = await bcrypt.hash('admin123', 10); // contraseña inicial

    const nuevaPersona = await Persona.create({
      per_foto: null,
      per_documento: '123456789',
      per_nombre_completo: 'Super Administrador',
      per_telefono: '3000000000',
      per_genero: 'M',
      per_usuario: 'superadmin',
      per_password: hashedPassword,
      per_correo: correo
    });

    // Crear relación geriátrico-persona-rol
    await GeriatricoPersonaRol.create({
      ge_id: 0, // geriátrico base
      per_id: nuevaPersona.per_id,
      rol_id: rolSuperadmin.rol_id,
      gp_fecha_inicio: new Date(),
      gp_activo: true
    });

    console.log('Superadmin creado y vinculado correctamente.');
  } catch (error) {
    console.error('Error en la creación del superadmin:', error.message);
  } finally {
    await sequelize.close();
  }
})();
