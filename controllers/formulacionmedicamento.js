const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 
const { getIo } = require('../utils/handleSocket'); 
const moment = require('moment-timezone');
const { matchedData } = require('express-validator');
const {  formulacionMedicamentosModel, sedePersonaRolModel, pacienteModel, inventarioMedicamentosPacienteModel, inventarioMedicamentosSedeModel  } = require('../models');





// registrar formula medica para paciente (enfermera, admin sede)
/* const registrarFormulacion = async (req, res) => {
    try {
        const { pac_id } = req.params;
        const se_id_sesion = req.session.se_id;

        const data = matchedData(req);
        const { 
            admin_fecha_inicio, 
            admin_fecha_fin, 
            admin_cantidad_total, 
            admin_cantidad_dosis, 
            admin_presentacion, 
            admin_hora, 
            admin_metodo 
        } = data;

            const paciente = await pacienteModel.findOne({ where: { pac_id } });

            if (!paciente) {
                return res.status(404).json({ message: "Paciente no encontrado." });
            }
    
            const per_id = paciente.per_id;
    
            // Verificar si la persona tiene rol de paciente en la sede
            const rolesPaciente = await sedePersonaRolModel.findAll({
                where: { se_id: se_id_sesion, per_id, rol_id: 4 },
                attributes: ["sp_activo"],
            });
    
            if (rolesPaciente.length === 0) {
                return res.status(404).json({ message: "La persona no tiene un rol de paciente en esta sede." });
            }
    
            const tieneRolActivo = rolesPaciente.some((rol) => rol.sp_activo === true);
    
            if (!tieneRolActivo) {
                return res.status(403).json({ message: "El usuario tiene el rol de paciente en esta sede, pero está inactivo." });
            }
    

        

        // Crear la formulación médica
        const nuevaFormulacion = await administracionMedicamentosModel.create({
            pac_id,
            admin_fecha_inicio,
            admin_fecha_fin,
            admin_cantidad_total,
            admin_cantidad_dosis,
            admin_presentacion,
            admin_hora,
            admin_metodo,
            admin_estado: "Pendiente" // Estado inicial
        });

        return res.status(201).json({ message: "Formulación registrada exitosamente", formulacion: nuevaFormulacion });
    } catch (error) {
        console.error("Error al registrar la formulación médica:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
}; */



const registrarFormulacion = async (req, res) => {
    try {
        const { pac_id } = req.params;
        const se_id_sesion = req.session.se_id;

        const data = matchedData(req);
        const { 
            admin_fecha_inicio, 
            admin_fecha_fin, 
            admin_cantidad_total, 
            admin_cantidad_dosis, 
            admin_presentacion, 
            admin_hora, 
            admin_metodo, 
            inv_med_sede_id,  // Medicamento de la sede (puede ser NULL si es del paciente)
            inv_med_pac_id    // Medicamento del paciente (puede ser NULL si es de la sede)
        } = data;

        const paciente = await pacienteModel.findOne({ where: { pac_id } });

        if (!paciente) {
            return res.status(404).json({ message: "Paciente no encontrado." });
        }

        const per_id = paciente.per_id;

        // Verificar si la persona tiene rol de paciente en la sede
        const rolesPaciente = await sedePersonaRolModel.findAll({
            where: { se_id: se_id_sesion, per_id, rol_id: 4 },
            attributes: ["sp_activo"],
        });

        if (rolesPaciente.length === 0) {
            return res.status(404).json({ message: "La persona no tiene un rol de paciente en esta sede." });
        }

        const tieneRolActivo = rolesPaciente.some((rol) => rol.sp_activo === true);

        if (!tieneRolActivo) {
            return res.status(403).json({ message: "El usuario tiene el rol de paciente en esta sede, pero está inactivo." });
        }

        // Verificar que se esté proporcionando al menos un inventario de medicamento
        if (!inv_med_sede_id && !inv_med_pac_id) {
            return res.status(400).json({ message: "Debe especificarse un medicamento, ya sea de la sede o del paciente." });
        }

        // Si el medicamento es de la sede, verificar que se indique inv_med_sede_id
        if (inv_med_sede_id && inv_med_pac_id) {
            return res.status(400).json({ message: "No se puede asignar un medicamento tanto de la sede como del paciente." });
        }

        // Si el medicamento proviene de la sede, verificar si el medicamento existe en el inventario
        if (inv_med_sede_id) {
            const medicamentoSede = await inventarioMedicamentosSedeModel.findOne({ where: { med_sede_id: inv_med_sede_id } });
            if (!medicamentoSede) {
                return res.status(404).json({ message: "Medicamento de la sede no encontrado en el inventario." });
            }
        }

        // Si el medicamento proviene del paciente, verificar si el medicamento existe en el inventario del paciente
        if (inv_med_pac_id) {
            const medicamentoPaciente = await inventarioMedicamentosPacienteModel.findOne({ where: { med_pac_id: inv_med_pac_id } });
            if (!medicamentoPaciente) {
                return res.status(404).json({ message: "Medicamento del paciente no encontrado en el inventario." });
            }
        }

        // Crear la formulación médica con los datos del medicamento
        const nuevaFormulacion = await formulacionMedicamentosModel.create({
            pac_id,
            inv_med_sede_id,
            inv_med_pac_id,
            admin_fecha_inicio,
            admin_fecha_fin,
            admin_cantidad_total,
            admin_cantidad_dosis,
            admin_presentacion,
            admin_hora,
            admin_metodo,
            admin_estado: "Pendiente" // Estado inicial
        });

        return res.status(201).json({ message: "Formulación registrada exitosamente", formulacion: nuevaFormulacion });
    } catch (error) {
        console.error("Error al registrar la formulación médica:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
};


module.exports = { registrarFormulacion };
