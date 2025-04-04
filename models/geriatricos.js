const { sequelize } = require('../config/mysql'); 
const { DataTypes } = require('sequelize'); 




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
        allowNull: false,
        set(value) {
            const capitalizeWords = (str) => {
                return str
                    .toLowerCase()
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");
            };
            this.setDataValue('ge_nombre', capitalizeWords(value));
        }
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
    },
    ge_activo: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: true 
    } // Soft Delete

  }, 
  
  { tableName: 'geriatricos', 
    timestamps: false });
    
module.exports = geriatricoModel;

// un geriatrico puede tener muchas sedes
geriatricoModel.associate = (models) => {
    geriatricoModel.hasMany(models.sedeModel, { 
        foreignKey: 'ge_id', 
        as: 'sedes' 
    });

    // Un geriatrico puede tener muchas personas a través de geriatricoPersonaRol
    geriatricoModel.belongsToMany(models.personaModel, {
        through: models.geriatricoPersonaRolModel,  // Define la tabla intermedia
        foreignKey: 'ge_id',                  // Clave foránea en la tabla intermedia que hace referencia al geriatrico
        as: 'personas'                        // Alias para acceder a las personas asociadas a un geriatrico
    });


    // Un geriátrico puede tener muchas personas a través de la tabla intermedia geriatrico_persona
    geriatricoModel.belongsToMany(models.personaModel, {
        through: models.geriatricoPersonaModel,  
        foreignKey: 'ge_id',
        as: 'vinculados_personas'
    });

};



