const BaseFiltersParser = require('../../src/services/base-filters-parser');

describe('base-filters-parser', () => {
  describe('parseCondition', () => {
    describe('on a smart field', () => {
      describe('with filter method not defined', () => {
        it('should throw an error', async () => {
          const condition = {
            field: 'smart name',
            operator: 'present',
            value: null,
          };
          const schema = {
            fields: [{
              field: 'smart name',
              type: 'String',
              isVirtual: true,
              get() {},
            }],
          };
          const formatCondition = jest.fn().mockReturnValue({});
          await expect(BaseFiltersParser.parseCondition(condition, formatCondition, schema))
            .rejects.toThrow('"filter" method missing on smart field "smart name"');

          expect(formatCondition).not.toHaveBeenCalled();
        });
      });

      describe('with filter method defined', () => {
        describe('when filter method return null or undefined', () => {
          it('should throw an error', async () => {
            const condition = {
              field: 'smart name',
              operator: 'present',
              value: null,
            };
            const filter = jest.fn();
            const schema = {
              fields: [{
                field: 'smart name',
                type: 'String',
                isVirtual: true,
                get() {},
                filter,
              }],
            };

            const formattedCondition = { test: 'me' };
            const formatCondition = jest.fn().mockReturnValue(formattedCondition);

            await expect(BaseFiltersParser.parseCondition(condition, formatCondition, schema))
              .rejects.toThrow('"filter" method on smart field "smart name" must return a condition');

            expect(formatCondition).toHaveBeenCalledTimes(1);
            expect(formatCondition).toHaveBeenCalledWith(condition, true);

            expect(filter).toHaveBeenCalledTimes(1);
            expect(filter).toHaveBeenCalledWith({ where: formattedCondition, condition });
          });
        });

        describe('when filter method return a condition', () => {
          it('should return the condition', async () => {
            const where = { id: 1 };
            const filter = jest.fn(() => where);
            const schema = {
              fields: [{
                field: 'smart name',
                type: 'String',
                isVirtual: true,
                get() {},
                filter,
              }],
            };

            const condition = {
              field: 'smart name',
              operator: 'present',
              value: null,
            };
            const formattedCondition = { test: 'me' };
            const formatCondition = jest.fn().mockReturnValue(formattedCondition);

            await expect(BaseFiltersParser.parseCondition(condition, formatCondition, schema))
              .resolves.toStrictEqual(where);

            expect(formatCondition).toHaveBeenCalledTimes(1);
            expect(formatCondition).toHaveBeenCalledWith(condition, true);

            expect(filter).toHaveBeenCalledTimes(1);
            expect(filter).toHaveBeenCalledWith({ where: formattedCondition, condition });
          });
        });
      });
    });
  });
});
