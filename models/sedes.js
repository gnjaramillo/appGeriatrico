const { sequelize } = require('../config/mysql'); 
const { DataTypes } = require('sequelize'); 




const sedeModel = sequelize.define('Sedes', {
    se_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    se_foto: { type: DataTypes.STRING, allowNull: false  },
    se_nombre: { 
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
            this.setDataValue('se_nombre', capitalizeWords(value));
        }
    },
    se_telefono: { type: DataTypes.STRING, allowNull: false },
    se_direccion: { type: DataTypes.STRING, allowNull: false },
    cupos_totales: { type: DataTypes.INTEGER, allowNull: false },
    cupos_ocupados: { type: DataTypes.INTEGER, allowNull: false },
    ge_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
            model: 'geriatricos', // Debe coincidir con el nombre de la tabla en la DB
            key: 'ge_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    se_activo: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: true 
    } 
    
    

}, { tableName: 'sedes', timestamps: false });


// una sede pertenece a un geriatrico
sedeModel.associate = (models) => {
    sedeModel.belongsTo(models.geriatricoModel, { 
        foreignKey: 'ge_id', 
        as: 'geriatrico' });


// Una sede tiene muchas personas a través de SedePersonaRol
    sedeModel.belongsToMany(models.personaModel, {
        through: models.sedePersonaRolModel,  // Define la tabla intermedia
        foreignKey: 'se_id',                  // Clave foránea en la tabla intermedia que hace referencia a la sede
        as: 'personas'                        // Alias para acceder a las personas asociadas a una sede
    });


// Una sede (sedeModel) puede estar asociada a muchas personas con distintos roles.
    sedeModel.hasMany(models.sedePersonaRolModel, { 
        foreignKey: 'se_id', 
        as: 'roles' 
    });


//Cada sede puede tener múltiples turnos asignados a diferentes enfermeras.
    sedeModel.hasMany(models.turnoModel, { 
        foreignKey: 'se_id', 
        as: 'turnos' 
    });
    

};

module.exports = sedeModel;