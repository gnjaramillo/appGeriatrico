const { sequelize } = require("../config/mysql");
const { DataTypes } = require("sequelize");

const medicamentosModel = sequelize.define(
  "Medicamento",
  {
    med_id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
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

    med_presentacion: {
        type: DataTypes.ENUM(
            'sachet', 'unidad', 'tableta', 'Blíster', 'caja', 'frasco', 'crema', 'spray', 
            'ampolla', 'inyección', 'parche', 'supositorio', 'gotas'
        ),
        allowNull: false
    },

    unidades_por_presentacion: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        allowNull: false 
      },

    med_descripcion: { 
      type: DataTypes.TEXT, 
      allowNull: true // Campo opcional
    }
  },
  { 
    tableName: "medicamentos", 
    timestamps: false 
  }
);


module.exports = medicamentosModel;


medicamentosModel.associate = (models) => {
    


  //  un medicamento puede estar registrado en múltiples inventarios de sedes.
  medicamentosModel.hasMany(models.inventarioMedicamentosSedeModel, { 
    foreignKey: "med_id", 
    as: "medicamentos_sede" 
  });


  //  un medicamento puede estar registrado en múltiples inventarios de pacientes.
  medicamentosModel.hasMany(models.inventarioMedicamentosPacienteModel, { 
    foreignKey: "med_id", 
    as: "medicamentos_paciente" 
  });


  // un medicamento puede estar en múltiples formulaciones médicas. 
medicamentosModel.hasMany(models.formulacionMedicamentosModel, {
  foreignKey: "med_id",
  as: "formulacion",
});
  



};




