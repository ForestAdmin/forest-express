const base32Encode = require('base32-encode');
const xor = require('bitwise-xor');

// NOTICE: This service combines the 2FA secret stored on the forest server to the local secret
//         salt. This guarantees that only the owner of the server and the concerned end user can
//         know the final key.
//         This is done by using a bitwise exclusive or operation, which guarantees the key to stay
//         unique, so it is impossible for two users to have the same key.
function UserSecretCreator(twoFactorAuthenticationSecret, twoFactorSecretSalt) {
  this.perform = () => {
    const hash = xor(
      Buffer.from(twoFactorAuthenticationSecret, 'hex'),
      Buffer.from(twoFactorSecretSalt, 'hex'),
    );

    return base32Encode(hash, 'RFC3548').replace(/=/g, '');
  };
}

module.exports = UserSecretCreator;
