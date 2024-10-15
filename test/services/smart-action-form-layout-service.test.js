const { init, inject } = require('@forestadmin/context');
const SmartActionFormLayoutService = require('../../src/services/smart-action-form-layout-service');

const setup = () => {
  init((context) => context
    .addUsingClass('smartActionFormLayoutService', () => SmartActionFormLayoutService));

  return inject();
};

describe('services > smart-action-form-layout', () => {
  describe('validateLayoutElement', () => {
    describe('errors', () => {
      it('should throw with message when layout element has an unexpected type', async () => {
        expect(() => SmartActionFormLayoutService.validateLayoutElement({ component: 'horizontal-separator' })).toThrow('horizontal-separator is not a valid component. Valid components are Row or Page or Separator or HtmlBlock');
      });

      it('should throw with message when Page does not contain elements', async () => {
        expect(() => SmartActionFormLayoutService.validateLayoutElement({ component: 'Page' })).toThrow('Page components must contain an array of fields or layout elements in property \'elements\'');
      });
      it('should throw with message when Page contains pages', async () => {
        expect(() => SmartActionFormLayoutService.validateLayoutElement({ component: 'Page', elements: [{ type: 'Layout', component: 'Page', elements: [] }] })).toThrow('Pages cannot contain other pages');
      });

      it('should throw with message when Row does not contain fields', async () => {
        expect(() => SmartActionFormLayoutService.validateLayoutElement({ component: 'Row' })).toThrow('Row components must contain an array of fields in property \'fields\'');
      });
      it('should throw with message when Row contains layout elements', async () => {
        expect(() => SmartActionFormLayoutService.validateLayoutElement({ component: 'Row', fields: [{ type: 'Layout', component: 'Separator' }] })).toThrow('Row components can only contain fields');
      });
    });
    describe('success', () => {
      it('should do nothing with a correct Page', async () => {
        expect(() => SmartActionFormLayoutService.validateLayoutElement({ component: 'Page', elements: [{ type: 'Layout', component: 'Separator' }] })).not.toThrow('');
      });

      it('should do nothing with a correct Separator', async () => {
        expect(() => SmartActionFormLayoutService.validateLayoutElement({ component: 'Separator' })).not.toThrow('');
      });
    });
  });

  describe('extractFieldsAndLayout', () => {
    it('should throw an an error when mixing pages and other types at the same level', async () => {
      const { smartActionFormLayoutService } = setup();

      const form = [
        {
          type: 'Layout',
          component: 'Page',
          elements: [
            {
              type: 'String',
              field: 'Credit card plan',
              id: 'Plan',
            },
            {
              type: 'Layout',
              component: 'HtmlBlock',
              content: `
                  <p>You will be asked to provide them in the next pages</p>`,
            }],
        },
        {
          type: 'String',
          field: 'Credit card plan',
          isRequired: true,
        },

        {
          type: 'String',
          field: 'Credit card number',
          isRequired: true,
        },
      ];

      await expect(() => smartActionFormLayoutService.extractFieldsAndLayout(form)).toThrow('You cannot use pages and other elements at the same level');
    });

    it('should return fields only if no layout is specified', async () => {
      const { smartActionFormLayoutService } = setup();

      const form = [

        {
          type: 'String',
          field: 'Credit card plan',
          id: 'Plan',
          widget: 'Dropdown',
          options: [
            'Base',
            'Gold',
            'Black',
          ],
          isRequired: true,
        },
        {
          type: 'Number',
          field: 'price',
          defaultValue: 40,
        },
        {
          type: 'Number',
          field: 'Max withdraw',
        },
        {
          type: 'Number',
          field: 'Max payment',
        },
        {
          type: 'Boolean',
          field: 'Systematic check',
        },
        {
          type: 'Number',
          field: 'Discount',
        },
        {
          type: 'Number',
          widget: 'NumberInput',
          field: 'Discount duration',
        },

      ];

      const { fields, layout } = smartActionFormLayoutService.extractFieldsAndLayout(form);

      expect(fields).toStrictEqual([
        {
          type: 'String',
          field: 'Credit card plan',
          id: 'Plan',
          widget: 'Dropdown',
          options: [
            'Base',
            'Gold',
            'Black',
          ],
          isRequired: true,
        },
        {
          type: 'Number',
          field: 'price',
          defaultValue: 40,
        },
        {
          type: 'Number',
          field: 'Max withdraw',
        },
        {
          type: 'Number',
          field: 'Max payment',
        },
        {
          type: 'Boolean',
          field: 'Systematic check',
        },
        {
          type: 'Number',
          field: 'Discount',
        },
        {
          type: 'Number',
          widget: 'NumberInput',
          field: 'Discount duration',
        },
      ]);
      expect(layout).toStrictEqual([]);
    });
    it('should extract out the layout and fields from the hook result', async () => {
      const { smartActionFormLayoutService } = setup();

      const form = [
        {
          type: 'Layout',
          component: 'Page',
          elements: [
            {
              type: 'String',
              field: 'Credit card plan',
              id: 'Plan',
              widget: 'Dropdown',
              options: ['Base', 'Gold', 'Black'],
              isRequired: true,
            },
            {
              type: 'Layout',
              component: 'HtmlBlock',
              content: `
                  <p>You will be asked to provide them in the next pages</p>`,
            }],
        },
        {
          type: 'Layout',
          component: 'Page',
          elements: [
            {
              type: 'Layout',
              component: 'HtmlBlock',
              content: 'This is an empty page',
            },
          ],
        },
        {
          type: 'Layout',
          component: 'Page',
          elements: [], // this empty page will be trimmed and not shown in the final form
        },
        {
          type: 'Layout',
          component: 'Page',
          elements: [
            {
              type: 'Number',
              field: 'price',
              defaultValue: 40,
            },
            { type: 'Layout', component: 'Separator' },
            { type: 'Layout', component: 'HtmlBlock', content: '<h3>constraints:</h3>' },
            {
              type: 'Layout',
              component: 'Row',
              fields: [
                {
                  type: 'Number',
                  field: 'Max withdraw',
                },
                {
                  type: 'Number',
                  field: 'Max payment',
                },
                {
                  type: 'Boolean',
                  field: 'Systematic check',
                },
              ],
            },
            {
              type: 'Layout',
              component: 'Row',
              fields: [
                {
                  type: 'Number',
                  field: 'Discount',
                },
                {
                  type: 'Number',
                  widget: 'NumberInput',
                  field: 'Discount duration',
                },
              ],
            },
          ],
        },
      ];

      const { fields, layout } = smartActionFormLayoutService.extractFieldsAndLayout(form);

      expect(fields).toStrictEqual([
        {
          type: 'String',
          field: 'Credit card plan',
          id: 'Plan',
          widget: 'Dropdown',
          options: [
            'Base',
            'Gold',
            'Black',
          ],
          isRequired: true,
        },
        {
          type: 'Number',
          field: 'price',
          defaultValue: 40,
        },
        {
          type: 'Number',
          field: 'Max withdraw',
        },
        {
          type: 'Number',
          field: 'Max payment',
        },
        {
          type: 'Boolean',
          field: 'Systematic check',
        },
        {
          type: 'Number',
          field: 'Discount',
        },
        {
          type: 'Number',
          widget: 'NumberInput',
          field: 'Discount duration',
        },
      ]);
      expect(layout).toStrictEqual([
        {
          type: 'Layout',
          component: 'page',
          elements: [
            {
              type: 'Layout',
              component: 'input',
              fieldId: 'Credit card plan',
            },
            {
              type: 'Layout',
              component: 'htmlBlock',
              content: '\n                  <p>You will be asked to provide them in the next pages</p>',
            },
          ],
        },
        {
          type: 'Layout',
          component: 'page',
          elements: [
            {
              type: 'Layout',
              component: 'htmlBlock',
              content: 'This is an empty page',
            },
          ],
        },
        {
          type: 'Layout',
          component: 'page',
          elements: [],
        },
        {
          type: 'Layout',
          component: 'page',
          elements: [
            {
              type: 'Layout',
              component: 'input',
              fieldId: 'price',
            },
            {
              type: 'Layout',
              component: 'separator',
            },
            {
              type: 'Layout',
              component: 'htmlBlock',
              content: '<h3>constraints:</h3>',
            },
            {
              type: 'Layout',
              component: 'row',
              fields: [
                {
                  type: 'Layout',
                  component: 'input',
                  fieldId: 'Max withdraw',
                },
                {
                  type: 'Layout',
                  component: 'input',
                  fieldId: 'Max payment',
                },
                {
                  type: 'Layout',
                  component: 'input',
                  fieldId: 'Systematic check',
                },
              ],
            },
            {
              type: 'Layout',
              component: 'row',
              fields: [
                {
                  type: 'Layout',
                  component: 'input',
                  fieldId: 'Discount',
                },
                {
                  type: 'Layout',
                  component: 'input',
                  fieldId: 'Discount duration',
                },
              ],
            },
          ],
        },
      ]);
    });
  });
});
