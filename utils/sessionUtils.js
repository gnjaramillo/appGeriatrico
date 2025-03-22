// utils/sessionUtils.js

const limpiarSesion = (req) => {
    if (req.session) {
        delete req.session.ge_id;
        delete req.session.se_id;
        delete req.session.rol_id;
        delete req.session.rol_nombre;  
        delete req.session.nombre; // nombre de sede o geriatrico de un rol escogido
        delete req.session.geriatrico_nombre; // nombre del geriatrico dueño de la sede de un rol escogido
        delete req.session.enf_id; 



        req.session.save((err) => {
            if (err) {
                console.error("Error al guardar la sesión después de limpiar:", err);
            }
        });
    }
};



module.exports = { limpiarSesion };
