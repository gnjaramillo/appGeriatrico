const { sequelize } = require('../config/mysql'); 
const { DataTypes } = require('sequelize'); 

const personaModel = sequelize.define('Personas', {
    per_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    per_fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    per_foto: { type: DataTypes.STRING },
    per_documento: { type: DataTypes.STRING, allowNull: false, unique: true },
    per_nombre_completo: { 
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
            this.setDataValue('per_nombre_completo', capitalizeWords(value));
        },
    },
    per_telefono: {type: DataTypes.STRING, allowNull: false},
    per_genero: { type: DataTypes.ENUM('M', 'F', 'O'), allowNull: false },
    per_usuario: { type: DataTypes.STRING, allowNull: false, unique: true },
    per_password: { type: DataTypes.STRING, allowNull: false },  
    per_correo: { type: DataTypes.STRING, allowNull: false, unique: true },    
}, 


{ 
    
    tableName: 'personas', 
    timestamps: false
   
});


// Relaciones
personaModel.associate = (models) => {
    // Persona tiene muchos roles a través de SedePersonaRol
    personaModel.belongsToMany(models.rolModel, {
        through: models.sedePersonaRolModel,
        foreignKey: 'per_id',
        as: 'rolesEnSedes'
    });

    // Persona puede estar en varias sedes a través de SedePersonaRol
    personaModel.belongsToMany(models.sedeModel, {
        through: models.sedePersonaRolModel,
        foreignKey: 'per_id',
        as: 'sede'
    });

    // Persona puede tener varios roles a través de GeriatricoPersonaRol
    personaModel.belongsToMany(models.rolModel, {
        through: models.geriatricoPersonaRolModel,
        foreignKey: 'per_id',
        as: 'rolesEnGeriátricos'
    });

    
    // Persona puede estar en varios geriatricos a través de GeriatricoPersonaRol
    personaModel.belongsToMany(models.geriatricoModel, {
        through: models.geriatricoPersonaRolModel,
        foreignKey: 'per_id',
        as: 'geriatrico'
    });

    // una persona puede tener un único paciente asociado.
    personaModel.hasOne(models.pacienteModel, { 
        foreignKey: 'per_id', 
        as: 'paciente' 
    });


    // una persona puede tener una enfermera asociada.
    personaModel.hasOne(models.enfermeraModel, { 
        foreignKey: 'per_id', 
        as: 'enfermera' 
    });


    // una persona puede tener un acudiente asociado.
    personaModel.hasOne(models.acudienteModel, { 
        foreignKey: 'per_id', 
        as: 'acuediente' 
    }); 

};


// Exportar el modelo
module.exports = personaModel;