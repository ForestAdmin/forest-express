/* eslint-disable no-new */

const { init } = require('@forestadmin/context');
const Checker = require('../../../src/integrations/stripe/index');
const logger = require('../../../src/services/logger');

// Init context
init((context) => context.addInstance('modelsManager', {
  getModels: () => ({
    books: { rawAttributes: { stripeId: {} } },
    reviews: { },
  }),
}));

// Mock logger
jest.mock('../../../src/services/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('integration > stripe > index', () => {
  it('should do nothing when disabled', () => {
    jest.resetAllMocks();

    const Implementation = null;
    const opts = { integrations: { } };
    new Checker(opts, Implementation);

    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should warn about missing fields', () => {
    jest.resetAllMocks();

    const Implementation = null;
    const opts = { integrations: { stripe: {} } };

    new Checker(opts, Implementation);

    expect(logger.error).toHaveBeenCalledWith('Stripe integration attribute "apiKey" is missing');
    expect(logger.error).toHaveBeenCalledWith('Stripe integration attribute "stripe" is missing');
    expect(logger.error).toHaveBeenCalledWith('Stripe integration attribute "mapping" is invalid');
  });

  it('should warn about old syntax', () => {
    jest.resetAllMocks();

    const Implementation = null;
    const opts = {
      integrations: {
        stripe: {
          stripe: {}, apiKey: 'abcd', userCollection: 'books', userField: 'stripeId',
        },
      },
    };

    new Checker(opts, Implementation);

    expect(logger.warn).toHaveBeenCalledWith('Stripe integration attributes "userCollection" and "userField" are now deprecated, please use "mapping" attribute.');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should warn about invalid collection name', () => {
    jest.resetAllMocks();

    const Implementation = null;
    const opts = { integrations: { stripe: { stripe: {}, apiKey: 'abcd', mapping: 'user.stripeId' } } };

    new Checker(opts, Implementation);

    expect(logger.error).toHaveBeenCalledWith('Cannot find some Stripe integration mapping values (user.stripeId) among the project models:\nbooks, reviews');
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should warn about invalid field name', () => {
    jest.resetAllMocks();

    const Implementation = null;
    const opts = { integrations: { stripe: { stripe: {}, apiKey: 'abcd', mapping: 'books.wrongField' } } };

    new Checker(opts, Implementation);

    expect(logger.error).toHaveBeenCalledWith('Cannot find some Stripe integration mapping values (books.wrongField) among the project models:\nbooks, reviews');
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should not warn if the fields are not in the model (mongoose compatibility)', () => {
    jest.resetAllMocks();

    const Implementation = null;
    const opts = { integrations: { stripe: { stripe: {}, apiKey: 'abcd', mapping: 'reviews.stripeId' } } };

    new Checker(opts, Implementation);

    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should not warn if everything is defined properly (sequelize compatibility)', () => {
    jest.resetAllMocks();

    const Implementation = null;
    const opts = { integrations: { stripe: { stripe: {}, apiKey: 'abcd', mapping: 'books.stripeId' } } };

    new Checker(opts, Implementation);

    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
