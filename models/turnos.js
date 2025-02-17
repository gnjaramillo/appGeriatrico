const { sequelize } = require('../config/mysql'); 
const { DataTypes } = require('sequelize'); 

const turnoModel = sequelize.define('Turnos', {
    tur_id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    enf_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
            model: 'enfermeras', // Nombre de la tabla en la BD
            key: 'enf_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    se_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
            model: 'sedes', // Nombre de la tabla en la BD
            key: 'se_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },

    tur_fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
    tur_fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
    tur_hora_inicio: { type: DataTypes.TIME, allowNull: false },
    tur_hora_fin: { type: DataTypes.TIME, allowNull: false },
    tur_total_horas: { type: DataTypes.INTEGER, allowNull: false },
    tur_tipo_turno: { 
        type: DataTypes.ENUM('Diurno', 'Nocturno'), 
        allowNull: false 
    }
}, 
{
    tableName: 'turnos',
    timestamps: false,

/* evitar q turnos en una misma sede sean asignados a la misma hora el mismo dia, a la misma enfermera
pero debo en el controlador añadir restriccion de rangos de hora */

    indexes: [
        {
            unique: true,
            fields: ['enf_id', 'se_id', 'tur_fecha_inicio', 'tur_hora_inicio']
        }
    ]

});

// Relaciones
turnoModel.associate = (models) => {
    // Un turno pertenece a una enfermera
    turnoModel.belongsTo(models.enfermeraModel, { 
        foreignKey: 'enf_id', 
        as: 'enfermera' 
    });

    // Un turno pertenece a una sede
    turnoModel.belongsTo(models.sedeModel, { 
        foreignKey: 'se_id', 
        as: 'sede' 
    });
};

module.exports = turnoModel;