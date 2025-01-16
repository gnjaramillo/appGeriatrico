


const testAuthRegister = {
    "name": "user test",
    "age": 20,
    "email": "tito1@gmail.com",
    "password": "tito1"
}

const testAuthLogin = {
    "email": "tito1@gmail.com",
    "password": "tito1"
}

  const testAuthRegisterAdmin = {
    name: "User test",
    age: 20,
    email: "tito2@gmail.com",
    role:  "admin",
    password: "tito2",
  };

  const testStorageRegister = {
    url: "http://localhost:3000/file-test.mp3",
    filename: "file-test.mp3"
  };

  const testDataTrack = {
    name: "Ejemplo",
    album: "Ejemplo",
    cover: "http://image.com",
    artist: {
      name: "Ejemplo",
      nickname: "Ejemplo",
      nationality: "VE",
    },
    duration: {
      start: 1,
      end: 3,
    },
    mediaId: "",
  };
  

  module.exports = {
    testAuthRegister,
    testAuthLogin,
    testAuthRegisterAdmin,
    testStorageRegister,
    testDataTrack
  }