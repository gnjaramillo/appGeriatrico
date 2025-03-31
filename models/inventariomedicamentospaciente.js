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
    med_nombre: { 
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
        this.setDataValue("med_nombre", capitalizeWords(value));
      },
    },
    med_cantidad: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    med_presentacion: {
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
        this.setDataValue("med_presentacion", capitalizeWords(value));
      },

    },
    unidades_por_presentacion: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    med_total_unidades_disponibles: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false 
    },
    med_descripcion: { 
      type: DataTypes.TEXT, 
      allowNull: true // Campo opcional
    }


  },
  {
    tableName: "inventario_medicamentos_paciente",
    timestamps: false,
  }
);

inventarioMedicamentosPacienteModel.associate = (models) => {

// cada medicamento en el inventario pertenece a un paciente
inventarioMedicamentosPacienteModel.belongsTo(models.pacienteModel, {
    foreignKey: "pac_id",
    as: "paciente",
  });


// Un medicamento del paciente puede haber sido administrado en múltiples ocasiones.
/* inventarioMedicamentosPacienteModel.hasMany(models.administracionMedicamentosModel, {
  foreignKey: "inv_med_pac_id",
  as: "administraciones_paciente",
});
 */

// Un medicamento en el inventario del paciente puede haber sido administrado varias veces.
inventarioMedicamentosPacienteModel.hasMany(models.detalleAdministracionMedicamentoModel, { 
  foreignKey: "inv_med_pac_id", 
  as: "detalles_paciente" 
});


};




module.exports = inventarioMedicamentosPacienteModel;
