const { sequelize } = require('../config/mysql'); 
const { DataTypes } = require('sequelize'); 



const geriatricoPersonaRolModel = sequelize.define('GeriatricoPersonasRoles', {
  gp_id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  ge_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: 'geriatricos', 
      key: 'ge_id'
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
  gp_fecha_inicio: { 
    type: DataTypes.DATEONLY, 
    allowNull: false 
  },
  gp_fecha_fin: { 
    type: DataTypes.DATEONLY, 
    allowNull: true, 
    defaultValue: null 
  }
}, 

{
  tableName: 'geriatrico_persona_rol', 
  timestamps: false 
});


// Relaciones
geriatricoPersonaRolModel.associate = (models) => {
    geriatricoPersonaRolModel.belongsTo(models.personaModel, { foreignKey: 'per_id', as: 'persona' });
    geriatricoPersonaRolModel.belongsTo(models.geriatricoModel, { foreignKey: 'ge_id', as: 'geriatrico' });
    geriatricoPersonaRolModel.belongsTo(models.rolModel, { foreignKey: 'rol_id', as: 'rol' });
};


module.exports = geriatricoPersonaRolModel;