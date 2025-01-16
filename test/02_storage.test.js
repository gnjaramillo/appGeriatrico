const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Tu aplicación Express
const fs = require('fs');
const path = require('path');
const { tokenSign } = require("../utils/handleJwt");
const {testAuthRegisterAdmin,testStorageRegister } = require("./helper/helperData");
const { usersModel, storageModel } = require("../models");
const dbConnectNosql = require('../config/mongo');
let JWT_TOKEN = "";



beforeAll(async () => {
  
  await mongoose.connection.dropDatabase();
    console.log("✅ Base de datos limpiada antes de las pruebas");
  await usersModel.deleteMany({});
  await storageModel.deleteMany({}); 
  
  // Crear un usuario de prueba y obtener el token JWT
  const user = await usersModel.create(testAuthRegisterAdmin);
  JWT_TOKEN = await tokenSign(user);
  
  // Crear un archivo de prueba en la base de datos
  await storageModel.create(testStorageRegister);
});



afterAll(async () => {
  // Cierra la conexión después de las pruebas
  await mongoose.connection.close();
  const dbStatus = mongoose.connection.readyState;  // 0 = desconectado
  console.log("Conexión a la base de datos cerrada. Estado:", dbStatus);
});

// Ruta al archivo de prueba para simular la subida
const filePath = path.join(__dirname, 'dump', 'track.mp3'); // Asegúrate de tener este archivo en la carpeta 'dump'

// Prueba para subir un archivo
describe('POST /storage', () => {
  it('debería subir un archivo correctamente', async () => {
    const res = await request(app)
      .post('/api/storage')
      .set('Authorization', `Bearer ${JWT_TOKEN}`) // Usa un token válido si es necesario
      .attach('myFile', filePath);

    expect(res.statusCode).toEqual(200); // Esperamos que la respuesta sea 200 OK
    expect(res.body.data).toHaveProperty('filename'); // Verifica que el campo 'filename' esté presente
    expect(res.body.data).toHaveProperty('url'); // Verifica que la URL esté presente
  });

  it('debería devolver un error si no se sube un archivo', async () => {
    const res = await request(app)
      .post('/api/storage')
      .set('Authorization', `Bearer ${JWT_TOKEN}`) // Usa un token válido si es necesario
      .field('myFile', ''); // No adjuntamos un archivo

    expect(res.statusCode).toEqual(400); // Esperamos que se devuelva un error 400
    expect(res.body.error).toEqual('No file uploaded'); // Verifica el mensaje de error
  });
});

// Prueba para obtener todos los archivos
describe('GET /storage', () => {
  it('debería obtener una lista de archivos', async () => {
    const res = await request(app)
      .get('/api/storage')
      .set('Authorization', `Bearer ${JWT_TOKEN}`); // Usa un token válido si es necesario
    const { body } = res;
    expect(res.statusCode).toEqual(200);
    const {data} = body;
    expect(body).toHaveProperty('data'); // Verifica que los datos sean un array
  });
});

// Prueba para obtener un archivo específico por ID
describe('GET /storage/:id', () => {
  test("debe retornar todo el detalle del item", async () => {
    // Obtenemos un archivo creado previamente en la base de datos
    const storageItem = await storageModel.findOne(); 
    const id = storageItem._id.toString(); // Usamos el ID de la base de datos
    
    const res = await request(app)
      .get(`/api/storage/${id}`)
      .set("Authorization", `Bearer ${JWT_TOKEN}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("data");
  });
});

// Prueba para eliminar un archivo
describe('DELETE /storage/:id', () => {
  test("debe eliminar el item", async () => {
    // Obtenemos un archivo creado previamente en la base de datos
    const storageItem = await storageModel.findOne(); 
    const id = storageItem._id.toString(); // Usamos el ID de la base de datos
    
    const res = await request(app)
      .delete(`/api/storage/${id}`)
      .set("Authorization", `Bearer ${JWT_TOKEN}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data.deleted).toBe(1); // Verifica que la eliminación lógica fue exitosa
  });
  

it('debería devolver un error si el archivo no existe', async () => {
  const invalidId = new mongoose.Types.ObjectId(); // ID válido pero inexistente
  const res = await request(app)
    .delete(`/api/storage/${invalidId}`)
    .set('Authorization', `Bearer ${JWT_TOKEN}`);

  expect(res.statusCode).toEqual(404);
  expect(res.body.error).toEqual('Archivo no encontrado');
});
});