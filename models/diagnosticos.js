const { sequelize } = require('../config/mysql'); 
const { DataTypes } = require('sequelize'); 

const diagnosticoModel = sequelize.define('diagnosticos', { 
    diag_id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    pac_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: {
            model: 'pacientes', 
            key: 'pac_id'
        }, 
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    diag_fecha: { 
        type: DataTypes.DATEONLY, 
        allowNull: false 
    },
    diag_descripcion: { 
        type: DataTypes.TEXT, 
        allowNull: false 
    }
}, { 
    tableName: 'diagnosticos', 
    timestamps: false 
});


module.exports = diagnosticoModel;

diagnosticoModel.associate = (models) => {
    // Cada diagnóstico pertenece a un paciente
    diagnosticoModel.belongsTo(models.pacienteModel, { 
        foreignKey: 'pac_id', 
        as: 'paciente' 
    });
};

