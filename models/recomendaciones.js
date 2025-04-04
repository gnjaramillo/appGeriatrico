const { sequelize } = require('../config/mysql'); 
const { DataTypes } = require('sequelize'); 

const recomendacionModel = sequelize.define('recomendaciones', { 
    rec_id: { 
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
    rec_fecha: { 
        type: DataTypes.DATEONLY, 
        allowNull: false 
    },
    rec_cubrir_piel_m: { 
        type: DataTypes.ENUM('S', 'N'), 
        allowNull: false 
    },
    rec_cubrir_piel_t: { 
        type: DataTypes.ENUM('S', 'N'), 
        allowNull: false 
    },
    rec_cubrir_piel_n: { 
        type: DataTypes.ENUM('S', 'N'), 
        allowNull: false 
    },
    rec_asistir_alimentacion_m: { 
        type: DataTypes.ENUM('S', 'N'), 
        allowNull: false 
    },
    rec_asistir_alimentacion_t: { 
        type: DataTypes.ENUM('S', 'N'), 
        allowNull: false 
    },
    rec_asistir_alimentacion_n: { 
        type: DataTypes.ENUM('S', 'N'), 
        allowNull: false 
    },
    rec_prevenir_caidas: { 
        type: DataTypes.ENUM('S', 'N'), 
        allowNull: false 
    },
    rec_actividad_ocupacional: { 
        type: DataTypes.ENUM('S', 'N'), 
        allowNull: false 
    },
    rec_actividad_fisica: { 
        type: DataTypes.ENUM('S', 'N'), 
        allowNull: false 
    },
    rec_otras: { 
        type: DataTypes.TEXT, 
        defaultValue: null 
    }
}, { 
    tableName: 'recomendaciones', 
    timestamps: false 
});

module.exports = recomendacionModel;

recomendacionModel.associate = (models) => {
    // Cada recomendación pertenece a un paciente
    recomendacionModel.belongsTo(models.pacienteModel, { 
        foreignKey: 'pac_id', 
        as: 'paciente' 
    });
};

