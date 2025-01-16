
const { sequelize } = require("../config/mysql");
const { DataTypes } = require("sequelize");

const acudienteModel = sequelize.define('acudientes', {
      acu_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      pac_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      per_id: {
        type: DataTypes.INTEGER,
        allowNull: false,  // Clave foránea a la tabla personas
      },
      acu_parentesco: {
        type: DataTypes.STRING,
        allowNull: false,  // Relación entre el acudiente y el paciente
      },
      acu_foto: {
        type: DataTypes.STRING,
        allowNull: true,  // Foto del acudiente (opcional)
      },
},
    {
      tableName: "acudientes",
      timestamps: false,
});


// un acudiente se relaciona con un paciente
acudienteModel.associate = (models) => {
  acudienteModel.belongsTo(models.pacienteModel, {
  foreignKey: "pac_id",
  as: "paciente",
});


// cada acudiente pertenece a una persona
acudienteModel.belongsTo(models.personaModel, 
  { foreignKey: 'per_id', 
    as: 'persona' 
});


};


module.exports = acudienteModel

