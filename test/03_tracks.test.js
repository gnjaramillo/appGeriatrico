const request = require("supertest");
const app = require("../app");
const { tokenSign } = require("../utils/handleJwt");
const { usersModel, storageModel, tracksModel } = require("../models");
const {
  testAuthRegisterAdmin,
  testDataTrack,
  testStorageRegister
} = require("./helper/helperData");
const dbConnectNosql = require('../config/mongo');
const mongoose = require('mongoose');



describe("Pruebas de API para la gestión de tracks", () => {
  let STORAGE_ID = "";
  let JWT_TOKEN = "";



  beforeAll(async () => {
      
      await mongoose.connection.dropDatabase();
        console.log("✅ Base de datos limpiada antes de las pruebas");
    
    await usersModel.deleteMany({});
    await storageModel.deleteMany({});
  
    // Crea un nuevo usuario y almacenamiento
    const user = await usersModel.create(testAuthRegisterAdmin);
    const storage = await storageModel.create(testStorageRegister);
  
    // Asigna los valores de los objetos creados a las variables
    STORAGE_ID = storage._id.toString();
    JWT_TOKEN = await tokenSign(user);
  });
  

  // Grupo para crear un track
  describe("POST /api/tracks", () => {
    test("debería registrar un item", async () => {
      const dataTracksNew = {
        ...testDataTrack,
        mediaId: STORAGE_ID
      };

      const res = await request(app)
        .post("/api/tracks")
        .set("Authorization", `Bearer ${JWT_TOKEN}`)
        .send(dataTracksNew);
      const { body } = res;
      expect(res.statusCode).toEqual(201);
      expect(body).toHaveProperty("data");
      expect(body).toHaveProperty("data.name");
      expect(body).toHaveProperty("data.artist");
      expect(body).toHaveProperty("data.cover");
    });
  });

  // Grupo para obtener todos los tracks
  describe("GET /api/tracks", () => {
    test("should return all tracks", async () => {
      const res = await request(app)
        .get("/api/tracks")
        .set("Authorization", `Bearer ${JWT_TOKEN}`);
      const { body } = res;
      expect(res.statusCode).toEqual(200);
      expect(body).toHaveProperty("data");
    });
  });

  // Grupo para obtener detalles de un track
  describe("GET /api/tracks/:id", () => {
    test("debe retornar todo el detalle del item", async () => {
      const { _id } = await tracksModel.findOne({});
      const id = _id.toString();
      const res = await request(app)
        .get(`/api/tracks/${id}`)
        .set("Authorization", `Bearer ${JWT_TOKEN}`);
      const { body } = res;
      expect(res.statusCode).toEqual(200);
      expect(body).toHaveProperty("data");
    });
  });

  // Grupo para eliminar un track
  describe("DELETE /api/tracks/:id", () => {
    test("debe eliminar el item", async () => {
      const { _id } = await tracksModel.findOne({});
      const id = _id.toString();
      const res = await request(app)
        .delete(`/api/tracks/${id}`)
        .set("Authorization", `Bearer ${JWT_TOKEN}`);
      const { body } = res;
      expect(res.statusCode).toEqual(200);
      expect(body).toHaveProperty("data");
      expect(body).toHaveProperty("data.deleted", 1);
    });
  });
});


  
