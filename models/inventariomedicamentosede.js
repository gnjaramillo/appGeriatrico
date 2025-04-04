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
    tableName: "inventario_medicamentos_sede", 
    timestamps: false 
  }
);

module.exports = inventarioMedicamentosSedeModel;



inventarioMedicamentosSedeModel.associate = (models) => {
    
  // cada medicamento en el inventario pertenece a una sede
  inventarioMedicamentosSedeModel.belongsTo(models.sedeModel, {
    foreignKey: "se_id",
    as: "sede",
  });



  // cada entrada en el inventario de una sede está asociada a un solo medicamento
  inventarioMedicamentosSedeModel.belongsTo(models.medicamentosModel, { 
    foreignKey: "med_id", 
    as: "medicamento" 
  });


  // un medicamento de la sede puede ser administrado múltiples veces.  
inventarioMedicamentosSedeModel.hasMany(models.detalleAdministracionMedicamentoModel, {
  foreignKey: "inv_med_sede_id",
  as: "administraciones_sede",
});

// Un registro de inventario puede tener múltiples movimientos asociados (entradas o salidas).
inventarioMedicamentosSedeModel.hasMany(models.movimientosStockSedeModel, {
  foreignKey: "med_sede_id",
  as: "movimientos_stock",
});




};





