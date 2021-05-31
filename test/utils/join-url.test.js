const joinUrl = require('../../src/utils/join-url');

describe('utils > join-url', () => {
  describe('when the base url only contains a domain name', () => {
    const baseUrl = 'http://localhost:3000';

    it('should correctly append the path if it does not start with a /', () => {
      expect.assertions(1);
      expect(joinUrl(baseUrl, 'forest/authentication')).toStrictEqual(`${baseUrl}/forest/authentication`);
    });

    it('should correctly append the path if it starts with a /', () => {
      expect.assertions(1);
      expect(joinUrl(baseUrl, '/forest/authentication')).toStrictEqual(`${baseUrl}/forest/authentication`);
    });

    it('should correctly append each parts when not starting with a /', () => {
      expect.assertions(1);
      expect(joinUrl(baseUrl, 'forest', 'authentication')).toStrictEqual(`${baseUrl}/forest/authentication`);
    });

    it('should correctly append each parts when starting with a /', () => {
      expect.assertions(1);
      expect(joinUrl(baseUrl, '/forest', '/authentication')).toStrictEqual(`${baseUrl}/forest/authentication`);
    });

    it('should correctly append each parts when ending with a /', () => {
      expect.assertions(1);
      expect(joinUrl(baseUrl, '/forest/', '/authentication')).toStrictEqual(`${baseUrl}/forest/authentication`);
    });

    it('should ignore empty parts', () => {
      expect.assertions(1);
      expect(joinUrl(baseUrl, '', 'forest', 'authentication')).toStrictEqual(`${baseUrl}/forest/authentication`);
    });
  });

  describe('when the base url only contains a domain name ending with /', () => {
    const baseUrl = 'http://localhost:3000/';

    it('should correctly append the path if it does not start with a /', () => {
      expect.assertions(1);
      expect(joinUrl(baseUrl, 'forest/authentication')).toStrictEqual(`${baseUrl}forest/authentication`);
    });

    it('should correctly append the path if it starts with a /', () => {
      expect.assertions(1);
      expect(joinUrl(baseUrl, '/forest/authentication')).toStrictEqual(`${baseUrl}forest/authentication`);
    });
  });

  describe('when the base url contains a domain name and a path not ending with /', () => {
    const baseUrl = 'http://localhost:3000/prefix';

    it('should correctly append the path if it does not start with a /', () => {
      expect.assertions(1);
      expect(joinUrl(baseUrl, 'forest/authentication')).toStrictEqual(`${baseUrl}/forest/authentication`);
    });

    it('should correctly append the path if it starts with a /', () => {
      expect.assertions(1);
      expect(joinUrl(baseUrl, '/forest/authentication')).toStrictEqual(`${baseUrl}/forest/authentication`);
    });
  });

  describe('when the base url contains a domain name and a path ending with /', () => {
    const baseUrl = 'http://localhost:3000/prefix/';

    it('should correctly append the path if it does not start with a /', () => {
      expect.assertions(1);
      expect(joinUrl(baseUrl, 'forest/authentication')).toStrictEqual(`${baseUrl}forest/authentication`);
    });

    it('should correctly append the path if it starts with a /', () => {
      expect.assertions(1);
      expect(joinUrl(baseUrl, '/forest/authentication')).toStrictEqual(`${baseUrl}forest/authentication`);
    });
  });
});
