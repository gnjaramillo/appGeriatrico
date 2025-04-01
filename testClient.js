const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('Conectado al servidor');
    socket.emit('eventoPersonalizado', { eventoPersonalizado: 'Prueba desde cliente Node.js' });
});

socket.on('respuestaServidor', (data) => {
    console.log('Respuesta del servidor:', data);
});
