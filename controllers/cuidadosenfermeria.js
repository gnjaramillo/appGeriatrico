
const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 

const { matchedData } = require('express-validator');
const { pacienteModel, cuidadoEnfermeriaModel, sedePersonaRolModel } = require('../models');





/* 
// registrar cuidados de enfermeria
const registrarCuidadosEnfermeria = async (req, res) => {
    try {
        const { pac_id } = req.params; // Obtener pac_id desde la URL
        const data = matchedData(req);
        const { ...datosCuidados } = data;
        const se_id_sesion = req.session.se_id; 

        if (!pac_id) {
            return res.status(400).json({ message: "Se requiere el ID del paciente." });
        }

        if (!se_id_sesion) {
            return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
        }



        const paciente = await pacienteModel.findOne({where: { pac_id}})

        if (!paciente){
            return res.status(404).json({message: "paciente no encontrado"})
        }

        const per_id = paciente.per_id



              // Obtener TODOS los roles paciente de la persona en la sede
        const rolesPaciente = await sedePersonaRolModel.findAll({
          where: { se_id: se_id_sesion , per_id, rol_id: 4 },
          attributes: ["sp_activo"],
        });

      // Si no tiene ningún rol "Paciente" en esta sede
        if (rolesPaciente.length === 0) {
            return res.status(404).json({
                message: "La persona no tiene un rol de paciente en esta sede.",
            });
        }



      // Verificar si hay al menos un `sp_activo === true`
      const tieneRolActivo = rolesPaciente.some((rol) => rol.sp_activo === true);

      if (!tieneRolActivo) {
        return res.status(403).json({
            message: "El paciente pertenece a tu sede, pero no tiene un rol activo.",
        });
      }

      

     

        // Registrar los cuidados de enfermería
        const nuevoCuidado = await cuidadoEnfermeriaModel.create({
            pac_id,
            ...datosCuidados,
        });

        return res.status(201).json({
            message: "Cuidados de enfermería registrados con éxito.",
            datos: nuevoCuidado,
        });
    } catch (error) {
        console.error("Error al registrar cuidados de enfermería:", error);
        return res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
        });
    }
};
 */



const registrarCuidadosEnfermeria = async (req, res) => {
    try {
        const { pac_id } = req.params; // Obtener pac_id desde la URL
        const data = matchedData(req);
        const { ...datosCuidados } = data;
        const se_id_sesion = req.session.se_id; 

        if (!pac_id) {
            return res.status(400).json({ message: "Se requiere el ID del paciente." });
        }

        if (!se_id_sesion) {
            return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
        }

        const paciente = await pacienteModel.findOne({ where: { pac_id } });

        if (!paciente) {
            return res.status(404).json({ message: "Paciente no encontrado." });
        }

        const per_id = paciente.per_id;

        // Obtener todos los roles de paciente de la persona en la sede
        const rolesPaciente = await sedePersonaRolModel.findAll({
            where: { se_id: se_id_sesion, per_id, rol_id: 4 },
            attributes: ["sp_activo"],
        });

        if (rolesPaciente.length === 0) {
            return res.status(404).json({
                message: "La persona no tiene un rol de paciente en esta sede.",
            });
        }

        const tieneRolActivo = rolesPaciente.some((rol) => rol.sp_activo === true);

        if (!tieneRolActivo) {
            return res.status(403).json({
                message: "El paciente pertenece a tu sede, pero no tiene un rol activo.",
            });
        }

        // Verificar si ya existen cuidados registrados para el paciente
        const cuidadosExistentes = await cuidadoEnfermeriaModel.findOne({ where: { pac_id } });

        if (cuidadosExistentes) {
            // Si existen, actualizarlos
            await cuidadoEnfermeriaModel.update(datosCuidados, { where: { pac_id } });

            return res.status(200).json({
                message: "Cuidados de enfermería actualizados con éxito.",
                datos: { pac_id, ...datosCuidados },
            });
        } else {
            // Si no existen, crearlos
            const nuevoCuidado = await cuidadoEnfermeriaModel.create({
                pac_id,
                ...datosCuidados,
            });

            return res.status(201).json({
                message: "Cuidados de enfermería registrados con éxito.",
                datos: nuevoCuidado,
            });
        }
    } catch (error) {
        console.error("Error al registrar cuidados de enfermería:", error);
        return res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
        });
    }
};







module.exports = {registrarCuidadosEnfermeria };
