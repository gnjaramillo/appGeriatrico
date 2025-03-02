// models/index.js

const { sequelize } = require('../config/mysql');

const models = {
    geriatricoModel: require('./geriatricos'),
    sedeModel: require('./sedes'),
    personaModel: require('./personas'),
    rolModel: require('./roles'),
    sedePersonaRolModel: require('./sedepersonarol'),
    geriatricoPersonaRolModel: require('./geriatricopersonarol'),
    geriatricoPersonaModel: require('./geriatricopersona'),
    pacienteModel: require('./pacientes'),
    enfermeraModel: require('./enfermeras'),
    turnoModel: require('./turnos'),
    cuidadoEnfermeriaModel: require('./cuidadosEnfermeria'),
    seguimientoModel: require('./seguimientos'),
    acudienteModel: require('./acudientes'),
    diagnosticoModel: require('./diagnosticos'),
    recomendacionModel: require('./recomendaciones')
};

// Ejecutar asociaciones automáticamente
Object.values(models).forEach((model) => {
    if (model.associate) {
        model.associate(models);
    }
});

module.exports = models;
