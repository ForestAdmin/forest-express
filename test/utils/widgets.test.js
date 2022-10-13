const { setFieldWidget } = require('../../src/utils/widgets');

describe('utils › widgets', () => {
  describe('setFieldWidget', () => {
    it('should remove widget property', () => {
      const field = { widget: 'hop' };
      setFieldWidget(field);
      expect(field.widget).toBeUndefined();
    });

    it('should set widgetEdit correctly for legacy widgets', () => {
      const field = { widget: 'price' };
      const expected = { widgetEdit: { name: 'price editor', parameters: {} } };
      setFieldWidget(field);
      expect(field).toStrictEqual(expected);
    });

    it('should set widgetEdit correctly for currrent widgets', () => {
      const field = { widget: 'boolean editor' };
      const expected = { widgetEdit: { name: 'boolean editor', parameters: {} } };
      setFieldWidget(field);
      expect(field).toStrictEqual(expected);
    });

    it('should set widgetEdit to null when widget is unknown', () => {
      const field = { widget: 'WRONG VALUE' };
      const expected = { widgetEdit: null };
      setFieldWidget(field);
      expect(field).toStrictEqual(expected);
    });
  });
});
