const handleHttpError = (res, message = 'Algo sucedió', code = 403) => {
    res.status(code).send({ error: message });  // Encadenando correctamente el método send después de status
};

module.exports = { handleHttpError };
