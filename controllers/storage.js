const fs = require('fs'); // Para manipular el sistema de archivos
const path = require('path'); // Para manejar rutas de archivos
const {storageModel} = require('../models')
const {handleHttpError} = require('../utils/handleError')
const { matchedData } = require('express-validator');
const { Sequelize } = require('sequelize');  // Importar Sequelize


const PUBLIC_URL = process.env.PUBLIC_URL
// navegar hasta el lugar donde esta el archivo
const MEDIA_PATH = `${__dirname}/../storage`



// obtener lista
const getItems = async (req, res) => {
    try {
        const data = await storageModel.find({})
        res.send({data})
        
    } catch (error) {
        handleHttpError(res, 'error get items', 404)
    }    
};



// obtener detalle
const getItem = async (req, res) => {
    try {
        const {id} = matchedData(req) 
        const data = await storageModel.findById(id)
        res.send({data})
        
    } catch (error) {
        handleHttpError(res, 'error get item', 404)
    }    
};



// crear registro
const createItem = async (req, res) => {
    try {
        const {file} = req
         // Verificar si llega el archivo
        if (!file) {
            return res.status(400).send({ error: 'No file uploaded' });
        }
        console.log(file)
    
        const fileData = {
            filename: file.filename,
            url: `${PUBLIC_URL}/${file.filename}`    
        }
        
        const data = await storageModel.create(fileData)
        res.send({data})

    } catch (error) {
        handleHttpError(res, 'error create item')        
    }
};



// actualizar registro
const updateItems = async (req, res) => {
    try {
        
    } catch (error) {
        
    }
};


/* 
// eliminar archivo con soft delete mysql
const deleteItems = async (req, res) => {
    try {
        const { id } = matchedData(req);

        // Buscar el registro en la base de datos
        const dataFile = await storageModel.findByPk(id);
        if (!dataFile) {
            return res.status(404).send({ error: 'Archivo no encontrado' });
        }

        // Extraer el filename del archivo
        const { filename } = dataFile;
        const filePath = `${MEDIA_PATH}/${filename}`; // Ruta del archivo

        // Realizar el borrado lógico (actualiza la columna "deletedAt")
        const deleteResponse = await storageModel.destroy({
            where: { id }, // Condición para encontrar el registro
        });

        const data = {
            filePath,
            deleted: deleteResponse, // Sequelize devuelve el número de filas afectadas
        };

        res.send({ data });
    } catch (error) {
        console.error(error);
        handleHttpError(res, 'error delete item');
    }
};



// ver archivos eliminados con soft delete mysql
const getItemsDelete = async (req, res) => {
    try {
        // Obtener todos los registros eliminados lógicamente
        const deletedTracks = await storageModel.findAll({
            paranoid: false,  // Incluye registros eliminados lógicamente
            where: {
                deletedAt: { [Sequelize.Op.ne]: null }  // Registros donde deletedAt no es null
            }
        });
        res.send({ data: deletedTracks });
    } catch (error) {
        console.error(error); 
        handleHttpError(res, 'Error getting deleted tracks');
    }
}; 
 */




// eliminar archivo con soft delete mongo
const deleteItems = async (req, res) => {
    try {
        const {id} = matchedData(req)
        const dataFile = await storageModel.findById(id)
        if (!dataFile) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }
        // const deleteResponse = await storageModel.delete({_id: id}) 
        const deleteResponse = await dataFile.delete(); // Esto hace un soft delete
        const {filename} = dataFile // extraigo el filename de la data
        const filePath = `${MEDIA_PATH}/${filename}` // C:/miproyecto/file-12333...
        

        const data = {
            filePath,
            deleted: 1, // Confirmamos que el archivo fue marcado como eliminado
           // deleted:deleteResponse.matchedCount,
        }

        res.send({data});

    } catch (error) {
        handleHttpError(res, 'error delete item')
    }
};






// ver archivos eliminados con soft delete mongo
const getItemsDelete = async (req, res) => {
    try {
        const data = await storageModel.findDeleted({ deleted: true });
        res.send({data});

    } catch (error) {
        handleHttpError(res, 'error get items delete')
    }
}; 




module.exports = {getItems, getItem, createItem, updateItems, deleteItems, getItemsDelete}










// eliminar archivo fisico de la multimedia file y de la bd mongo
/* const deleteItems = async (req, res) => {
    try {
        const {id} = matchedData(req)
        const dataFile = await storageModel.findById(id)
        const deleteResponse = await storageModel.deleteOne({_id: id}) 

        const {filename} = dataFile // extraigo el filename de la data
        const filePath = `${MEDIA_PATH}/${filename}` // C:/miproyecto/file-12333...
        
        fs.unlinkSync(filePath) // elimina el archivo

        const data = {
            filePath,
            deleted:deleteResponse.matchedCount,
        }

        res.send({data});

    } catch (error) {
        handleHttpError(res, 'error delete item')
    }
} 
 */



/* si uso delete puedo recuperar el archivo con soft delete pero no 
podria usar unlinkSync para eliminar el archivo fisicamente (deleteOne lo elimina definitivo) */




// eliminar archivo fisico de la multimedia file y de la bd mysql
/* const deleteItems = async (req, res) => { 
    try {
        const { id } = matchedData(req); // Obtén el ID del request
        
        // Encuentra el registro en la base de datos
        const dataFile = await storageModel.findByPk(id, { paranoid: false }); 
        if (!dataFile) {
            return res.status(404).send({ error: 'Elemento no encontrado' });
        }

        // Extrae el nombre del archivo
        const { filename } = dataFile; 
        const filePath = path.join(MEDIA_PATH, filename);

        // Elimina el archivo físicamente
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); 
        }

        // Elimina el registro de la base de datos físicamente
        const deleteResponse = await storageModel.destroy({ where: { id }, force: true });

        res.send({ message: 'Borrado físico realizado', deleted: deleteResponse });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error realizando borrado físico' });
    }
};

 */

