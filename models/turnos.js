const { sequelize } = require("../config/mysql");
const { DataTypes } = require("sequelize");

const turnoModel = sequelize.define(
  "Turnos",
  {
    tur_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    enf_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "enfermeras", // Nombre de la tabla en la BD
        key: "enf_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    se_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "sedes", // Nombre de la tabla en la BD
        key: "se_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    tur_fecha_inicio: { 
        type: DataTypes.DATEONLY, 
        allowNull: false 
    },

    tur_fecha_fin: { 
        type: DataTypes.DATEONLY, 
        allowNull: false 
    },
    
/*     tur_hora_inicio: { 
        type: DataTypes.TIME, 
        allowNull: false 

    },

    tur_hora_fin: { 
        type: DataTypes.TIME, 
        allowNull: false 
    }, */


    
    tur_hora_inicio: { 
        type: DataTypes.TIME, 
        allowNull: false,
        set(value) { 
            this.setDataValue('tur_hora_inicio', convertTo24HourFormat(value)); 
        },
        get() { 
            return convertTo12HourFormat(this.getDataValue('tur_hora_inicio')); 
        }
    },
    tur_hora_fin: { 
        type: DataTypes.TIME, 
        allowNull: false,
        set(value) { 
            this.setDataValue('tur_hora_fin', convertTo24HourFormat(value)); 
        },
        get() { 
            return convertTo12HourFormat(this.getDataValue('tur_hora_fin')); 
        }
    },
    
/*     tur_total_horas: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
    },
 */    


  tur_total_horas: { 
    type: DataTypes.DECIMAL(5,2), // Permite guardar con decimales si se requiere
    allowNull: false,
    set(value) { 
      this.setDataValue('tur_total_horas', Math.round(value)); // Redondear antes de guardar
    },
    get() {
      const value = this.getDataValue('tur_total_horas');
      return value % 1 === 0 ? parseInt(value) : parseFloat(value); 
    }
  },
  
  

    tur_tipo_turno: {
      type: DataTypes.ENUM("Diurno", "Nocturno"),
      allowNull: false,
    },
    
  },
  {
    tableName: "turnos",
    timestamps: false,
  }
);


module.exports = turnoModel;


// Relaciones
turnoModel.associate = (models) => {
  // Un turno pertenece a una enfermera
  turnoModel.belongsTo(models.enfermeraModel, {
    foreignKey: "enf_id",
    as: "enfermera",
  });

  // Un turno pertenece a una sede
  turnoModel.belongsTo(models.sedeModel, {
    foreignKey: "se_id",
    as: "sede",
  });
};


// 🔹 Convierte de "HH:MM AM/PM" ➝ "HH:MM:SS" en 24H para MySQL
function convertTo24HourFormat(time12h) {
    const [time, modifier] = time12h.split(' ');  // Separa hora:minuto y AM/PM
    let [hours, minutes] = time.split(':');

    if (modifier === 'PM' && hours !== '12') {
        hours = String(parseInt(hours, 10) + 12);
    } else if (modifier === 'AM' && hours === '12') {
        hours = '00';
    }

    return `${hours}:${minutes}:00`; // Formato MySQL TIME
}

// 🔹 Convierte de "HH:MM:SS" en 24H ➝ "HH:MM AM/PM" para mostrar al usuario
function convertTo12HourFormat(time24h) {
    if (!time24h) return null;  // Evita errores si el valor es null
    const [hours, minutes] = time24h.split(':');
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;

    return `${formattedHours}:${minutes} ${period}`;
}


