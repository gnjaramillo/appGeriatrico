const crypto = require('crypto');
const { personaModel } = require('../models');
const { encrypt } = require('../utils/handlePassword');
const { Op } = require('sequelize'); 

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { per_password, confirmPassword } = req.body;

  try {
    if (per_password !== confirmPassword) {
      return res.status(400).json({ message: 'Las contraseñas no coinciden.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await personaModel.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado.' });
    }

    user.per_password = await encrypt(per_password);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // console.log(user.per_password)

    res.status(200).json({ message: 'Contraseña restablecida correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

module.exports = { resetPassword };
