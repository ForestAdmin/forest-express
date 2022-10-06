import { Request } from 'express';
import { Options } from 'express-jwt';

/* eslint-disable import/prefer-default-export */
const ALGORITHM_DEFAULT = process.env.JWT_ALGORITHM || 'HS256';
const CONFIGURATION_DEFAULT = {
  algorithms: [ALGORITHM_DEFAULT],
  credentialsRequired: false,
};

export type JWTConfiguration = {
  secret: string,
  getToken: (request: Request)=> string | null,
};

export function getJWTConfiguration(configuration: JWTConfiguration): Options {
  return {
    ...CONFIGURATION_DEFAULT,
    ...configuration,
  };
}
