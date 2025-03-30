const { sequelize } = require("../config/mysql");
const { DataTypes } = require("sequelize");



const administracionMedicamentosModel = sequelize.define(
  "AdministracionMedicamentos",
  {
    admin_id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
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
    admin_fecha_inicio: { 
      type: DataTypes.DATEONLY, 
      allowNull: false 
    },
    admin_fecha_fin: { 
      type: DataTypes.DATEONLY, 
      allowNull: false 
    },
    admin_cantidad: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false 
    },
    admin_cantidad_dosis: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false 
    },
    admin_hora: { 
      type: DataTypes.TIME, 
      allowNull: false 
    },
    admin_metodo: { 
      type: DataTypes.ENUM("Oral", "Intravenosa", "Subcutánea", "Tópica", "Inhalación"), 
      allowNull: false 
    },
    admin_estado: { 
      type: DataTypes.ENUM("Pendiente", "En Curso", "Completado", "Cancelado"), 
      defaultValue: "Pendiente" 
    },

    
  },
  { 
    tableName: "administracion_medicamentos", 
    timestamps: false 
  }
);

// Definir relaciones
administracionMedicamentosModel.associate = (models) => {

// una receta pertenece a un paciente especifico
  administracionMedicamentosModel.belongsTo(models.pacienteModel, {
    foreignKey: "pac_id",
    as: "paciente",
  });


  // Una receta/programación de medicamento puede tener varios detalles de administración cuando se suministra en diferentes momentos
  administracionMedicamentosModel.hasMany(models.detalleAdministracionMedicamentoModel, { 
    foreignKey: "admin_id", 
    as: "detalles_administracion" 
  });
  
  
};

module.exports = administracionMedicamentosModel;






/* 
const { sequelize } = require("../config/mysql");
const { DataTypes } = require("sequelize");



const administracionMedicamentosModel = sequelize.define(
  "AdministracionMedicamentos",
  {
    admin_id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
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
    inv_med_sede_id: { 
      type: DataTypes.INTEGER, 
      allowNull: true,
      references: {
        model: "inventario_medicamentos_sede", // nombre de la tabla en la BD
        key: "med_sede_id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    inv_med_pac_id: { 
      type: DataTypes.INTEGER, 
      allowNull: true,
      references: {
        model: "inventario_medicamentos_paciente",
        key: "med_pac_id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    admin_fecha_inicio: { 
      type: DataTypes.DATEONLY, 
      allowNull: false 
    },
    admin_fecha_fin: { 
      type: DataTypes.DATEONLY, 
      allowNull: false 
    },
    admin_cantidad: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false 
    },
    admin_cantidad_dosis: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false 
    },
    admin_hora: { 
      type: DataTypes.TIME, 
      allowNull: false 
    },
    admin_metodo: { 
      type: DataTypes.ENUM("Oral", "Intravenosa", "Subcutánea", "Tópica", "Inhalación"), 
      allowNull: false 
    },
    admin_estado: { 
      type: DataTypes.ENUM("Pendiente", "En Curso", "Completado", "Cancelado"), 
      defaultValue: "Pendiente" 
    },

    
  },
  { 
    tableName: "administracion_medicamentos", 
    timestamps: false 
  }
);

// Definir relaciones
administracionMedicamentosModel.associate = (models) => {

// una receta pertenece a un paciente especifico
  administracionMedicamentosModel.belongsTo(models.pacienteModel, {
    foreignKey: "pac_id",
    as: "paciente",
  });


    // Si el medicamento proviene del inventario de la sede
  administracionMedicamentosModel.belongsTo(models.inventarioMedicamentosSedeModel, {
    foreignKey: "inv_med_sede_id",
    as: "medicamento_sede",
  });


  // Si el medicamento proviene del inventario del paciente
  administracionMedicamentosModel.belongsTo(models.inventarioMedicamentosPacienteModel, {
    foreignKey: "inv_med_pac_id",
    as: "medicamento_paciente",
  });

  // Una receta/programación de medicamento puede tener varios detalles de administración cuando se suministra en diferentes momentos
  administracionMedicamentosModel.hasMany(models.detalleAdministracionMedicamentoModel, { 
    foreignKey: "admin_id", 
    as: "detalles_administracion" 
  });
  
  
};

module.exports = administracionMedicamentosModel; */
