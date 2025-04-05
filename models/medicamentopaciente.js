/* const { sequelize } = require("../config/mysql");
const { DataTypes } = require("sequelize");

const vinculacionMedicamentoPacienteModel = sequelize.define(
  "VinculacionMedicamentoPaciente",
  {
    vinc_pac_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
        key: "med_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "vinculacion_medicamento_paciente",
    timestamps: false,
  }
);

module.exports = vinculacionMedicamentoPacienteModel;

vinculacionMedicamentoPacienteModel.associate = (models) => {

    // Cada vínculo de medicamento pertenece a UN paciente específico.
  vinculacionMedicamentoPacienteModel.belongsTo(models.pacienteModel, {
    foreignKey: "pac_id",
    as: "paciente",
  });

  // Cada vínculo de medicamento pertenece a UN medicamento específico.
  vinculacionMedicamentoPacienteModel.belongsTo(models.medicamentosModel, {
    foreignKey: "med_id",
    as: "medicamento",
  });
};
 */