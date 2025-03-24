const convertirHoraA24Horas = (hora12) => {
  const match = hora12.match(/(\d+):(\d+) (AM|PM)/);
  if (!match) throw new Error("Formato de hora inválido");

  let [_, hora, minutos, periodo] = match;
  hora = parseInt(hora, 10);

  if (periodo === "PM" && hora !== 12) hora += 12;
  if (periodo === "AM" && hora === 12) hora = 0;

  return `${hora.toString().padStart(2, "0")}:${minutos}:00`; // Retorna en HH:MM:SS
}; 






const calcularHorasTotales = (horaInicio, horaFin, fechaInicio, fechaFin) => {
  const matchInicio = horaInicio.match(/(\d+):(\d+) (AM|PM)/);
  const matchFin = horaFin.match(/(\d+):(\d+) (AM|PM)/);

  if (!matchInicio || !matchFin) throw new Error("Formato de hora inválido");

  let [_, horaIni, minutosIni, periodoIni] = matchInicio;
  let [__, horaFinStr, minutosFinStr, periodoFin] = matchFin;

  // Convertir a enteros
  horaIni = parseInt(horaIni) % 12 + (periodoIni === "PM" ? 12 : 0);
  let horaFinNum = parseInt(horaFinStr) % 12 + (periodoFin === "PM" ? 12 : 0);
  minutosIni = parseInt(minutosIni);
  let minutosFin = parseInt(minutosFinStr);

  // Convertir todo a minutos para facilitar el cálculo
  let minutosTotalesInicio = horaIni * 60 + minutosIni;
  let minutosTotalesFin = horaFinNum * 60 + minutosFin;

  // 🔹 Si la fecha de inicio y fin son distintas, sumar 24 horas
  if (fechaInicio !== fechaFin) {
    minutosTotalesFin += 24 * 60; 
  }

  let diferenciaMinutos = minutosTotalesFin - minutosTotalesInicio;
  let horasTotales = diferenciaMinutos / 60;

  return horasTotales;
};



const moment = require("moment-timezone");

const validarHoraInicioTurno = (tur_fecha_inicio, tur_hora_inicio) => {
  const ahora = moment().tz("America/Bogota"); // Fecha y hora actual
  const hoy = ahora.clone().startOf("day"); // Fecha actual sin horas
  const fechaInicio = moment(tur_fecha_inicio, "YYYY-MM-DD").tz("America/Bogota");
  const horaInicio = moment(tur_hora_inicio, "hh:mm A").tz("America/Bogota");

  // Si el turno es hoy, validar que la hora de inicio no sea menor a la hora actual
  if (fechaInicio.isSame(hoy, "day") && horaInicio.isBefore(ahora)) {
    return "⛔ La hora de inicio no puede ser menor a la hora actual si el turno empieza hoy.";
  }

  return null; // No hay error
};



const validarHoraFin = (tur_hora_inicio, tur_hora_fin, tur_fecha_inicio, tur_fecha_fin) => {
  if (!tur_hora_inicio || !tur_hora_fin) return null; // Si falta algún dato, no validamos

  const convertirHora24 = (hora) => {
      let [time, meridiano] = hora.split(" ");
      let [hh, mm] = time.split(":").map(Number);

      if (meridiano === "PM" && hh !== 12) hh += 12;
      if (meridiano === "AM" && hh === 12) hh = 0;

      return hh * 60 + mm; // Convertimos todo a minutos
  };

  const minutosInicio = convertirHora24(tur_hora_inicio);
  const minutosFin = convertirHora24(tur_hora_fin);

  // Si la hora de fin es menor que la de inicio, implica un cruce de medianoche
  if (minutosFin < minutosInicio) {
      const fechaInicio = new Date(tur_fecha_inicio);
      const fechaFin = new Date(tur_fecha_fin);

      if (fechaInicio.getTime() === fechaFin.getTime()) {
          return "⛔ Hora de inicio no puede ser superior a hora final del turno, o si el turno cruza medianoche, la fecha que finaliza el turno debe ser el día siguiente.";
      }
  }

  return null; // No hay error
};


module.exports = { convertirHoraA24Horas, calcularHorasTotales, validarHoraInicioTurno, validarHoraFin };


