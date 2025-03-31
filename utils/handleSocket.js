const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: ["http://localhost:4000", "http://localhost:5173", "http://localhost:5174"],
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    socket.on('eventoPersonalizado', (data) => {
        console.log('Datos recibidos del cliente:', data);
        io.emit('respuestaServidor', { message: 'Respuesta del servidor', data });
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// ✅ Método para obtener la instancia de io en otros archivos
const getIo = () => io;

// Exportar correctamente
module.exports = { app, server, getIo };
