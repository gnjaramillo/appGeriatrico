const { registrarPaciente } = require('../controllers/pacientes');
const { registrarEnfermera } = require('../controllers/enfermeras');
const { registrarAcudiente } = require('../controllers/acudientes');

const registroDatosSegunRol = async (per_id, rol_id) => {
    console.log(`Asignando datos adicionales para per_id: ${per_id}, rol_id: ${rol_id}`);
    let mensajeAdicional = '';

    if (rol_id === 4) { // Paciente
        await registrarPaciente(per_id);
        mensajeAdicional = 'Has asignado el rol Paciente. Registra los datos adicionales de la enfermera.';
    } else if (rol_id === 5) { // Enfermera(o)
        await registrarEnfermera(per_id);
        mensajeAdicional = 'Has asignado el rol Enfermera(o). Registra los datos adicionales del paciente.';
    } else if (rol_id === 6) { // Acudiente
        await registrarAcudiente(per_id);
        mensajeAdicional = 'Has asignado el rol de Acudiente. Registra los datos adicionales del acudiente.';
    }

    return mensajeAdicional;  // Devolvemos el mensaje que debe mostrarse
};

module.exports = { registroDatosSegunRol };
