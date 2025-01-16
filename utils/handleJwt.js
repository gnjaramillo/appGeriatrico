const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const tokenSign = async (
    persona,
    sedeSeleccionada = null,
    rolSeleccionado = null,
    rolNombre = null,
    sedeNombre = null
) => {
    console.log('Datos enviados a tokenSign:', persona, sedeSeleccionada, rolSeleccionado, rolNombre, sedeNombre);

    const payload = {
        id: persona.per_id, // ID del usuario
        nombre: persona.per_nombre_completo || 'Sin Nombre', // Nombre del usuario
        se_id: sedeSeleccionada, // ID de la sede
        rol_id: rolSeleccionado, // ID del rol
        rol_nombre: rolNombre, // Nombre del rol
        sede_nombre: sedeNombre // Nombre de la sede
    };

    console.log('Payload generado:', payload);

    return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' }); // Ajusta el tiempo de expiración según sea necesario
};

const verifyToken = async (tokenJwt) => {
    try {
        const decoded = jwt.verify(tokenJwt, JWT_SECRET);
        console.log('Decoded Token:', decoded); // Verifica el contenido del token
        return decoded;
    } catch (error) {
        console.error('Token verification error:', error.message); // Muestra el error
        return null;
    }
};

module.exports = { tokenSign, verifyToken };





/* const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET


const tokenSign = async (
  persona,
  sedeSeleccionada = null,
  rolSeleccionado = null,
  rolNombre = null,
  sedeNombre = null
) => {
  console.log('Datos enviados a tokenSign:', persona, sedeSeleccionada, rolSeleccionado, rolNombre, sedeNombre);

  const payload = {
    id: persona.per_id, // ID del usuario
    nombre: persona.per_nombre_completo, // Nombre del usuario
    se_id: sedeSeleccionada, // ID de la sede
    rol_id: rolSeleccionado, // ID del rol
    rol_nombre: rolNombre, // Nombre del rol
    sede_nombre: sedeNombre // Nombre de la sede
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' }); // Ajusta el tiempo de expiración según sea necesario
};



const verifyToken = async (tokenJwt) => {
  try {
      const decoded = jwt.verify(tokenJwt, JWT_SECRET);
      console.log('Decoded Token:', decoded); // Verifica el contenido del token
      return decoded;
  } catch (error) {
      console.error('Token verification error:', error.message); // Muestra el error
      return null;
  }
};



module.exports = {tokenSign, verifyToken} */




/* 
const tokenSign = async (persona, rol, sede) => {
    const sign = await jwt.sign(
      {
        id: persona.per_id, // ID único del usuario
        nombre: persona.per_nombre_completo, // Nombre para referencia (opcional)
        rol: rol.rol_nombre || null, // Rol activo del usuario
        sede: sede.se_nombre || null, // Sede activa del usuario
      },
      JWT_SECRET,
      { expiresIn: '2h' } // Tiempo de expiración
    );




  
    return sign;
  }; */


  
/* const tokenSign = async (persona, sedeSeleccionada = null, rolSeleccionado=null) => {
  const sign = await jwt.sign(
    {
      id: persona.per_id, // ID único del usuario
      nombre: persona.per_nombre_completo, // Nombre para referencia
      se_id: sedeSeleccionada, // Agregar la sede seleccionada al token
      rol_id: rolSeleccionado, // Agregar el rol seleccionado al token
    },
    JWT_SECRET,
    { expiresIn: '2h' } // Tiempo de expiración
  );
  return sign;
};  */

// Cambia el tokenSign para aceptar el nombre del rol y sede
/* const tokenSign = async (persona, sedeSeleccionada = null, rolSeleccionado = null, rolNombre = null, sedeNombre = null) => {
  const sign = await jwt.sign(
    {
      id: persona.per_id, // ID único del usuario
      nombre: persona.per_nombre_completo, // Nombre para referencia
      se_id: sedeSeleccionada, // Agregar la sede seleccionada al token
      rol_id: rolSeleccionado, // Agregar el rol seleccionado al token
      rol_nombre: rolNombre, // Nombre del rol
      sede_nombre: sedeNombre, // Nombre de la sede
    },
    JWT_SECRET,
    { expiresIn: '2h' } // Tiempo de expiración
  );
  return sign;
}; */
