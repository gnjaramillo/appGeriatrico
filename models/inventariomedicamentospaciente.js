const { sequelize } = require("../config/mysql");
const { DataTypes } = require("sequelize");

const inventarioMedicamentosPacienteModel = sequelize.define(
  "InventarioMedicamentosPaciente",
  {
    med_pac_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    pac_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "pacientes", //  nombre de la tabla en la DB
        key: "pac_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    med_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: {
        model: "medicamentos", //  nombre de la tabla en la DB
        key: "med_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    med_total_unidades_disponibles: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false 
    },

  },
  {
    tableName: "inventario_medicamentos_paciente",
    timestamps: false,
  }
);

module.exports = inventarioMedicamentosPacienteModel;

inventarioMedicamentosPacienteModel.associate = (models) => {

// cada medicamento en el inventario pertenece a un paciente
inventarioMedicamentosPacienteModel.belongsTo(models.pacienteModel, {
    foreignKey: "pac_id",
    as: "paciente",
  });



  // cada entrada en el inventario de un paciente está asociado a un solo medicamento
  inventarioMedicamentosPacienteModel.belongsTo(models.medicamentosModel, { 
  foreignKey: "med_id", 
  as: "medicamento" 
});


// Un medicamento del paciente puede haber sido administrado en múltiples ocasiones.
  inventarioMedicamentosPacienteModel.hasMany(models.detalleAdministracionMedicamentoModel, {
  foreignKey: "inv_med_pac_id",
  as: "administraciones_paciente",
});


// Un registro de inventario puede tener múltiples movimientos asociados (entradas o salidas).
inventarioMedicamentosPacienteModel.hasMany(models.movimientosStockPacienteModel, {
  foreignKey: "med_pac_id",
  as: "movimientos_stock", 
});


};






