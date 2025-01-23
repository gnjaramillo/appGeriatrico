const { sequelize } = require('../config/mysql'); // Asegúrate de que esta ruta sea correcta
const { DataTypes } = require('sequelize'); // Usa "DataTypes" con T mayúscula




// Modelo Geriatrico
const geriatricoModel  = sequelize.define('Geriatricos', {
    ge_id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    ge_logo: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    ge_nombre: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    ge_nit: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true 
    },
    ge_color_principal: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    ge_color_secundario: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    ge_color_terciario: { 
        type: DataTypes.STRING, 
        allowNull: false 
    }
  }, 
  
  { tableName: 'geriatricos', timestamps: false });


// un geriatrico puede tener muchas sedes
geriatricoModel.associate = (models) => {
    geriatricoModel.hasMany(models.sedeModel, { 
        foreignKey: 'ge_id', as: 'sedes' });

// Un geriatrico puede tener muchas personas a través de geriatricoPersonaRol
    geriatricoModel.belongsToMany(models.personaModel, {
        through: models.geriatricoPersonaRolModel,  // Define la tabla intermedia
        foreignKey: 'ge_id',                  // Clave foránea en la tabla intermedia que hace referencia al geriatrico
        as: 'personas'                        // Alias para acceder a las personas asociadas a un geriatrico
    });

};

module.exports = geriatricoModel;


