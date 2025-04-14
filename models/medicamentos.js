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
          'sachet', 'unidad', 'tableta', 'blíster', 'caja', 'frasco', 'crema', 'spray', 
          'ampolla', 'inyección', 'parche', 'supositorio', 'gotas', 'tubo', 'cápsula'
      ),
      allowNull: false
  },

    unidades_por_presentacion: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        allowNull: false 
      },

      
    med_tipo_contenido: {
      type: DataTypes.ENUM(
        'mililitros', 'gramos', 'unidades', 'tabletas', 'cápsulas',
        'disparos', 'parches', 'gotas', 'supositorios', 'otros'
      ),
      allowNull: false,
      defaultValue: 'unidades'
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
  

// Relación: Un medicamento puede estar vinculado a muchas sedes.
/* medicamentosModel.hasMany(models.vinculacionMedicamentoSedeModel, {
  foreignKey: "med_id",
  as: "vinculaciones_sedes",
}); */


// Relación: Un medicamento puede estar vinculado a varios pacientes.
/* medicamentosModel.hasMany(models.vinculacionMedicamentoPacienteModel, {
  foreignKey: "med_id",
  as: "vinculaciones_pacientes",
}); */


// Un medicamento puede estar involucrado en múltiples movimientos de stock en diferentes sedes.
medicamentosModel.hasMany(models.movimientosStockSedeModel, {
  foreignKey: "med_id",
  as: "movimientos_sede",
});


// Un medicamento puede estar involucrado en múltiples movimientos de stock en diferentes pacientes.
medicamentosModel.hasMany(models.movimientosStockPacienteModel, {
  foreignKey: "med_id",
  as: "movimientos_paciente", 
});




};




