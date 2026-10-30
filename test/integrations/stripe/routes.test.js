const express = require('express');
const bodyParser = require('body-parser');
const request = require('supertest');
const { init } = require('@forestadmin/context');
const StripeRoutes = require('../../../src/integrations/stripe/routes');
const auth = require('../../../src/services/auth');
const errorHandler = require('../../../src/services/exposed/error-handler');
const { default: CustomActionTriggerForbiddenError } = require('../../../src/services/authorization/errors/custom-action-trigger-forbidden-error');
const { default: CustomActionRequiresApprovalError } = require('../../../src/services/authorization/errors/custom-action-requires-approval-error');
const { default: ApprovalNotAllowedError } = require('../../../src/services/authorization/errors/approval-not-allowed-error');
const { default: BadRequestError } = require('../../../src/utils/errors/bad-request-error');

jest.mock('../../../src/middlewares/ip-whitelist', () => () => (req, res, next) => next());

describe('integrations > stripe > routes > POST refunds', () => {
  const user = { id: 7, renderingId: 1 };
  const model = { name: 'users' };
  const Implementation = { getModelName: (aModel) => aModel.name };

  function setup({ authenticatedUser = user } = {}) {
    auth.initAuth({ envSecret: 'env-secret' });
    const refundsCreate = jest.fn((params, callback) => callback(null));
    const actionAuthorizationService = {
      assertCanTriggerCustomAction: jest.fn().mockResolvedValue(),
      assertCanApproveCustomAction: jest.fn().mockResolvedValue(),
      verifySignedActionParameters: jest.fn(),
    };

    init((context) => context
      .addInstance('modelsManager', () => ({ getModels: () => ({ users: model }) }))
      .addInstance('actionAuthorizationService', () => actionAuthorizationService));

    const app = express();
    app.use(bodyParser.json());
    app.use((req, res, next) => {
      req.user = authenticatedUser;
      next();
    });

    const opts = {
      integrations: {
        stripe: {
          apiKey: 'sk_test',
          mapping: ['users.stripeId'],
          stripe: () => ({ refunds: { create: refundsCreate } }),
        },
      },
    };
    new StripeRoutes(app, model, Implementation, opts).perform();
    app.use(errorHandler());

    return { app, refundsCreate, actionAuthorizationService };
  }

  const refundRequestParams = {
    user,
    customActionName: 'Refund',
    collectionName: 'users_stripe_payments',
    recordsCounterParams: { user, timezone: 'Europe/Paris' },
  };

  it('refunds each charge when the user is allowed to trigger the Refund action', async () => {
    expect.assertions(5);
    const { app, refundsCreate, actionAuthorizationService } = setup();

    const response = await request(app)
      .post('/forest/users_stripe_payments/refunds?timezone=Europe/Paris')
      .send({ data: { attributes: { ids: ['ch_1', 'ch_2'] } } });

    expect(response.status).toBe(204);
    expect(actionAuthorizationService.assertCanTriggerCustomAction)
      .toHaveBeenCalledWith(refundRequestParams);
    expect(refundsCreate).toHaveBeenCalledTimes(2);
    expect(refundsCreate).toHaveBeenCalledWith({ charge: 'ch_1' }, expect.any(Function));
    expect(refundsCreate).toHaveBeenCalledWith({ charge: 'ch_2' }, expect.any(Function));
  });

  it('answers 403 and refunds nothing when the user is not allowed to trigger the Refund action', async () => {
    expect.assertions(3);
    const { app, refundsCreate, actionAuthorizationService } = setup();
    actionAuthorizationService.assertCanTriggerCustomAction
      .mockRejectedValue(new CustomActionTriggerForbiddenError());

    const response = await request(app)
      .post('/forest/users_stripe_payments/refunds?timezone=Europe/Paris')
      .send({ data: { attributes: { ids: ['ch_1'] } } });

    expect(response.status).toBe(403);
    expect(response.body.errors[0].name).toBe('CustomActionTriggerForbiddenError');
    expect(refundsCreate).not.toHaveBeenCalled();
  });

  it('answers 403 with the approver roles and refunds nothing when the Refund action requires approval', async () => {
    expect.assertions(3);
    const { app, refundsCreate, actionAuthorizationService } = setup();
    actionAuthorizationService.assertCanTriggerCustomAction
      .mockRejectedValue(new CustomActionRequiresApprovalError([3]));

    const response = await request(app)
      .post('/forest/users_stripe_payments/refunds?timezone=Europe/Paris')
      .send({ data: { attributes: { ids: ['ch_1'] } } });

    expect(response.status).toBe(403);
    expect(response.body.errors[0]).toMatchObject({
      name: 'CustomActionRequiresApprovalError',
      data: { roleIdsAllowedToApprove: [3] },
    });
    expect(refundsCreate).not.toHaveBeenCalled();
  });

  it('refunds the charges of a signed approval request when the approver is allowed to approve', async () => {
    expect.assertions(5);
    const { app, refundsCreate, actionAuthorizationService } = setup();
    actionAuthorizationService.verifySignedActionParameters.mockReturnValue({
      data: { attributes: { ids: ['ch_9'], requester_id: 42 } },
    });

    const response = await request(app)
      .post('/forest/users_stripe_payments/refunds?timezone=Europe/Paris')
      .send({ data: { attributes: { signed_approval_request: 'signed-token' } } });

    expect(response.status).toBe(204);
    expect(actionAuthorizationService.verifySignedActionParameters)
      .toHaveBeenCalledWith('signed-token');
    expect(actionAuthorizationService.assertCanApproveCustomAction)
      .toHaveBeenCalledWith({ ...refundRequestParams, requesterId: 42 });
    expect(actionAuthorizationService.assertCanTriggerCustomAction).not.toHaveBeenCalled();
    expect(refundsCreate).toHaveBeenCalledWith({ charge: 'ch_9' }, expect.any(Function));
  });

  it('answers 403 and refunds nothing when the approver is not allowed to approve the Refund action', async () => {
    expect.assertions(4);
    const { app, refundsCreate, actionAuthorizationService } = setup();
    actionAuthorizationService.verifySignedActionParameters.mockReturnValue({
      data: { attributes: { ids: ['ch_9'], requester_id: 42 } },
    });
    actionAuthorizationService.assertCanApproveCustomAction
      .mockRejectedValue(new ApprovalNotAllowedError([3]));

    const response = await request(app)
      .post('/forest/users_stripe_payments/refunds?timezone=Europe/Paris')
      .send({ data: { attributes: { signed_approval_request: 'signed-token' } } });

    expect(response.status).toBe(403);
    expect(response.body.errors[0].name).toBe('ApprovalNotAllowedError');
    expect(actionAuthorizationService.assertCanApproveCustomAction)
      .toHaveBeenCalledWith({ ...refundRequestParams, requesterId: 42 });
    expect(refundsCreate).not.toHaveBeenCalled();
  });

  it('answers 400 and refunds nothing when the signed approval request does not verify', async () => {
    expect.assertions(4);
    const { app, refundsCreate, actionAuthorizationService } = setup();
    actionAuthorizationService.verifySignedActionParameters.mockImplementation(() => {
      throw new BadRequestError('Invalid signed action parameters');
    });

    const response = await request(app)
      .post('/forest/users_stripe_payments/refunds?timezone=Europe/Paris')
      .send({ data: { attributes: { signed_approval_request: 'tampered-token' } } });

    expect(response.status).toBe(400);
    expect(actionAuthorizationService.assertCanApproveCustomAction).not.toHaveBeenCalled();
    expect(actionAuthorizationService.assertCanTriggerCustomAction).not.toHaveBeenCalled();
    expect(refundsCreate).not.toHaveBeenCalled();
  });

  it('answers 422 and refunds nothing when the body carries a requester id outside a signed approval request', async () => {
    expect.assertions(4);
    const { app, refundsCreate, actionAuthorizationService } = setup();

    const response = await request(app)
      .post('/forest/users_stripe_payments/refunds?timezone=Europe/Paris')
      .send({ data: { attributes: { ids: ['ch_1'], requester_id: 42 } } });

    expect(response.status).toBe(422);
    expect(actionAuthorizationService.assertCanApproveCustomAction).not.toHaveBeenCalled();
    expect(actionAuthorizationService.assertCanTriggerCustomAction).not.toHaveBeenCalled();
    expect(refundsCreate).not.toHaveBeenCalled();
  });

  it('answers 401 and refunds nothing when the request is not authenticated', async () => {
    expect.assertions(3);
    const { app, refundsCreate, actionAuthorizationService } = setup({
      authenticatedUser: null,
    });

    const response = await request(app)
      .post('/forest/users_stripe_payments/refunds?timezone=Europe/Paris')
      .send({ data: { attributes: { ids: ['ch_1'] } } });

    expect(response.status).toBe(401);
    expect(actionAuthorizationService.assertCanTriggerCustomAction).not.toHaveBeenCalled();
    expect(refundsCreate).not.toHaveBeenCalled();
  });
});
