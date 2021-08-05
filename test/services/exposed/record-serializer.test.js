const RecordSerializer = require('../../../src/services/exposed/record-serializer');

describe('service > exposed > record-serializer', () => {
  describe('constructor', () => {
    it('should throw when missing the model', () => {
      expect.assertions(1);

      const construct = () => new RecordSerializer();
      expect(construct).toThrow(/missing first argument/);
    });

    it('should throw when the model is not an object', () => {
      expect.assertions(1);

      const construct = () => new RecordSerializer('i am a string');
      expect(construct).toThrow(/"model" argument should be an object/);
    });

    it('should work with only model', () => {
      expect.assertions(1);

      const construct = () => new RecordSerializer({ name: 'myModel' });
      expect(construct).not.toThrow();
    });

    it('should work with model, user and params', () => {
      expect.assertions(1);

      const construct = () => new RecordSerializer(
        { name: 'myModel' },
        { renderingId: 1 },
        { timezone: 'Europe/Paris' },
      );

      expect(construct).not.toThrow();
    });
  });
});
