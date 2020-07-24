const HEX_20_REGEX = /^[0-9a-f]{20}$/i;

function is2FASaltValid(token) {
  if (HEX_20_REGEX.test(token)) {
    return true;
  }

  throw new Error('Your 2FA token environment variable "FOREST_2FA_SECRET_SALT" is invalid. Please use a string of 20 hexadecimal characters. You can generate it using this command: `$ openssl rand -hex 10`');
}

module.exports = {
  is2FASaltValid,
};
