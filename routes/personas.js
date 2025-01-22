const express = require('express');
const router = express.Router();
const { obtenerPersonasRegistradas } = require('../controllers/personas');
// const {} = require('../validators/personas');
// const upload = require('../middleware/multer');


router.get('/', obtenerPersonasRegistradas);



module.exports = router;
