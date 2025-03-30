const { sequelize } = require("../config/mysql");
const { DataTypes } = require("sequelize");
const {administracionMedicamentosModel} = require("../models")




const detalleAdministracionMedicamentoModel = sequelize.define(
    "DetalleAdministracionMedicamento",
    {
      detalle_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      admin_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        
        references: {
          model: "administracion_medicamentos",
          key: "admin_id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      inv_med_sede_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "inventario_medicamentos_sede",
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
      detalle_cantidad: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      detalle_fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      detalle_hora: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      detalle_observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "detalle_administracion_medicamento",
      timestamps: false,
    }
  );


  // Definir relaciones
  detalleAdministracionMedicamentoModel.associate = (models) => {

    // Cada detalle de administración está vinculado a una administración de medicamento específica (la receta programada).
    detalleAdministracionMedicamentoModel.belongsTo(models.administracionMedicamentosModel, {
        foreignKey: "admin_id",
        as: "administracion"
      });
      
      // Si el medicamento administrado es de la sede, se guarda su referencia
      detalleAdministracionMedicamentoModel.belongsTo(models.inventarioMedicamentosSedeModel, {
        foreignKey: "inv_med_sede_id",
        as: "medicamento_sede"
      });
      
      // si el medicamento administrado proviene del inventario del paciente, se guarda su referencia
      detalleAdministracionMedicamentoModel.belongsTo(models.inventarioMedicamentosPacienteModel, {
        foreignKey: "inv_med_pac_id",
        as: "medicamento_paciente"
      });
      
};


module.exports =  detalleAdministracionMedicamentoModel 

// Hook para actualizar inventario de medicamentos y estado de administración
detalleAdministracionMedicamentoModel.beforeCreate(async (detalle) => {
    if (detalle.inv_med_sede_id) {
      const medicamentoSede = await inventarioMedicamentosSedeModel.findByPk(detalle.inv_med_sede_id);
      if (medicamentoSede) {
        medicamentoSede.med_cantidad -= detalle.detalle_cantidad;
        await medicamentoSede.save();
      }
    }
    
    if (detalle.inv_med_pac_id) {
      const medicamentoPaciente = await inventarioMedicamentosPacienteModel.findByPk(detalle.inv_med_pac_id);
      if (medicamentoPaciente) {
        medicamentoPaciente.med_cantidad -= detalle.detalle_cantidad;
        await medicamentoPaciente.save();
      }
    }
  
    // Actualizar el estado de la administración a "En Curso"
    const administracion = await administracionMedicamentosModel.findByPk(detalle.admin_id);
    if (administracion && administracion.admin_estado === "Pendiente") {
      administracion.admin_estado = "En Curso";
      await administracion.save();
    }
  });
  
  // Hook para verificar si se completó la administración
  detalleAdministracionMedicamentoModel.afterCreate(async (detalle) => {
    const administracion = await administracionMedicamentosModel.findByPk(detalle.admin_id);
    if (administracion) {
      const totalDetalles = await detalleAdministracionMedicamentoModel.sum("detalle_cantidad", {
        where: { admin_id: detalle.admin_id }
      });
      if (totalDetalles >= administracion.admin_cantidad_dosis) {
        administracion.admin_estado = "Completado";
        await administracion.save();
      }
    }
  });
  
    
    
  