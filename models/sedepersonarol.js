const { sequelize } = require('../config/mysql'); 
const { DataTypes } = require('sequelize'); 



const sedePersonaRolModel = sequelize.define('SedePersonasRoles', {
  sp_id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  se_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: 'sedes', 
      key: 'se_id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  per_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: 'personas', 
      key: 'per_id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  rol_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: 'roles', 
      key: 'rol_id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  sp_fecha_inicio: { 
    type: DataTypes.DATEONLY, 
    allowNull: false 
  },
  sp_fecha_fin: { 
    type: DataTypes.DATEONLY, 
    allowNull: true, 
    defaultValue: null 
  },
  sp_activo: { 
    type: DataTypes.BOOLEAN, 
    allowNull: false, 
    defaultValue: true 
  }
}, 

{
  tableName: 'sede_personas_roles', 
  timestamps: false 
});


// Relaciones
sedePersonaRolModel.associate = (models) => {
  sedePersonaRolModel.belongsTo(models.personaModel, { foreignKey: 'per_id', as: 'persona' });
  sedePersonaRolModel.belongsTo(models.sedeModel, { foreignKey: 'se_id', as: 'sede' });
  sedePersonaRolModel.belongsTo(models.rolModel, { foreignKey: 'rol_id', as: 'rol' });
};


module.exports = sedePersonaRolModel; 




/* const { sequelize } = require('../config/mysql');
const { DataTypes } = require('sequelize');

const sedePersonaRolModel = sequelize.define('SedePersonaRol', {
    se_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: 'Sedes', key: 'se_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    per_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: 'Personas', key: 'per_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    rol_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: 'Roles', key: 'rol_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    }
}, { 
    tableName: 'sede_personas_roles', 
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['se_id', 'per_id'] // Evita múltiples roles por sede para una misma persona
        }
    ]
});

module.exports = sedePersonaRolModel; */
/* 

¿Cómo funciona este ajuste?
Si intentas insertar dos registros con la misma persona (per_id) y la misma sede (se_id) pero con roles distintos, fallará porque la combinación se_id + per_id es única.
Así garantizamos que una persona solo puede tener un rol por sede. */