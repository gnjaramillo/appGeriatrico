const { sequelize } = require('../config/mysql'); 
const { DataTypes } = require('sequelize'); 
const moment = require("moment-timezone");




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
    seg_fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // Asigna automáticamente la fecha y hora
        get() {
            return moment(this.getDataValue("seg_fecha"))
                .tz("America/Bogota")
                .format("YYYY-MM-DD HH:mm:ss");
        }
    },
    seg_pa: {
    type: DataTypes.STRING,
    allowNull: true,
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
    timestamps: false,
    hooks: {
        beforeCreate: (seguimiento) => {
            seguimiento.seg_fecha = moment().tz("America/Bogota").format("YYYY-MM-DD HH:mm:ss");
        },
    },
});

module.exports = seguimientoModel

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

    };
