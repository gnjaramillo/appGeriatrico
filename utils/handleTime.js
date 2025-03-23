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

module.exports = { convertirHoraA24Horas, calcularHorasTotales };


