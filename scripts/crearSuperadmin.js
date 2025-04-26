const bcrypt = require('bcryptjs');
require('dotenv').config();

const { encrypt, compare } = require('../utils/handlePassword');

const { sequelize } = require('../config/mysql');
const { personaModel, geriatricoPersonaRolModel,geriatricoPersonaModel, rolModel } = require('../models');

// ⚠️ Este script solo debe ejecutarse una vez para crear el superadmin inicial
// ejecuta en la terminal: node scripts/crearSuperadmin.js

const SUPER_ADMIN_ROL_ID = 1; // ID del rol super_admin (super administrador)
const GERIATRICO_GLOBAL_ID = 0; // ID del geriátrico global



(async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión establecida correctamente.');

    // IMPORTANTE: el rol superadmin rol_id 1 debe estar creado manualmente en la base de datos
    const yaExisteSuperadmin = await geriatricoPersonaRolModel.findOne({
      where: { rol_id: SUPER_ADMIN_ROL_ID } // SUPERADMIN
    });

    if (yaExisteSuperadmin) {
      console.log('Ya existe un superadmin registrado en el sistema.');
      return;
    }

    const rolSuperadmin = await rolModel.findOne({ where: { rol_id: SUPER_ADMIN_ROL_ID } });
    if (!rolSuperadmin) throw new Error('Rol SUPERADMIN no encontrado, debe crearlo !!');


    // Verificar si ya existe un superadmin registrado (por correo) asignar un correo aqui al super admin
    const correo = 'superadmin@correo.com';
    const existe = await personaModel.findOne({ where: { per_correo: correo } });

    if (existe) {
      console.log(`El correo ${correo} ya está registrado previamente.`);
      return;
    }
    

    // Crear persona
    const hashedPassword = await bcrypt.hash('admin123', 10); // contraseña inicial q despues debe ser cambiada

    const nuevaPersona = await personaModel.create({
      per_foto: null,
      per_documento: '123456789',
      per_nombre_completo: 'Super Administrador',
      per_telefono: '3000000000',
      per_genero: 'M',
      per_usuario: 'superadmin',
      per_password: hashedPassword,
      per_correo: correo
    });

    // IMPORTANTE: El geriátrico con ge_id 0 debe estar creado manualmente en la base de datos
    // Vincular a geriátrico (ID 0)
    await geriatricoPersonaModel.create({
      ge_id: GERIATRICO_GLOBAL_ID,
      per_id: nuevaPersona.per_id,
      gp_activo: true
    });

    // Crear relación geriátrico-persona-rol
    await geriatricoPersonaRolModel.create({
      ge_id: GERIATRICO_GLOBAL_ID,
      per_id: nuevaPersona.per_id,
      rol_id: rolSuperadmin.rol_id,
      gp_fecha_inicio: new Date(),
      gp_fecha_fin: null,
      gp_activo: true
    });


    console.log('Superadmin creado y vinculado correctamente.');
  } catch (error) {
    console.error('Error en la creación del superadmin:', error.message);
  } finally {
    await sequelize.close();
  }
})();
