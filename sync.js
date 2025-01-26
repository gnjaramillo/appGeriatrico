const { sequelize } = require('./config/mysql');  
const models = require('./models'); 


// Sincroniza los modelos con la base de datos
sequelize.sync({ force: false })  // `force: false` para no eliminar las tablas existentes
  .then(() => {
    console.log('Tablas sincronizadas');
  })
  .catch(err => {
    console.error('Error al sincronizar las tablas:', err);
  });
