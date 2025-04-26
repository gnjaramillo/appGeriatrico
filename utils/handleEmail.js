// https://nodemailer.com/smtp/  documentacion nodemailer


require('dotenv').config();
const nodemailer = require('nodemailer');

// Configuramos el transporter solo una vez
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT == 465, // true si puerto 465, false en 587
  auth: {
    user: process.env.SMTP_USER_EMAIL,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false, // Esto ayuda si hay problemas de certificados SSL con Gmail
  }

});

// Verificamos conexión al transporter al arrancar
transporter.verify((error, success) => {
  if (error) {
    console.error('Error de conexión con SMTP:', error);
  } else {
    console.log('Servidor SMTP listo para enviar correos ✅');
  }
});

// Función para enviar correo
const sendMail = async (mailOptions) => {
  try {
    // Valores por defecto de "from"
    const from = `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`;

    let info = await transporter.sendMail({
      from: from,
      ...mailOptions,
    });

    console.log(`✅ Correo enviado correctamente: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Error al enviar correo:', error.message);
    throw new Error('Error al enviar correo.');
  }
};

module.exports = { sendMail };
