/* eslint-disable jest/no-hooks */

import ActionAuthorizationService from '../../../src/services/authorization/action-authorization';
import CustomActionTriggerForbiddenError from '../../../src/services/authorization/errors/custom-action-trigger-forbidden-error';
import InvalidActionConditionError from '../../../src/services/authorization/errors/invalid-action-condition-error';

const mockRecordsCounterCount = jest.fn();
jest.mock('../../../src/services/exposed/records-counter', () => ({
  __esModule: true,
  default: () => ({ count: mockRecordsCounterCount }),
}));

describe('actionAuthorizationService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const forestAdminClient = {
    permissionService: {
      canOnCollection: jest.fn(),
      canExecuteCustomAction: jest.fn(),
      canExecuteChart: jest.fn(),
      canExecuteSegmentQuery: jest.fn(),
      canApproveCustomAction: jest.fn(),
      canTriggerCustomAction: jest.fn(),
      doesTriggerCustomActionRequiresApproval: jest.fn(),

      getConditionalTriggerCondition: jest.fn(),
      getConditionalRequiresApprovalCondition: jest.fn(),
      getConditionalApproveCondition: jest.fn(),

      getConditionalApproveConditions: jest.fn(),
      getRoleIdsAllowedToApproveWithoutConditions: jest.fn(),
    },
    verifySignedActionParameters: jest.fn(),
  };

  const user = {
    id: 1,
    renderingId: 42,
    email: 'user@email.com',
    tags: {},
  };
  const recordsCounterParams = { user, model: Symbol('model') as never, timezone: 'Europe/Paris' };
  const filterForCaller = { field: 'id', operator: 'in', value: [1, 2, 3] };
  const customActionName = 'customActionName';
  const collectionName = 'collectionName';

  const condition = {
    value: 'someName',
    field: 'name',
    operator: 'equal',
    source: 'data',
  };

  function makeActionAuthorizationService() {
    return new ActionAuthorizationService(
      {
        forestAdminClient,
      } as unknown as ConstructorParameters<typeof ActionAuthorizationService>[0],
    );
  }

  describe('assertCanTriggerCustomAction', () => {
    describe('trigger does not require approval', () => {
      beforeEach(() => {
        forestAdminClient.permissionService
          .doesTriggerCustomActionRequiresApproval.mockResolvedValue(false);
      });

      it('should do nothing if the user can trigger a custom action', async () => {
        forestAdminClient.permissionService
          .canTriggerCustomAction.mockResolvedValue(true);

        const authorization = makeActionAuthorizationService();

        await expect(
          authorization.assertCanTriggerCustomAction({
            user,
            collectionName,
            customActionName,
            recordsCounterParams,
            filterForCaller,
          }),
        ).resolves.toBeUndefined();

        expect(forestAdminClient.permissionService.canTriggerCustomAction).toHaveBeenCalledWith({
          userId: 1,
          customActionName,
          collectionName,
        });
      });

      it('should throw an error if the user cannot trigger', async () => {
        (forestAdminClient.permissionService.canTriggerCustomAction).mockResolvedValue(
          false,
        );

        const authorization = makeActionAuthorizationService();

        await expect(
          authorization.assertCanTriggerCustomAction({
            user,
            collectionName,
            customActionName,
            recordsCounterParams,
            filterForCaller,
          }),
        ).rejects.toThrow(CustomActionTriggerForbiddenError);
      });

      describe('with "Trigger" condition (conditional use case)', () => {
        beforeEach(() => {
          // user can trigger from permission
          (
            forestAdminClient.permissionService.canTriggerCustomAction
          ).mockResolvedValue(true);

          (
            forestAdminClient.permissionService.getConditionalTriggerCondition
          ).mockResolvedValue(condition);
        });

        it('should do nothing if the user can perform conditional trigger', async () => {
          // All aggregate count returns the same results user can perform conditional trigger
          (mockRecordsCounterCount).mockResolvedValue(16);

          const authorization = makeActionAuthorizationService();

          await expect(
            authorization.assertCanTriggerCustomAction({
              user,
              collectionName,
              customActionName,
              recordsCounterParams,
              filterForCaller,
            }),
          ).resolves.toBeUndefined();

          expect(
            forestAdminClient.permissionService.getConditionalTriggerCondition,
          ).toHaveBeenCalledWith({
            userId: 1,
            collectionName,
            customActionName,
          });

          expect(mockRecordsCounterCount).toHaveBeenCalledTimes(2);
        });

        it('should throw an error if cannot perform conditional trigger', async () => {
          // Aggregate returns different results user cannot perform conditional trigger
          (mockRecordsCounterCount)
            .mockResolvedValueOnce(16)
            .mockResolvedValueOnce(2);

          const authorization = makeActionAuthorizationService();

          await expect(
            authorization.assertCanTriggerCustomAction({
              user,
              collectionName,
              customActionName,
              recordsCounterParams,
              filterForCaller,
            }),
          ).rejects.toThrow(CustomActionTriggerForbiddenError);

          expect(mockRecordsCounterCount).toHaveBeenCalledTimes(2);
        });
      });
    });

    describe('trigger does require approval', () => {
      beforeEach(() => {
        (
          forestAdminClient.permissionService.doesTriggerCustomActionRequiresApproval
        ).mockResolvedValue(true);

        // We test the require approval so yes the user can trigger
        (forestAdminClient.permissionService.canTriggerCustomAction).mockResolvedValue(
          true,
        );

        // No Approve conditions for any roles for this action
        (
          forestAdminClient.permissionService.getConditionalApproveConditions
        ).mockResolvedValue(undefined);

        (
          forestAdminClient.permissionService
            .getRoleIdsAllowedToApproveWithoutConditions
        ).mockResolvedValue([1, 16]);
      });

      it(
        'should throw an error CustomActionRequiresApprovalError with the '
          + 'RoleIdsAllowedToApprove',
        async () => {
          (
            forestAdminClient.permissionService.getConditionalRequiresApprovalCondition
          ).mockResolvedValue(null);

          const authorization = makeActionAuthorizationService();

          await expect(
            authorization.assertCanTriggerCustomAction({
              user,
              collectionName,
              customActionName,
              recordsCounterParams,
              filterForCaller,
            }),
          ).rejects.toMatchObject({
            name: 'CustomActionRequiresApprovalError',
            message: 'This action requires to be approved.',
            data: {
              roleIdsAllowedToApprove: [1, 16],
            },
          });
        },
      );

      describe('with "RequiresApproval" condition (conditional use case)', () => {
        beforeEach(() => {
          (
            forestAdminClient.permissionService.getConditionalRequiresApprovalCondition
          ).mockResolvedValue(condition);
        });

        it('should do nothing if no records match the "RequiresApproval" condition', async () => {
          // No records matching condition approval not required
          (mockRecordsCounterCount).mockResolvedValue(0);

          const authorization = makeActionAuthorizationService();

          await expect(
            authorization.assertCanTriggerCustomAction({
              user,
              collectionName,
              customActionName,
              recordsCounterParams,
              filterForCaller,
            }),
          ).resolves.toBeUndefined();

          expect(
            forestAdminClient.permissionService.getConditionalRequiresApprovalCondition,
          ).toHaveBeenCalledWith({
            userId: 1,
            customActionName,
            collectionName,
          });

          // One time during doesTriggerCustomActionRequiresApproval
          // Not called during roleIdsAllowedToApprove computation (No Approve condition)
          expect(mockRecordsCounterCount).toHaveBeenCalledTimes(1);
        });

        it(
          'should throw an error CustomActionRequiresApprovalError '
            + 'if some records on which the CustomAction is executed match condition',
          async () => {
            (mockRecordsCounterCount).mockResolvedValueOnce(3);

            const authorization = makeActionAuthorizationService();

            await expect(
              authorization.assertCanTriggerCustomAction({
                user,
                collectionName,
                customActionName,
                recordsCounterParams,
                filterForCaller,
              }),
            ).rejects.toMatchObject({
              name: 'CustomActionRequiresApprovalError',
              message: 'This action requires to be approved.',
              data: {
                roleIdsAllowedToApprove: [1, 16],
              },
            });

            // One time during doesTriggerCustomActionRequiresApproval
            // Not called during roleIdsAllowedToApprove computation (No Approve condition)
            expect(mockRecordsCounterCount).toHaveBeenCalledTimes(1);
          },
        );

        it(
          'should throw an error InvalidActionConditionError when we cannot compute the '
            + ' aggregate count',
          async () => {
            (mockRecordsCounterCount).mockRejectedValue(
              new Error('Some internal driver error'),
            );

            const authorization = makeActionAuthorizationService();

            await expect(
              authorization.assertCanTriggerCustomAction({
                user,
                collectionName,
                customActionName,
                recordsCounterParams,
                filterForCaller,
              }),
            ).rejects.toThrow(new InvalidActionConditionError());
          },
        );
      });
    });
  });

  describe('assertCanApproveCustomAction', () => {
    describe('without "Approval" condition (basic use case)', () => {
      beforeEach(() => {
        // No Approve conditions for any roles for this action
        (
          forestAdminClient.permissionService.getConditionalApproveConditions
        ).mockResolvedValue(undefined);

        (
          forestAdminClient.permissionService
            .getRoleIdsAllowedToApproveWithoutConditions
        ).mockResolvedValue([1, 16]);
      });

      it('should do nothing if the user can approve a custom action', async () => {
        (forestAdminClient.permissionService.canApproveCustomAction).mockResolvedValue(
          true,
        );

        (
          forestAdminClient.permissionService.getConditionalApproveCondition
        ).mockResolvedValue(null);

        const authorization = makeActionAuthorizationService();

        await expect(
          authorization.assertCanApproveCustomAction({
            user,
            collectionName,
            customActionName,
            recordsCounterParams,
            filterForCaller,
            requesterId: 30,
          }),
        ).resolves.toBeUndefined();

        expect(forestAdminClient.permissionService.canApproveCustomAction).toHaveBeenCalledWith({
          userId: 1,
          customActionName,
          collectionName,
          requesterId: 30,
        });

        expect(
          forestAdminClient.permissionService.getConditionalApproveCondition,
        ).toHaveBeenCalledWith({
          userId: 1,
          customActionName,
          collectionName,
        });

        expect(mockRecordsCounterCount).not.toHaveBeenCalled();
      });

      it('should throw an error if the user cannot approve', async () => {
        (forestAdminClient.permissionService.canApproveCustomAction).mockResolvedValue(
          false,
        );

        const authorization = makeActionAuthorizationService();

        await expect(
          authorization.assertCanApproveCustomAction({
            user,
            collectionName,
            customActionName,
            recordsCounterParams,
            filterForCaller,
            requesterId: 30,
          }),
        ).rejects.toMatchObject({
          name: 'ApprovalNotAllowedError',
          message: "You don't have permission to approve this action.",
          data: {
            roleIdsAllowedToApprove: [1, 16],
          },
        });

        expect(mockRecordsCounterCount).not.toHaveBeenCalled();
      });
    });

    describe('with "Approval" condition (conditional use case)', () => {
      beforeEach(() => {
        (forestAdminClient.permissionService.canApproveCustomAction).mockResolvedValue(
          true,
        );

        (
          forestAdminClient.permissionService.getConditionalApproveCondition
        ).mockResolvedValue(condition);

        (
          forestAdminClient.permissionService.getConditionalApproveConditions
        ).mockResolvedValue(
          new Map([
            [
              10,
              {
                value: 'some',
                field: 'name',
                operator: 'Equal',
                source: 'data',
              },
            ],
            [
              20,
              {
                value: 'some',
                field: 'name',
                operator: 'Equal',
                source: 'data',
              },
            ],
          ]),
        );

        (
          forestAdminClient.permissionService
            .getRoleIdsAllowedToApproveWithoutConditions
        ).mockResolvedValue([1, 16]);
      });

      it('should do nothing if the user can approve a custom action', async () => {
        (mockRecordsCounterCount).mockResolvedValue(3);

        const authorization = makeActionAuthorizationService();

        await expect(
          authorization.assertCanApproveCustomAction({
            user,
            collectionName,
            customActionName,
            recordsCounterParams,
            filterForCaller,
            requesterId: 30,
          }),
        ).resolves.toBeUndefined();

        expect(mockRecordsCounterCount).toHaveBeenCalledTimes(2);
      });

      it('should throw an error ApprovalNotAllowedError', async () => {
        (mockRecordsCounterCount).mockResolvedValueOnce(3);

        const authorization = makeActionAuthorizationService();

        await expect(
          authorization.assertCanApproveCustomAction({
            user,
            collectionName,
            customActionName,
            recordsCounterParams,
            filterForCaller,
            requesterId: 30,
          }),
        ).rejects.toMatchObject({
          name: 'ApprovalNotAllowedError',
          message: "You don't have permission to approve this action.",
          data: {
            roleIdsAllowedToApprove: [1, 16, 10, 20],
          },
        });

        // Two time during canApproveCustomAction
        // Two time during roleIdsAllowedToApprove computation
        // Even if there is two approves conditions they have equivalent condition hashes
        // so it's only computed once for both conditions
        // (We group roleId by condition hash to gain performances)
        expect(mockRecordsCounterCount).toHaveBeenCalledTimes(4);
      });
    });
  });
});
