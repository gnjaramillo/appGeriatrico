// models/index.js

const { sequelize } = require('../config/mysql');

const models = {
    geriatricoModel: require('./geriatricos'),
    sedeModel: require('./sedes'),
    personaModel: require('./personas'),
    rolModel: require('./roles'),
    sedePersonaRolModel: require('./sedepersonarol'),
    geriatricoPersonaRolModel: require('./geriatricopersonarol'),
    geriatricoPersonaModel: require('./geriatricoPersona'),
    pacienteModel: require('./pacientes'),
    enfermeraModel: require('./enfermeras'),
    turnoModel: require('./turnos'),
    cuidadoEnfermeriaModel: require('./cuidadosEnfermeria'),
    seguimientoModel: require('./seguimientos'),
    pacienteAcudienteModel: require('./acudientes'),
    diagnosticoModel: require('./diagnosticos'),
    recomendacionModel: require('./recomendaciones'),
    medicamentosModel: require('./medicamentos'),
    inventarioMedicamentosSedeModel: require('./inventariomedicamentosede'),
    inventarioMedicamentosPacienteModel: require('./inventariomedicamentospaciente'),
    formulacionMedicamentosModel: require('./formulacionmedicamento'),
    detalleAdministracionMedicamentoModel: require('./detalleadministracionmedicamento'),
    movimientosStockSedeModel: require('./movimientostocksede'),
    movimientosStockPacienteModel: require('./movimientostockpaciente'),
};

// Ejecutar asociaciones automáticamente
Object.values(models).forEach((model) => {
    if (model.associate) {
        model.associate(models);
    }
});

module.exports = models;


    // vinculacionMedicamentoSedeModel: require('./medicamentosede'),
    // vinculacionMedicamentoPacienteModel: require('./medicamentopaciente'),
