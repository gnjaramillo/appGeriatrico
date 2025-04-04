const { sequelize } = require('../config/mysql');
const { DataTypes } = require('sequelize');

const cuidadoEnfermeriaModel = sequelize.define('CuidadosEnfermeria', {
    cue_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
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

    cue_fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
    cue_fecha_fin: { type: DataTypes.DATEONLY, allowNull: true, defaultValue: null  },

    // Campos de cuidados específicos
    cue_bano: { type: DataTypes.ENUM('CAMA', 'DUCHA'), allowNull: false },
    cue_pa_m: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_pa_t: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_pa_n: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_fc_m: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_fc_t: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_fc_n: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_fr_m: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_fr_t: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_fr_n: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_t_m: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_t_t: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_t_n: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_control_glicemia: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_control_peso: { 
        type: DataTypes.ENUM('mañana', 'tarde', 'noche', 'no aplica'), 
        allowNull: false 
    },
    cue_control_talla: { 
        type: DataTypes.ENUM('mañana', 'tarde', 'noche', 'no aplica'), 
        allowNull: false 
    },
    cue_control_posicion_m: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_control_posicion_t: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_control_posicion_n: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_curaciones: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_sitio_cura: { type: DataTypes.STRING, allowNull: true },
    cue_liq_administrados: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_liq_administrados_detalle: { type: DataTypes.TEXT, allowNull: true },
    cue_liq_eliminados: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_liq_eliminados_detalle: { type: DataTypes.TEXT, allowNull: true },
    cue_med_m: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_med_t: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    cue_med_n: { type: DataTypes.ENUM('S', 'N'), allowNull: false },
    otros_cuidados: { type: DataTypes.TEXT, allowNull: true }
}, 
{
    tableName: 'cuidados_enfermeria',
    timestamps: false
});



module.exports = cuidadoEnfermeriaModel;


// Relaciones
cuidadoEnfermeriaModel.associate = (models) => {
    // Un cuidado de enfermería pertenece a un paciente
    cuidadoEnfermeriaModel.belongsTo(models.pacienteModel, { 
        foreignKey: 'pac_id', 
        as: 'paciente' 
    });

};

