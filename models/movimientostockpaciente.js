const { sequelize } = require("../config/mysql");
const { DataTypes } = require("sequelize");

const movimientosStockPacienteModel = sequelize.define(
  "MovimientosStockPaciente",
  {
    mov_pac_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    med_pac_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "inventario_medicamentos_paciente",
        key: "med_pac_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
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
      defaultValue: () => new Date(), // solo la parte de la fecha
    },
  },
  {
    tableName: "movimientos_stock_paciente",
    timestamps: false,
  }
);

module.exports = movimientosStockPacienteModel;


movimientosStockPacienteModel.associate = (models) => {
    
    // Cada movimiento está asociado a un registro en el inventario de medicamentos del paciente.
    movimientosStockPacienteModel.belongsTo(models.inventarioMedicamentosPacienteModel, {
      foreignKey: "med_pac_id",
      as: "inventario_paciente",
    });
  
    // Cada movimiento está vinculado a un paciente.
    movimientosStockPacienteModel.belongsTo(models.pacienteModel, {
      foreignKey: "pac_id",
      as: "paciente",
    });
  
    // El movimiento está asociado a un medicamento específico
    movimientosStockPacienteModel.belongsTo(models.medicamentosModel, {
      foreignKey: "med_id",
      as: "medicamento",
    });
  
    // Persona (enfermero, admin sede, etc.) que hizo el movimiento.
    movimientosStockPacienteModel.belongsTo(models.personaModel, {
      foreignKey: "usuario_id",
      as: "usuario",
    });
  };
  
