const { Op } = require('sequelize');
const { sequelize } = require('../config/mysql'); 
const { matchedData } = require('express-validator');
const { subirImagenACloudinary } = require('../utils/handleCloudinary'); 
const cloudinary = require('../config/cloudinary'); 
const moment = require("moment-timezone");
const { pacienteModel, seguimientoModel, sedePersonaRolModel, enfermeraModel, personaModel } = require('../models');






// se puede registrar varios seguimientos por paciente (enfermera)
const registrarSeguimientoPaciente = async (req, res) => {
    const transaction = await sequelize.transaction(); 
    try {
        const { pac_id } = req.params;
        const per_id_enfermera = req.session.per_id;
        const se_id_sesion = req.session.se_id;
        const data = matchedData(req);

        if (!pac_id) {
            return res.status(400).json({ message: "Se requiere el ID del paciente." });
        }

        if (!se_id_sesion) {
            return res.status(403).json({ message: "No tienes una sede asignada en la sesión." });
        }

        // Obtener ID de la enfermera desde la persona en sesión
        const enfermera = await enfermeraModel.findOne({ where: { per_id: per_id_enfermera } });
        if (!enfermera) {
            return res.status(403).json({ message: "No eres una enfermera registrada." });
        }
        const enf_id = enfermera.enf_id;

        // Verificar si el paciente existe
        const paciente = await pacienteModel.findOne({ where: { pac_id } });
        if (!paciente) {
            return res.status(404).json({ message: "Paciente no encontrado." });
        }

        const per_id_paciente = paciente.per_id;

        // Verificar si la persona tiene rol de paciente en la sede y si está activo
        const rolesPaciente = await sedePersonaRolModel.findAll({
            where: { se_id: se_id_sesion, per_id: per_id_paciente, rol_id: 4 },
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
                message: "El usuario tiene el rol de paciente en esta sede, pero está inactivo.",
            });
        }

        // 🔹 Convertir la fecha actual a la hora de Bogotá antes de guardarla
        const fechaColombia = moment().tz("America/Bogota").format("YYYY-MM-DD HH:mm:ss");

        // 🔹 Crear un nuevo seguimiento 
        const nuevoSeguimiento = await seguimientoModel.create(
            { pac_id, enf_id, seg_fecha: fechaColombia, ...data  },
            { transaction }
        );

        // 🔹 Subir la foto si está presente en la solicitud (opcional)
        if (req.file) {
            try {
                const resultado = await subirImagenACloudinary(req.file, "seguimientos_Paciente");
                await nuevoSeguimiento.update({ seg_foto: resultado.secure_url }, { transaction });
            } catch (error) {
                console.error("Error al subir la imagen:", error);
                await transaction.rollback(); // 🔹 Deshacer todo si la imagen falla
                return res.status(500).json({ message: "Error al subir la imagen" });
            }
        }

        await transaction.commit(); // 🔹 Confirmar transacción

        return res.status(201).json({
            message: "Seguimiento registrado con éxito.",
            datos: nuevoSeguimiento,
        });

    } catch (error) {
        await transaction.rollback(); // 🔹 Deshacer cualquier cambio en caso de error
        console.error("Error al registrar seguimiento:", error);
        return res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
        });
    }
};



// ver historial de seguimientos de un paciente, ordenados por fecha
const obtenerHistorialSeguimientos = async (req, res) => {
    try {
        const { pac_id } = req.params;

        if (!pac_id) {
            return res.status(400).json({ message: "Se requiere el ID del paciente." });
        }

        // Verificar si el paciente existe y traer solo los datos necesarios
        const paciente = await pacienteModel.findOne({
            where: { pac_id },
            include: [
                {
                    model: personaModel,
                    as: "persona",
                    attributes: ["per_id", "per_documento", "per_nombre_completo"],
                },
            ],
        });

        if (!paciente) {
            return res.status(404).json({ message: "Paciente no encontrado." });
        }

        // Consultar los seguimientos del paciente
        const seguimientos = await seguimientoModel.findAll({
            where: { pac_id },
            include: [
                {
                    model: enfermeraModel,
                    as: "enfermera",
                    attributes: ["enf_id"],
                    include: [
                        {
                            model: personaModel,
                            as: "persona",
                            attributes: ["per_id", "per_documento", "per_nombre_completo"],
                        },
                    ],
                },
            ],
            order: [["seg_fecha", "DESC"]],
        });

        if (seguimientos.length === 0) {
            return res.status(404).json({ message: "No hay seguimientos para este paciente." });
        }

        // Agrupar seguimientos por fecha (sin considerar la hora)
        const historialAgrupado = seguimientos.reduce((acc, seguimiento) => {
            const fecha = seguimiento.seg_fecha.split(" ")[0]; // Tomamos solo la parte de la fecha

            if (!acc[fecha]) {
                acc[fecha] = {
                    fecha,
                    seguimientos: [],
                };
            }

            acc[fecha].seguimientos.push(seguimiento);
            return acc;
        }, {});

        return res.status(200).json({
            message: "Historial de seguimientos obtenido con éxito.",
            paciente: paciente.persona, // Solo enviamos los datos de la persona del paciente
            historial_seguimientos: Object.values(historialAgrupado), // Convertimos el objeto en un array
        });
    } catch (error) {
        console.error("Error al obtener historial de seguimientos:", error);
        return res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
        });
    }
};



// traer el seguimiento por su seg_id para ser actualizado
const obtenerSeguimientoPorId = async (req, res) => {
    try {
        const { seg_id } = req.params;

        if (!seg_id) {
            return res.status(400).json({ message: "Se requiere el ID del seguimiento." });
        }

        const seguimiento = await seguimientoModel.findOne({
            where: { seg_id },
            include: [
                {
                    model: enfermeraModel,
                    as: "enfermera",
                    attributes: ["enf_id"],
                    include: [
                        {
                            model: personaModel,
                            as: "persona",
                            attributes: ["per_id", "per_documento", "per_nombre_completo"],
                        },
                    ],
                },
            ],
        });

        if (!seguimiento) {
            return res.status(404).json({ message: "Seguimiento no encontrado." });
        }

        return res.status(200).json({
            message: "Seguimiento obtenido con éxito.",
            seguimiento, // 🔹 Enviamos todos los datos, incluyendo null
        });

    } catch (error) {
        console.error("Error al obtener seguimiento:", error);
        return res.status(500).json({
            message: "Error interno del servidor.",
            error: error.message,
        });
    }
};



// solo deja actualizar seguimientos del mismo dia, no se puede actualizar fecha.. ni un seguimiento de otra enfermera 
const actualizarSeguimientoPaciente = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { seg_id } = req.params; // ID del seguimiento a actualizar
        const per_id_enfermera = req.session.per_id; // ID de persona en sesión
        const data = matchedData(req); // Filtrar datos válidos de la petición

        if (!seg_id) {
            return res.status(400).json({ message: "Se requiere el ID del seguimiento." });
        }

        // Obtener la enfermera en sesión
        const enfermera = await enfermeraModel.findOne({ where: { per_id: per_id_enfermera } });
        if (!enfermera) {
            return res.status(403).json({ message: "No eres una enfermera registrada." });
        }

        const enf_id = enfermera.enf_id; // ID de la enfermera en sesión

        // Buscar el seguimiento
        const seguimiento = await seguimientoModel.findOne({ where: { seg_id } });

        if (!seguimiento) {
            return res.status(404).json({ message: "Seguimiento no encontrado." });
        }

        // Verificar si la enfermera en sesión es la misma que registró el seguimiento
        if (seguimiento.enf_id !== enf_id) {
            return res.status(403).json({ message: "No puedes actualizar un seguimiento de otra enfermera." });
        }

         // 🔹 Convertir la fecha actual y la del seguimiento a la zona horaria de Bogotá
        const fechaHoy = moment().tz("America/Bogota").startOf("day");
        const fechaSeguimiento = moment(seguimiento.seg_fecha).tz("America/Bogota").startOf("day");

        // 🔹 Comprobar si la fecha del seguimiento es la de hoy
        if (!fechaSeguimiento.isSame(fechaHoy, "day")) {
            return res.status(403).json({
                message: "Solo puedes actualizar seguimientos creados hoy.",
            });
        }

        
        // Manejar la actualización de la imagen
        if (req.file) {
            const oldFoto = seguimiento.seg_foto;
            const publicId = oldFoto 
                ? oldFoto.split("/").slice(-1)[0].split(".")[0]
                : null;


            try {
                // Subir la nueva imagen
                const result = await subirImagenACloudinary(req.file, "seguimientos_Paciente");
                data.seg_foto = result.secure_url;

                // Eliminar la imagen anterior si existe
                if (publicId) {
                    await cloudinary.uploader.destroy(`seguimientos_Paciente/${publicId}`);
                }




            } catch (error) {
                console.error("Error al subir la imagen:", error);
                
                // Si la imagen ya se subió pero ocurre un error, eliminarla
                if (data.seg_foto) {
                    try {
                        const publicIdNueva = data.seg_foto.split("/").slice(-1)[0].split(".")[0];
                        await cloudinary.uploader.destroy(`seguimientos_Paciente/${publicIdNueva}`);
                    } catch (deleteError) {
                        console.error("Error al eliminar la imagen subida:", deleteError);
                    }
                }

                await transaction.rollback();
                return res.status(500).json({ message: "Error al actualizar la imagen." });
            }
        }

        // Actualizar el seguimiento con los nuevos datos
        await seguimiento.update(data, { transaction });
        await transaction.commit();

        return res.status(200).json({
            message: "Seguimiento actualizado con éxito.",
            datos: seguimiento,
        });

    } catch (error) {
        await transaction.rollback();
        console.error("Error al actualizar seguimiento:", error);
        return res.status(500).json({ message: "Error interno del servidor.", error: error.message });
    }
};





module.exports = {registrarSeguimientoPaciente, obtenerHistorialSeguimientos, obtenerSeguimientoPorId, actualizarSeguimientoPaciente};
