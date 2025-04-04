const { sequelize } = require('../config/mysql'); 
const { DataTypes } = require('sequelize'); 




const enfermeraModel = sequelize.define('Enfermeras', {
    enf_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    per_id: {  
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
            model: 'personas', // Nombre de la tabla en la BD
            key: 'per_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    enf_codigo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
}, 
{ tableName: 'enfermeras', timestamps: false });



module.exports = enfermeraModel;


// cada enfermera pertenece a una persona
enfermeraModel.associate = (models) => {

    enfermeraModel.belongsTo(models.personaModel, { 
        foreignKey: 'per_id',
        as: 'persona' 
    });  
   

//Cada enfermera puede tener varios turnos asignados.
    enfermeraModel.hasMany(models.turnoModel, { 
    foreignKey: 'enf_id', 
    as: 'turnos' 
});


//Una enfermera puede realizar varios seguimientos
    enfermeraModel.hasMany(models.seguimientoModel, { 
    foreignKey: 'enf_id', 
    as: 'seguimientos' 
});


};


