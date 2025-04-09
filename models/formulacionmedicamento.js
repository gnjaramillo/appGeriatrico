const { sequelize } = require("../config/mysql");
const { DataTypes } = require("sequelize");


// es para registrar una formula medica
const formulacionMedicamentosModel = sequelize.define(
  "FormulacionMedicamentos",
  {
    admin_id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    pac_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: {
        model: "pacientes", 
        key: "pac_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    med_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
          model: "medicamentos",
          key: 'med_id'
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    admin_fecha_inicio: { 
      type: DataTypes.DATEONLY, 
      allowNull: false 
    },
    admin_fecha_fin: { 
      type: DataTypes.DATEONLY, 
      allowNull: false 
    },
    admin_fecha_suspension : { 
      type: DataTypes.DATEONLY, 
      allowNull: true 
    },

    admin_motivo_suspension: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    admin_suspendido_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "personas",
        key: "per_id"
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE"
    },
    
    admin_dosis_por_toma: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },


admin_total_dosis_periodo: {
  type: DataTypes.VIRTUAL,
  get() {
    const fechaInicio = new Date(this.admin_fecha_inicio);
    const fechaFin = new Date(this.admin_fecha_fin);
    // Calculamos días entre las fechas (incluyendo ambos extremos)
    const dias = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;
    return dias;
  }
},

admin_tipo_cantidad: {
  type: DataTypes.ENUM('unidades', 'mililitros', 'gramos', 'gotas', 'otro'),
  allowNull: false
},
admin_hora: { 
  type: DataTypes.TIME, 
  allowNull: false,
},

admin_metodo: {
  type: DataTypes.ENUM('Oral', 'Intravenosa', 'Subcutánea', 'Tópica', 'Inhalación', 'Rectal', 'Ótica', 'Oftálmica', 'Nasal', 'Otro'),
  allowNull: false
},
admin_estado: {
  type: DataTypes.ENUM('Pendiente', 'En Curso', 'Completado', 'Suspendido'),
  defaultValue: 'Pendiente'
},
    
  },
  { 
    tableName: "formulacion_medicamentos", 
    timestamps: false 
  }
);


module.exports = formulacionMedicamentosModel;


// Definir relaciones
formulacionMedicamentosModel.associate = (models) => {

  
// una receta pertenece a un paciente especifico
  formulacionMedicamentosModel.belongsTo(models.pacienteModel, {
    foreignKey: "pac_id",
    as: "paciente",
  });


// Cada formulación médica (FormulacionMedicamento) está relacionada con un único medicamento.
  formulacionMedicamentosModel.belongsTo(models.medicamentosModel, { 
    foreignKey: "med_id", 
    as: "medicamentos_formulados" 
  });  


// una formulación médica puede tener múltiples registros en detalle administración.
  formulacionMedicamentosModel.hasMany(models.detalleAdministracionMedicamentoModel, { 
    foreignKey: "admin_id", 
    as: "medicamento_administrado" 
  }); 
  

// Cada formulación médica suspendida está relacionada con la persona que realizó la suspensión en el sistema.
formulacionMedicamentosModel.belongsTo(models.personaModel, {
    foreignKey: "admin_suspendido_por",
    as: "suspendido_por"
  });
  

  
};









