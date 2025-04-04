const { sequelize } = require('../config/mysql'); 
const { DataTypes } = require('sequelize'); 



const rolModel = sequelize.define('Roles', {
    rol_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    rol_nombre: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true,
        set(value) {
            // Convertir a mayúscula inicial cada palabra
            this.setDataValue('rol_nombre', value.toLowerCase().replace(/\b\w/g, char => char.toUpperCase()));
        }
    },
    rol_descripcion: { type: DataTypes.STRING }
}, 
{ 
    tableName: 'roles', 
    timestamps: false 
});


// Exportar el modelo
module.exports = rolModel;

// Relaciones
rolModel.associate = (models) => {
    // Un rol tiene muchas personas a través de SedePersonaRol
    rolModel.belongsToMany(models.personaModel, {
        through: models.sedePersonaRolModel,
        foreignKey: 'rol_id',
        as: 'personasEnSede'
    });

    // Un rol tiene muchas personas a través de GeriatricoPersonaRol
    rolModel.belongsToMany(models.personaModel, {
        through: models.geriatricoPersonaRolModel,
        foreignKey: 'rol_id',
        as: 'personasEnGeriatrico'
    });


};

