'use strict';

exports.SESSION = {
  NO_USERS: 'Forest cannot retrieve any users for the project you\'re trying to unlock.',
  SECRET_AND_RENDERINGID_INCONSISTENT: 'Cannot retrieve the project you\'re trying to unlock. The envSecret and renderingId seems to be missing or inconsistent.',
  SECRET_AND_PROJECTID_INCONSISTENT: 'Cannot retrieve the project you\'re trying to unlock. The envSecret and projectId seems to be missing or inconsistent.',
  SECRET_NOT_FOUND: 'Cannot retrieve the project you\'re trying to unlock. Can you check that you properly copied the Forest envSecret in the Liana initializer?',
  SERVER_DOWN: 'Cannot retrieve any users for the project you\'re trying to unlock. Forest API seems to be down right now.',
  UNEXPECTED: 'Cannot retrieve the user for the project you\'re trying to unlock. An error occured in Forest API.',
};

exports.CONFIGURATION = {
  AUTH_SECRET_MISSING: 'Your Forest authSecret seems to be missing. Can you check that you properly set a Forest authSecret in the Forest initializer?',
};

exports.SERVER_TRANSACTION = {
  SERVER_DOWN: 'Cannot retrieve the list of whitelisted IPs. Forest API seems to be down right now.',
  SECRET_NOT_FOUND: 'Cannot retrieve the list of whitelisted IPs. Can you check that you properly copied the Forest envSecret in the Liana initializer?',
  UNEXPECTED: 'Cannot retrieve the list of whitelisted IPs. An error occured in Forest API.',
};
