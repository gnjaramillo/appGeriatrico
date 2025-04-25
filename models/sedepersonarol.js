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
    onUpdate: 'CASCADE',
    unique: false  // Asegura que no haya restricción UNIQUE

  },
  per_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: 'personas', 
      key: 'per_id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    unique: false  // Asegura que no haya restricción UNIQUE

  },
  rol_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: 'roles', 
      key: 'rol_id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    unique: false  // Asegura que no haya restricción UNIQUE

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
  timestamps: false,
  indexes: [] // Evita que Sequelize cree índices automáticamente
});

module.exports = sedePersonaRolModel; 

// Relaciones
sedePersonaRolModel.associate = (models) => {
  sedePersonaRolModel.belongsTo(models.personaModel, { 
    foreignKey: 'per_id', 
    as: 'persona' });
  sedePersonaRolModel.belongsTo(models.sedeModel, { 
    foreignKey: 'se_id', 
    as: 'sede' });
  sedePersonaRolModel.belongsTo(models.rolModel, { 
    foreignKey: 'rol_id', 
    as: 'rol' });
};





