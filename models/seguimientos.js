const { sequelize } = require('../config/mysql'); 
const { DataTypes } = require('sequelize'); 





const seguimientoModel = sequelize.define('seguimientos', {
    seg_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    pac_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pacientes', // Nombre exacto de la tabla en la BD
            key: 'pac_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    enf_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'enfermeras',
            key: 'enf_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    cue_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'cuidados_enfermeria',
            key: 'cue_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    seg_pa: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: /^\d{2,3}\/\d{2,3}$/  // Validación para asegurarse de que sea algo como "120/80"
        }
    },
    seg_talla: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true
    },
    seg_fr: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    seg_fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW // Fecha del seguimiento
    },
    seg_peso: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true
    },
    seg_temp: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true
    },
    seg_fc: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    seg_glicemia: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true
    },
    seg_foto: {
        type: DataTypes.STRING,
        allowNull: true
    },
    otro: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'seguimientos',
    timestamps: false 
});



    // relaciones
    seguimientoModel.associate = (models) => {

        // Un seguimiento pertenece a un paciente y a una enfermera.
        seguimientoModel.belongsTo(models.pacienteModel, {
            foreignKey: 'pac_id',
            as: 'paciente'
        });
        seguimientoModel.belongsTo(models.enfermeraModel, {
            foreignKey: 'enf_id',
            as: 'enfermera'
        });
        seguimientoModel.belongsTo(models.cuidadoEnfermeriaModel, {
            foreignKey: 'cue_id',
            as: 'cuidadosEnfermeria'
        });
    };

module.exports = seguimientoModel