/* const {IncomingWebhook} = require('@slack/webhook')
const WebHook = new IncomingWebhook(process.env.SLACK_WEBHOOK)


// personaliza la salida de mensajes (en este caso envio de logs hacia la herramients slack)
const loggerStream = {
    write: (message) => {
        WebHook.send({
            text: message,
        })
        console.log('capturando el log', message);
    }  
}

module.exports = loggerStream */


