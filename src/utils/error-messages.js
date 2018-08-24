exports.CONFIGURATION = {
  AUTH_SECRET_MISSING: 'Your Forest authSecret seems to be missing. Can you check that you properly set a Forest authSecret in the Forest initializer?',
};

exports.SERVER_TRANSACTION = {
  SECRET_AND_RENDERINGID_INCONSISTENT: 'Cannot retrieve the project you\'re trying to unlock. The envSecret and renderingId seems to be missing or inconsistent.',
  SERVER_DOWN: 'Cannot retrieve the data from the Forest server. Forest API seems to be down right now.',
  SECRET_NOT_FOUND: 'Cannot retrieve the data from the Forest server. Can you check that you properly copied the Forest envSecret in the Liana initializer?',
  UNEXPECTED: 'Cannot retrieve the data from the Forest server. An error occured in Forest API.',
};
