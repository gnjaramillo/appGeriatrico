const { sequelize } = require('../config/mysql');
const { DataTypes } = require('sequelize');

const geriatricoPersonaModel = sequelize.define('GeriatricoPersona', {
    gp_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    ge_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'geriatricos', // Nombre de la tabla en la BD
            key: 'ge_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    per_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'personas', // Nombre de la tabla en la BD
            key: 'per_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    gp_fecha_vinculacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
   
    gp_activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'geriatrico_persona',
    timestamps: false
});
module.exports = geriatricoPersonaModel;

// Definir asociaciones
geriatricoPersonaModel.associate = (models) => {
    // un geriátrico puede asociar muchas personas
    geriatricoPersonaModel.belongsTo(models.geriatricoModel, {
        foreignKey: 'ge_id',
        as: 'geriatrico'
    });

    // una persona puede estar vinculada a varios geriátricos
    geriatricoPersonaModel.belongsTo(models.personaModel, {
        foreignKey: 'per_id',
        as: 'persona'
    });
};

