const path = require('../../src/services/path');

describe('services > path', () => {
  describe('generate', () => {
    it('should preprend /forest', async () => {
      expect.assertions(1);

      const arg = 'dummy_path_value';
      const options = {};
      const generatedPath = path.generate(arg, options);

      expect(generatedPath).toStrictEqual(`/forest/${arg}`);
    });

    it('should not prepend /forest with expressParentApp option', async () => {
      expect.assertions(1);

      const arg = 'dummy_path_value';
      const options = { expressParentApp: true };
      const generatedPath = path.generate(arg, options);

      expect(generatedPath).toStrictEqual(`/${arg}`);
    });
  });

  describe('generateForInit', () => {
    it('should allow /forest and subpaths', async () => {
      expect.assertions(1);

      const arg = 'dummy_path_value';
      const options = {};
      const generatedPath = path.generateForInit(arg, options);

      expect(generatedPath).toStrictEqual(['/forest', `/forest/${arg}`]);
    });

    it('should not include /forest with expressParentApp option', async () => {
      expect.assertions(1);

      const arg = 'dummy_path_value';
      const options = { expressParentApp: true };
      const generatedPath = path.generateForInit(arg, options);

      expect(generatedPath).toStrictEqual(`/${arg}`);
    });
  });
});
