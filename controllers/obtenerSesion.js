const obtenerSesion = (req, res) => {
    if (!req.session || Object.keys(req.session).length === 0) {
        return res.status(403).json({ message: "No hay una sesión activa." });
    }

    return res.status(200).json(req.session);
};

module.exports = { obtenerSesion };
