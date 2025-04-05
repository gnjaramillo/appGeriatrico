/* const { sequelize } = require("../config/mysql");
const { DataTypes } = require("sequelize");

const vinculacionMedicamentoSedeModel = sequelize.define(
  "VinculacionMedicamentoSede",
  {
    vinc_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    se_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "sedes",
        key: "se_id",
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
    tableName: "vinculacion_medicamento_sede",
    timestamps: false,
  }
);

module.exports = vinculacionMedicamentoSedeModel;

vinculacionMedicamentoSedeModel.associate = (models) => {


    // cada vínculo pertenece a UNA sede específica.
  vinculacionMedicamentoSedeModel.belongsTo(models.sedeModel, {
    foreignKey: "se_id",
    as: "sede",
  });


  // Cada vínculo pertenece a UN medicamento específico.
  vinculacionMedicamentoSedeModel.belongsTo(models.medicamentosModel, {
    foreignKey: "med_id",
    as: "medicamento",
  });
};
 */