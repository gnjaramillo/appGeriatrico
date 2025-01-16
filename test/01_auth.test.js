const request = require("supertest")
const app =  require('../app')
const { testAuthRegister, testAuthLogin } = require("./helper/helperData")
const {sequelize} = require('../config/mysql'); // Configuración de Sequelize
const dbConnectNosql = require('../config/mongo');
const {usersModel} = require('../models')
const mongoose = require('mongoose');

// MongoDB
beforeAll(async () => {
    
    await mongoose.connection.dropDatabase();
      console.log("✅ Base de datos limpiada antes de las pruebas");
  

     // Limpia solo la colección 'users'
    await usersModel.deleteMany({});
    console.log("Colección 'users' limpiada.");
});



afterAll(async () => {
    // Cierra la conexión después de las pruebas
    await mongoose.connection.close();
    const dbStatus = mongoose.connection.readyState;  // 0 = desconectado
    console.log("Conexión a la base de datos cerrada. Estado:", dbStatus);
});

describe('esto deberia reportar un 404', () => {
  it('should return 404 for invalid login', async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send(testAuthLogin);
    expect(response.status).toBe(404);
  });
});

describe('[AUTH] Prueba de /api/auth', () =>{    
    test('esto deberia retornar un 201' , async () =>{
        const response = await request(app)
        .post('/api/auth/register')
        .send(testAuthRegister)
        expect(response.statusCode).toEqual(201)
        expect(response.body).toHaveProperty('data')
        expect(response.body).toHaveProperty('data.token')
        expect(response.body).toHaveProperty('data.user')
    })
})


describe('[AUTH] Prueba de error al registrar usuario con correo duplicado', () => {
  test('debería retornar un 400 si el correo ya está registrado', async () => {
    // Primer registro exitoso 
    await request(app)
      .post('/api/auth/register')
      .send(testAuthRegister);

    // Intentamos registrar el mismo usuario (correo duplicado)
    const response = await request(app)
      .post('/api/auth/register')
      .send(testAuthRegister); // Usamos la misma data del primer registro

    //código de error esperado
    expect(response.statusCode).toEqual(400); 
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('El correo ya está registrado'); 
  });
});


describe('[AUTH] Prueba de /api/auth', () => {
    test('esto debería retornar un 401', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          "email": "tito1@gmail.com",
          "password": "wrong"
        });
  
      console.log(response.body);  
      expect(response.statusCode).toEqual(401);
    });
  });
  


test("esto deberia de retornar 200 login exitoso", async () => {
    
    const response = await request(app)
        .post("/api/auth/login")
        .send(testAuthLogin);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('data.token');
});



  


// MYSQL
/* 
beforeAll(async () => {
    // Sincroniza la base de datos y fuerza la limpieza
    await sequelize.sync({ force: true });
    console.log("Base de datos de prueba limpia y sincronizada");
});

afterAll(async () => {
    // Cierra la conexión con Sequelize
    await sequelize.close();
    console.log("Conexión a la base de datos cerrada");
}); */






