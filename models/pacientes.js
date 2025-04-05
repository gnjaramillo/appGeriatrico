const { sequelize } = require("../config/mysql");
const { DataTypes } = require("sequelize");

const pacienteModel = sequelize.define(
  "pacientes",
  {
    pac_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
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
    pac_edad: { type: DataTypes.INTEGER, allowNull: false },
    pac_peso: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    pac_talla: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    pac_regimen_eps: {
      type: DataTypes.ENUM("Subsidiado", "Contributivo"),
      allowNull: false,
    },
    pac_nombre_eps: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        // Transformar el nombre a mayúscula inicial para cada palabra
        const capitalizeWords = (str) => {
          return str
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        };
        this.setDataValue("pac_nombre_eps", capitalizeWords(value));
      },
    },
    pac_rh_grupo_sanguineo: {
      type: DataTypes.ENUM("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"),
      allowNull: false,
    },
    pac_talla_camisa: {
      type: DataTypes.ENUM("XS", "S", "M", "L", "XL", "XXL"),
      allowNull: false,
    },

    pac_talla_pantalon: { type: DataTypes.STRING(10), allowNull: false },
  },

  { tableName: "pacientes", timestamps: false }
);

module.exports = pacienteModel;




pacienteModel.associate = (models) => {
  // cada paciente pertenece a una persona.
  pacienteModel.belongsTo(models.personaModel, {
    foreignKey: "per_id",
    as: "persona",
  });

  //Cada paciente puede tener varios cuidados de enfermería VALIDAR ESTO..
  pacienteModel.hasMany(models.cuidadoEnfermeriaModel, {
    foreignKey: "pac_id",
    as: "cuidados",
  });

  //Cada paciente puede tener varios seguimientos
  pacienteModel.hasMany(models.seguimientoModel, {
    foreignKey: "pac_id",
    as: "seguimientos",
  });

  // un paciente puede tener varios acudientes
  pacienteModel.hasMany(models.pacienteAcudienteModel, {
    foreignKey: "pac_id",
    as: "acudientes",
  });

  // un paciente puede tener varios diagnosticos
  pacienteModel.hasMany(models.diagnosticoModel, {
    foreignKey: "pac_id",
    as: "diagnosticos",
  });

  // un paciente puede tener varias recomendaciones
  pacienteModel.hasMany(models.recomendacionModel, {
    foreignKey: "pac_id",
    as: "recomendaciones",
  });


  // Un paciente puede tener muchos medicamentos en su inventario
  pacienteModel.hasMany(models.inventarioMedicamentosPacienteModel, {
    foreignKey: "pac_id",
    as: "medicamentos",
  });
  

  // Un paciente puede tener múltiples formulaciones de medicamentos
  pacienteModel.hasMany(models.formulacionMedicamentosModel, {
    foreignKey: "pac_id",
    as: "formulacion_medicamentos",
  });
  
  
  // Relación: Un paciente puede tener muchos medicamentos vinculados.
/*   pacienteModel.hasMany(models.vinculacionMedicamentoPacienteModel, {
    foreignKey: "pac_id",
    as: "vinculaciones_medicamentos",
  }); */
  
  

// Un paciente puede tener muchos movimientos de medicamentos registrados.
pacienteModel.hasMany(models.movimientosStockPacienteModel, {
  foreignKey: "pac_id",
  as: "movimientos_paciente", 
});



};

