const customHeader = (req, res,next) => {

try {
    const apiKey = req.headers['x-api-key']; 
    if (apiKey === 'gnjaramillo16') {
        next()

    } else {
        res.status(403)
        res.send({error: 'api key incorrecta'})
    }     
    
} catch (error) {
    res.status(403)
    res.send({error: 'algo ocurrió en el custom header'})
    
}
}

module.exports = {customHeader} 























/* const customHeader = (req, res,next) => {
   console.log(req.body)
   console.log(req.headers)
    next()
}

module.exports = {customHeader} */

// podemos capturar el body, el header


