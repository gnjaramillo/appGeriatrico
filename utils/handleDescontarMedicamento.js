
const { Op } = require("sequelize");
const {
    medicamentosModel,
    formulacionMedicamentosModel,
    inventarioMedicamentosSedeModel,
    inventarioMedicamentosPacienteModel,
    movimientosStockSedeModel,
    movimientosStockPacienteModel,
} = require("../models");

// Presentaciones que solo se descuentan una vez por tratamiento
const PRESENTACIONES_UNICAS = ['frasco', 'crema', 'spray', 'gotas'];


async function descontarStockPorAdministracion({
    med_id,
    admin_id, 
    usuarioId,
    inventarioOrigen, // 'sede' o 'paciente'
    inventarioId,
    se_id = null,
    pac_id = null,
    numeroDosis,
    transaction, // 🔑 PASAMOS LA TRANSACCIÓN
}) {
    try {
        const medicamento = await medicamentosModel.findByPk(med_id, { transaction });
        if (!medicamento) throw new Error("Medicamento no encontrado");

        const presentacion = medicamento.med_presentacion?.toLowerCase();
        const esDescuentoUnico = PRESENTACIONES_UNICAS.includes(presentacion);

        const formulacion = await formulacionMedicamentosModel.findByPk(admin_id, { transaction });
        if (!formulacion) throw new Error("Formulación no encontrada");

        const dosisPorToma = parseFloat(formulacion.admin_dosis_por_toma || 1);
        let cantidadADescontar = esDescuentoUnico
            ? (numeroDosis > 1 ? 0 : 1)
            : dosisPorToma;

        if (cantidadADescontar === 0) {
            return { skipDescuento: true, mensaje: 'Descuento omitido por presentación única' };
        }

        let inventario, stockDisponible;

        if (inventarioOrigen === 'sede') {
            inventario = await inventarioMedicamentosSedeModel.findByPk(inventarioId, { transaction });
            if (!inventario) throw new Error("Inventario de sede no encontrado");

            stockDisponible = inventario.med_total_unidades_disponibles;
            if (stockDisponible < cantidadADescontar) throw new Error("Stock insuficiente en sede");

            inventario.med_total_unidades_disponibles -= cantidadADescontar;
            await inventario.save({ transaction });

            await movimientosStockSedeModel.create({
                med_sede_id: inventarioId,
                se_id,
                med_id,
                usuario_id: usuarioId,
                cantidad: cantidadADescontar,
                tipo: 'Salida',
                med_origen: null,
                med_destino: 'Administración Paciente',
            }, { transaction });

        } else if (inventarioOrigen === 'paciente') {
            inventario = await inventarioMedicamentosPacienteModel.findByPk(inventarioId, { transaction });
            if (!inventario) throw new Error("Inventario de paciente no encontrado");

            stockDisponible = inventario.med_total_unidades_disponibles;
            if (stockDisponible < cantidadADescontar) throw new Error("Stock insuficiente en paciente");

            inventario.med_total_unidades_disponibles -= cantidadADescontar;
            await inventario.save({ transaction });

            await movimientosStockPacienteModel.create({
                med_pac_id: inventarioId,
                pac_id,
                med_id,
                usuario_id: usuarioId,
                cantidad: cantidadADescontar,
                tipo: 'Salida',
                med_origen: null,
                med_destino: 'Administración Paciente',
            }, { transaction });
        } else {
            throw new Error("Origen de inventario inválido");
        }

        return {
            success: true,
            cantidadDescontada: cantidadADescontar,
            tipoDescuento: esDescuentoUnico ? 'único' : 'por dosis',
        };
    } catch (error) {
        return { error: true, message: error.message };
    }
}



module.exports = { descontarStockPorAdministracion };


