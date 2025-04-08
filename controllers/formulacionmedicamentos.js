const { Op } = require('sequelize');
const { Sequelize } = require("sequelize");

const { sequelize } = require('../config/mysql'); 
const { io } = require('../utils/handleSocket'); 
const moment = require('moment-timezone');
const { matchedData } = require('express-validator');
const { formulacionMedicamentosModel, personaModel,sedePersonaRolModel, medicamentosModel, pacienteModel } = require('../models');




const registrarFormulacionMedicamento = async (req, res) => {
    try {
      const { pac_id } = req.params;
      const se_id = req.session.se_id;
      const data = matchedData(req);
      const {
        med_id,
        admin_fecha_inicio,
        admin_fecha_fin,
        admin_dosis_por_toma,
        admin_tipo_cantidad,
        admin_hora,
        admin_metodo,

        
      } = data;
      // Validación básica

      
      // Verificar existencia del paciente   
      const paciente = await pacienteModel.findOne({ where: { pac_id } });
      if (!paciente) {
          return res.status(404).json({ message: "Paciente no encontrado." });
      }

      const per_id = paciente.per_id;

      // Verificar si la persona tiene rol de paciente en la sede
      const rolesPaciente = await sedePersonaRolModel.findAll({
          where: { se_id, per_id, rol_id: 4 },
          attributes: ["sp_activo"],
      });

      if (rolesPaciente.length === 0) {
          return res.status(404).json({ message: "La persona no tiene un rol de paciente en esta sede." });
      }

      const tieneRolActivo = rolesPaciente.some((rol) => rol.sp_activo === true);

      if (!tieneRolActivo) {
          return res.status(403).json({ message: "El usuario tiene el rol de paciente en esta sede, pero está inactivo." });
      }


      if (!med_id || !admin_fecha_inicio || !admin_fecha_fin || !admin_dosis_por_toma || !admin_tipo_cantidad || !admin_hora || !admin_metodo) {
        return res.status(400).json({ message: "Faltan datos obligatorios en la formulación." });
      }
  
   

  
      const nuevaFormulacion = await formulacionMedicamentosModel.create({
        pac_id,
        med_id,
        admin_fecha_inicio,
        admin_fecha_fin,
        admin_dosis_por_toma,
        admin_tipo_cantidad,
        admin_hora,
        admin_metodo,
        admin_estado: "Pendiente"
      
      });

  

  
      return res.status(201).json({
        message: "Formulación médica registrada exitosamente.",
        formulacion: nuevaFormulacion
      });
  
    } catch (error) {
      console.error("Error al registrar formulación médica:", error);
      return res.status(500).json({
        message: "Error interno al registrar la formulación.",
      });
    }
};


  


// formulas vigentes
const formulacionMedicamentoVigente = async (req, res) => {
    try {
      const { pac_id } = req.params;
  
      // Fecha de hoy en zona horaria Colombia
      const hoy = moment().tz("America/Bogota").startOf("day").format("YYYY-MM-DD");

      
      const formulacionVigente = await formulacionMedicamentosModel.findAll({
        where: {
          pac_id,
          admin_estado: 'Pendiente',
          admin_fecha_fin: {
            [Op.gte]: hoy, // 👉 Fecha fin mayor o igual que hoy
          },
        },
        include: [
          {
            model: medicamentosModel,
            as: "medicamentos_formulados",
            attributes: ["med_nombre", "med_presentacion"],
          },
          {
            model: pacienteModel,
            as: "paciente",
            attributes: [], // No traemos nada de paciente
            include: [
              {
                model: personaModel,
                as: "persona",
                attributes: ["per_nombre_completo", "per_documento"],
              }
            ]
          }
        ],
        order: [
          ["admin_fecha_inicio", "DESC"],
          ["admin_hora", "DESC"]
        ]
      });
  
      return res.status(200).json({
        message: "Formulaciones vigentes obtenidas exitosamente.",
        formulacion: formulacionVigente
      });
  
    } catch (error) {
      console.error("Error al obtener historial de formulaciones:", error);
      return res.status(500).json({
        message: "Error interno al obtener el historial de formulaciones.",
      });
    }
};
  




const formulacionMedicamentoHistorial = async (req, res) => {
  try {
    const { pac_id } = req.params;

    // Fecha de hoy en zona horaria Colombia
    const hoy = moment().tz("America/Bogota").startOf("day").format("YYYY-MM-DD");


    const historialformulacion = await formulacionMedicamentosModel.findAll({
      where: {
        pac_id,
        // admin_estado: 'Pendiente',

        admin_fecha_fin: { [Op.lt]: hoy } // ✅  finalizaron hasta ayer
      },
      include: [
        {
          model: medicamentosModel,
          as: "medicamentos_formulados",
          attributes: ["med_nombre", "med_presentacion"],
        },
        {
          model: pacienteModel,
          as: "paciente",
          attributes: [],
          include: [
            {
              model: personaModel,
              as: "persona",
              attributes: ["per_nombre_completo", "per_documento"],
            }
          ]
        }
      ],
      order: [
        ["admin_fecha_inicio", "DESC"],
        ["admin_hora", "DESC"]
      ]
    });

    return res.status(200).json({
      message: "Historial de formulaciones obtenido exitosamente.",
      formulacion: historialformulacion
    });

  } catch (error) {
    console.error("Error al obtener historial de formulaciones:", error);
    return res.status(500).json({
      message: "Error interno al obtener el historial de formulaciones.",
    });
  }
};




const formulacionMedicamentoSuspendidas = async (req, res) => {
  try {
    const { pac_id } = req.params;

    const formulacionesSuspendidas = await formulacionMedicamentosModel.findAll({
      where: {
        pac_id,
        admin_estado: 'Suspendido',
      },
      include: [
        {
          model: medicamentosModel,
          as: "medicamentos_formulados",
          attributes: ["med_nombre", "med_presentacion"],
        },
        {
          model: pacienteModel,
          as: "paciente",
          attributes: [],
          include: [
            {
              model: personaModel,
              as: "persona",
              attributes: ["per_nombre_completo", "per_documento"],
            }
          ]
        }
      ],
      order: [
        ["admin_fecha_inicio", "DESC"],
        ["admin_hora", "DESC"]
      ]
    });

    return res.status(200).json({
      message: "Formulaciones suspendidas obtenidas exitosamente.",
      formulacion: formulacionesSuspendidas
    });

  } catch (error) {
    console.error("Error al obtener formulaciones suspendidas:", error);
    return res.status(500).json({
      message: "Error interno al obtener formulaciones suspendidas.",
    });
  }
};



  module.exports = { 
    registrarFormulacionMedicamento, 
    formulacionMedicamentoVigente,
    formulacionMedicamentoHistorial,
    formulacionMedicamentoSuspendidas
};


  