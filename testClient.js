/* const io = require("socket.io-client");

// Conéctate al servidor WebSocket (ajusta la URL si es diferente)
const socket = io("http://localhost:3000"); // Asegúrate de que el servidor esté corriendo en ese puerto

socket.on("connect", () => {
    console.log("Conectado al servidor WebSocket");

    // Enviar un evento personalizado
    socket.emit("eventoPersonalizado", { mensaje: "Hola desde el cliente de prueba" });

    // Escuchar la respuesta del servidor
    socket.on("respuestaServidor", (data) => {
        console.log("Respuesta del servidor:", data);
    });

    // Escuchar los mensajes de prueba del backend
    socket.on("pruebaConexion", (data) => {
        console.log("Mensaje de prueba recibido:", data);
    });
});

// Manejar desconexión
socket.on("disconnect", () => {
    console.log("Desconectado del servidor WebSocket");
});
 */