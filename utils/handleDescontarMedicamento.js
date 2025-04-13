/* 

const { Op } = require("sequelize");
const {
    medicamentosModel,
    inventarioMedicamentosSedeModel,
    inventarioMedicamentosPacienteModel,
    movimientosStockSedeModel,
    movimientosStockPacienteModel,
} = require("../models");

// Presentaciones que solo se descuentan una vez por tratamiento
const PRESENTACIONES_UNICAS = ['frasco', 'crema', 'spray', 'gotas'];

async function descontarStockPorAdministracion({
    admin_id,
    med_id,
    dosis,
    usuarioId,
    inventarioOrigen, // 'sede' o 'paciente'
    inventarioId,
    sedeId = null,
    pacienteId = null,
    numeroDosis,
}) {
    const medicamento = await medicamentosModel.findByPk(med_id);
    if (!medicamento) throw new Error("Medicamento no encontrado");

    const presentacion = medicamento.med_presentacion;
    const esDescuentoUnico = PRESENTACIONES_UNICAS.includes(presentacion);

    // Si la presentación solo descuenta una vez, y ya hay más de una dosis registrada, se omite el descuento
    if (esDescuentoUnico && numeroDosis > 1) {
        return { skipDescuento: true };
    }

    const cantidadADescontar = 1;
    let inventario;
    let stockDisponible;

    if (inventarioOrigen === 'sede') {
        inventario = await inventarioMedicamentosSedeModel.findByPk(inventarioId);
        if (!inventario) throw new Error("Inventario de sede no encontrado");

        stockDisponible = inventario.med_total_unidades_disponibles;
        if (stockDisponible < cantidadADescontar) throw new Error("Stock insuficiente en sede");

        inventario.med_total_unidades_disponibles -= cantidadADescontar;
        await inventario.save();

        await movimientosStockSedeModel.create({
            med_sede_id: inventarioId,
            se_id: sedeId,
            med_id,
            usuario_id: usuarioId,
            cantidad: cantidadADescontar,
            tipo: 'Salida',
            med_origen: null,
            med_destino: 'Administración',
        });

    } else if (inventarioOrigen === 'paciente') {
        inventario = await inventarioMedicamentosPacienteModel.findByPk(inventarioId);
        if (!inventario) throw new Error("Inventario de paciente no encontrado");

        stockDisponible = inventario.med_total_unidades_disponibles;
        if (stockDisponible < cantidadADescontar) throw new Error("Stock insuficiente en paciente");

        inventario.med_total_unidades_disponibles -= cantidadADescontar;
        await inventario.save();

        await movimientosStockPacienteModel.create({
            med_pac_id: inventarioId,
            pac_id: pacienteId,
            med_id,
            usuario_id: usuarioId,
            cantidad: cantidadADescontar,
            tipo: 'Salida',
            med_origen: null,
            med_destino: 'Administración',
        });
    } else {
        throw new Error("Origen de inventario inválido");
    }

    return {
        success: true,
        cantidadDescontada: cantidadADescontar,
        tipoDescuento: esDescuentoUnico ? 'único' : 'por dosis',
    };
}

module.exports = { descontarStockPorAdministracion }; */



const { Op } = require("sequelize");
const {
    medicamentosModel,
    inventarioMedicamentosSedeModel,
    inventarioMedicamentosPacienteModel,
    movimientosStockSedeModel,
    movimientosStockPacienteModel,
} = require("../models");

// Presentaciones que solo se descuentan una vez por tratamiento
const PRESENTACIONES_UNICAS = ['frasco', 'crema', 'spray', 'gotas'];

async function descontarStockPorAdministracion({
    med_id,
    usuarioId,
    inventarioOrigen, // 'sede' o 'paciente'
    inventarioId,
    se_id = null,
    pac_id = null,
    numeroDosis,
}) {
    try {
        const medicamento = await medicamentosModel.findByPk(med_id);
        if (!medicamento) throw new Error("Medicamento no encontrado");

        const presentacion = medicamento.med_presentacion;
        const esDescuentoUnico = PRESENTACIONES_UNICAS.includes(presentacion);

        // Si la presentación solo se descuenta una vez y ya hay más de una dosis administrada, no se descuenta
        if (esDescuentoUnico && numeroDosis > 1) {
            return { skipDescuento: true, mensaje: 'Descuento omitido por presentación única' };
        }

        const cantidadADescontar = 1;
        let inventario;
        let stockDisponible;

        if (inventarioOrigen === 'sede') {
            inventario = await inventarioMedicamentosSedeModel.findByPk(inventarioId);
            if (!inventario) throw new Error("Inventario de sede no encontrado");

            stockDisponible = inventario.med_total_unidades_disponibles;
            if (stockDisponible < cantidadADescontar) throw new Error("Stock insuficiente en sede");

            inventario.med_total_unidades_disponibles -= cantidadADescontar;
            await inventario.save();

            await movimientosStockSedeModel.create({
                med_sede_id: inventarioId,
                se_id,
                med_id,
                usuario_id: usuarioId,
                cantidad: cantidadADescontar,
                tipo: 'Salida',
                med_origen: null,
                med_destino: 'Administración Paciente',
            });

        } else if (inventarioOrigen === 'paciente') {
            inventario = await inventarioMedicamentosPacienteModel.findByPk(inventarioId);
            if (!inventario) throw new Error("Inventario de paciente no encontrado");

            stockDisponible = inventario.med_total_unidades_disponibles;
            if (stockDisponible < cantidadADescontar) throw new Error("Stock insuficiente en paciente");

            inventario.med_total_unidades_disponibles -= cantidadADescontar;
            await inventario.save();

            await movimientosStockPacienteModel.create({
                med_pac_id: inventarioId,
                pac_id,
                med_id,
                usuario_id: usuarioId,
                cantidad: cantidadADescontar,
                tipo: 'Salida',
                med_origen: null,
                med_destino: 'Administración Paciente',
            });
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


