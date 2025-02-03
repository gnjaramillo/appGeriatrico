// utils/sessionUtils.js

const limpiarSesion = (req) => {
    if (req.session) {
        delete req.session.ge_id;
        delete req.session.se_id;
        delete req.session.rol_id;
        delete req.session.rol_nombre;  
        delete req.session.nombre;
    }
};


module.exports = { limpiarSesion };
