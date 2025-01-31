// https://nodemailer.com/smtp/  documentacion nodemailer



require('dotenv').config();
const nodemailer = require('nodemailer');

module.exports = {
  sendMail: async (mailOptions) => {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true para 465, false para otros puertos
        auth: {
          user: process.env.SMTP_USER_EMAIL,
          pass: process.env.SMTP_PASSWORD
        }
      });

      let info = await transporter.sendMail(mailOptions);
      console.log('Correo electrónico enviado: %s', info.messageId);
    } catch (error) {
      console.error('Error al enviar correo electrónico:', error);
    }
  }
};