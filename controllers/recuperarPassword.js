// recuperarPassword.js

const crypto = require('crypto');
const { personaModel } = require('../models'); 
const { sendMail } = require('../utils/handleEmail');
const bcrypt = require('bcryptjs');
const URL_RAILWAY_FRONTEND = process.env.URL_RAILWAY_FRONTEND 




// Generar un token aleatorio
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}



// Solicitar restablecimiento de contraseña
const forgotPassword = async (req, res) => {
    try {
        const { per_correo  } = req.body;
        if (!per_correo ) {
            return res.status(400).send({ message: 'Correo electrónico es requerido' });
        }

        const persona = await personaModel.findOne({ where: { per_correo } });
        if (!persona) {
            return res.status(404).send({ message: 'Usuario no encontrado' });
        }

        const token = generateToken();
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        persona.resetPasswordToken = hashedToken;
        persona.resetPasswordExpires = Date.now() + 3600000; // 1 hora
        await persona.save();

        // const resetUrl = `http://localhost:3000/api/restablecerPassword/${token}`;
        
        const resetUrl = `${URL_RAILWAY_FRONTEND}/api/restablecerPassword/${token}`;


        const mailOptions = {
            to: persona.per_correo,
            subject: 'Recuperación de Contraseña',
            text: `Hola ${persona.per_nombre_completo},\n\nPara restablecer tu contraseña, por favor visita el siguiente enlace:\n\n${resetUrl}`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
                <h2>Hola ${persona.per_nombre_completo},</h2>
                <p>Para restablecer tu contraseña, por favor haz clic en el siguiente botón:</p>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" target="_blank" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; font-size: 16px; border-radius: 5px; display: inline-block;">
                    Restablecer Contraseña
                  </a>
                </p>
                <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
                <br>
                <p style="font-size: 12px; color: #888;">Este enlace expirará en 1 hora.</p>
              </div>
            `
          };
          
          

        await sendMail(mailOptions);
        res.send({ message: 'Correo electrónico enviado' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error al enviar el correo electrónico' });
    }
};




module.exports = { forgotPassword};
