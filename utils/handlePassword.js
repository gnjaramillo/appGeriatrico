const bcrypt = require('bcryptjs');



/**
 * recibe texto plano de la contraseña, se encripta con salt (10) 
 * q le da un hash aleatorio a la contraseña
 * @param {*} passwordPlain 
*/
const encrypt =  async (passwordPlain) =>{
    const hash = await bcrypt.hash(passwordPlain, 10)
    return hash
};

/**
compara version encriptada de la contraseña con el texto plano
contraseña sin encriptar y encriptada, 
 * @param {*} passwordPlain 
 * @param {*} hashPassword 
 */
const compare = async (passwordPlain, hashPassword ) => {
    return await bcrypt.compare(passwordPlain, hashPassword)

};


module.exports = {encrypt, compare }