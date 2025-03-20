const convertirHoraA24Horas = (hora12) => {
  const match = hora12.match(/(\d+):(\d+) (AM|PM)/);
  if (!match) throw new Error("Formato de hora inválido");

  let [_, hora, minutos, periodo] = match;
  hora = parseInt(hora, 10);

  if (periodo === "PM" && hora !== 12) hora += 12;
  if (periodo === "AM" && hora === 12) hora = 0;

  return `${hora.toString().padStart(2, "0")}:${minutos}:00`; // Retorna en HH:MM:SS
};

const calcularHorasTotales = (horaInicio, horaFin) => {
  const matchInicio = horaInicio.match(/(\d+):(\d+) (AM|PM)/);
  const matchFin = horaFin.match(/(\d+):(\d+) (AM|PM)/);

  if (!matchInicio || !matchFin) throw new Error("Formato de hora inválido");

  const [_, horaIni, minutosIni, periodoIni] = matchInicio;
  const [__, horaFinStr, minutosFinStr, periodoFin] = matchFin; // Renombramos las variables para evitar conflicto

  // Convertir a formato 24h
  let horaInicio24 = parseInt(horaIni) % 12 + (periodoIni === "PM" ? 12 : 0);
  let horaFin24 = parseInt(horaFinStr) % 12 + (periodoFin === "PM" ? 12 : 0);

  let minutosInicio = parseInt(minutosIni);
  let minutosFin = parseInt(minutosFinStr);

  // Convertir todo a minutos para calcular la diferencia
  let minutosTotalesInicio = horaInicio24 * 60 + minutosInicio;
  let minutosTotalesFin = horaFin24 * 60 + minutosFin;

  // Si la hora final es menor, significa que pasa a la medianoche (ejemplo: 10 PM - 2 AM)
  if (minutosTotalesFin < minutosTotalesInicio) {
    minutosTotalesFin += 24 * 60; // Sumar 24 horas
  }

  let diferenciaMinutos = minutosTotalesFin - minutosTotalesInicio;
  return diferenciaMinutos / 60; // Convertir a horas
};


module.exports = { convertirHoraA24Horas, calcularHorasTotales };
