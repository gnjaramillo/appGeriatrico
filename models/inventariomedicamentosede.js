const { sequelize } = require("../config/mysql");
const { DataTypes } = require("sequelize");

const inventarioMedicamentosSedeModel = sequelize.define(
  "InventarioMedicamentosSede",
  {
    med_sede_id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    se_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: {
        model: "sedes", //  nombre de la tabla en la DB
        key: "se_id",
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
      allowNull: false 
    },
    med_presentacion: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    unidades_por_presentacion: { 
        type: DataTypes.INTEGER.UNSIGNED, 
        allowNull: false 
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
    tableName: "inventario_medicamentos_sede", 
    timestamps: false 
  }
);

inventarioMedicamentosSedeModel.associate = (models) => {
    
  // cada medicamento en el inventario pertenece a una sede
  inventarioMedicamentosSedeModel.belongsTo(models.sedeModel, {
    foreignKey: "se_id",
    as: "sede",
  });

  // Un medicamento de la sede puede haber sido administrado en múltiples recetas.
/* 
*/  

  // Un medicamento en el inventario de la sede puede haber sido administrado varias veces.
  inventarioMedicamentosSedeModel.hasMany(models.detalleAdministracionMedicamentoModel, { 
    foreignKey: "inv_med_sede_id", 
    as: "detalles_sede" 
  });
  



};

module.exports = inventarioMedicamentosSedeModel;