import { Request } from 'express';
import { Params } from 'express-jwt';
import { Algorithm } from 'jsonwebtoken';

/* eslint-disable import/prefer-default-export */
const ALGORITHM_DEFAULT = process.env.JWT_ALGORITHM || 'HS256';
const CONFIGURATION_DEFAULT = {
  algorithms: [ALGORITHM_DEFAULT] as Algorithm[],
  credentialsRequired: false,
};

export type JWTConfiguration = {
  secret: string,
  getToken: (request: Request)=> string | Promise<string> | undefined,
};

export function getJWTConfiguration(configuration: JWTConfiguration): Params {
  return {
    ...CONFIGURATION_DEFAULT,
    ...configuration,
  };
}
