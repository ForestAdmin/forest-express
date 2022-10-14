const path = require('../../src/services/path');

describe('services > path', () => {
  describe('generate', () => {
    it('should preprend /forest', async () => {
      const arg = 'dummy_path_value';
      const options = {};
      const generatedPath = path.generate(arg, options);

      expect(generatedPath).toBe(`/forest/${arg}`);
    });

    it('should not prepend /forest with expressParentApp option', async () => {
      const arg = 'dummy_path_value';
      const options = { expressParentApp: true };
      const generatedPath = path.generate(arg, options);

      expect(generatedPath).toBe(`/${arg}`);
    });
  });

  describe('generateForInit', () => {
    it('should allow /forest and subpaths', async () => {
      const arg = 'dummy_path_value';
      const options = {};
      const generatedPath = path.generateForInit(arg, options);

      expect(generatedPath).toStrictEqual(['/forest', `/forest/${arg}`]);
    });

    it('should not include /forest with expressParentApp option', async () => {
      const arg = 'dummy_path_value';
      const options = { expressParentApp: true };
      const generatedPath = path.generateForInit(arg, options);

      expect(generatedPath).toBe(`/${arg}`);
    });
  });
});
