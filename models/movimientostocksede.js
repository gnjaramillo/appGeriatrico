const { sequelize } = require("../config/mysql");
const { DataTypes } = require("sequelize");

const movimientosStockSedeModel = sequelize.define(
  "MovimientosStockSede",
  {
    mov_se_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    med_sede_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "inventario_medicamentos_sede",
        key: "med_sede_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
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
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "personas",
        key: "per_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM("Entrada", "Salida"),
      allowNull: false,
    },
    med_origen: {
      type: DataTypes.ENUM("EPS", "Compra Directa", "Donación", "Otro"),
      allowNull: true,
      get() {
        const value = this.getDataValue('med_origen');
        return value === null ? undefined : value;
      }
    },
    med_destino: {
      type: DataTypes.ENUM('Baja', 'Devolución', 'Administración Paciente',  'Otro'),
      allowNull: true,
      get() {
        const value = this.getDataValue('med_destino');
        return value === null ? undefined : value;
      }
    },
    
    fecha: {
        type: DataTypes.DATEONLY,
        defaultValue: () => new Date(), // solo la parte de fecha
    },
      
  },
  {
    tableName: "movimientos_stock_sede",
    timestamps: false,
  }
);

module.exports = movimientosStockSedeModel;


movimientosStockSedeModel.associate = (models) => {

    // Cada movimiento de stock está vinculado a un registro del inventario de la sede.
    movimientosStockSedeModel.belongsTo(models.inventarioMedicamentosSedeModel, {
      foreignKey: "med_sede_id",
      as: "inventario_sede",
    });
  
    // Relación con la sede en la que se hizo el movimiento
    movimientosStockSedeModel.belongsTo(models.sedeModel, {
      foreignKey: "se_id",
      as: "sede",
    });
  
    // El movimiento está asociado a un medicamento específico
    movimientosStockSedeModel.belongsTo(models.medicamentosModel, {
      foreignKey: "med_id",
      as: "medicamento",
    });
  
    // Registra quién realizó el movimiento de stock (admin sede, enfermero, etc.).
    movimientosStockSedeModel.belongsTo(models.personaModel, {
      foreignKey: "usuario_id",
      as: "usuario",
    });
  };
  