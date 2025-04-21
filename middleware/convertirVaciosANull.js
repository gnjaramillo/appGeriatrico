// middlewares/convertirVaciosANull.js

const convertirStringsVaciosANull = (req, res, next) => {
    const limpiar = (obj) => {
      for (const key in obj) {
        if (obj[key] === "") {
          obj[key] = null;
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          limpiar(obj[key]); // Limpieza profunda
        }
      }
    };
  
    if (req.body) {
      limpiar(req.body);
    }
  
    next();
  };
  
  module.exports = convertirStringsVaciosANull;
  