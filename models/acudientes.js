const { sequelize } = require("../config/mysql");
const { DataTypes } = require("sequelize");

const pacienteAcudienteModel = sequelize.define(
  "paciente_acudiente",
  {
    pa_id: {
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
    per_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "personas",
        key: "per_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    pa_parentesco: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pa_activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "paciente_acudiente",
    timestamps: false,
  }
);

module.exports = pacienteAcudienteModel;



// Relaciones
pacienteAcudienteModel.associate = (models) => {
  // Un paciente puede tener varios acudientes
  pacienteAcudienteModel.belongsTo(models.pacienteModel, {
    foreignKey: "pac_id",
    as: "paciente",
  });

  // Un acudiente (persona) puede estar relacionado con varios pacientes
  pacienteAcudienteModel.belongsTo(models.personaModel, {
    foreignKey: "per_id",
    as: "persona",
  });
};


