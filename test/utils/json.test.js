const { prettyPrint } = require('../../src/utils/json');

describe('utils > json', () => {
  it('should prettyPrint simple primitive types', () => {
    expect.assertions(5);
    expect(prettyPrint(1)).toBe('1');
    expect(prettyPrint('a simple string')).toBe('"a simple string"');
    expect(prettyPrint(true)).toBe('true');

    expect(prettyPrint(null)).toBe('null');
    expect(prettyPrint(undefined)).toBe('null');
  });

  it('should prettyPrint more complex string', () => {
    expect.assertions(4);
    expect(prettyPrint('.*foo$')).toBe('".*foo$"');
    expect(prettyPrint('http://somekindofurl.mydomain.com'))
      .toBe('"http://somekindofurl.mydomain.com"');
    expect(prettyPrint('This text \r\n contains \r\n escaped char'))
      .toBe('"This text \\r\\n contains \\r\\n escaped char"');
    expect(prettyPrint('\t \r \n \f \b " /'))
      .toBe('"\\t \\r \\n \\f \\b \\" /"');
  });

  it('should prettyPrint a simple array', () => {
    expect.assertions(1);
    expect(prettyPrint(['a', 'b', 'c'])).toBe('[\n  "a",\n  "b",\n  "c"\n]');
  });

  it('should prettyPrint a simple object', () => {
    expect.assertions(1);
    expect(prettyPrint({ name: 'John' })).toBe('{\n  "name": "John"\n}');
  });

  it('should prettyPrint a regexp string', () => {
    expect.assertions(3);
    const regExp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/g.toString();
    const prettyPrintedRegExp = prettyPrint(regExp);
    // NOTICE: On regex, `prettyPrint` & `JSON.stringify` should produce the same result.
    expect(prettyPrintedRegExp).toStrictEqual(JSON.stringify(regExp));
    expect(() => JSON.parse(prettyPrintedRegExp)).not.toThrow();
    expect(JSON.parse(prettyPrintedRegExp)).toStrictEqual(regExp);
  });

  it('should prettyPrint a simple array of objects', () => {
    expect.assertions(1);
    const prettyPrintedObjectArray = prettyPrint([{ name: 'John' }, { name: 'Sylvia' }]);

    expect(prettyPrintedObjectArray)
      .toBe('[{\n  "name": "John"\n}, {\n  "name": "Sylvia"\n}]');
  });

  it('should prettyPrint a complex object', () => {
    expect.assertions(7);
    const obj = {
      id: 1,
      fullname: 'John smith',
      profile: 'https://mysocialnetwork.mydomain.com/johnsmith',
      isAvailable: false,
      extras: {
        languages: ['js', 'C', 'C++'],
        caution: '\nw00t//',
      },
    };
    const prettyPrintedObject = prettyPrint(obj);

    expect(prettyPrintedObject)
      .toStrictEqual(expect.stringContaining('"id": 1,'));
    expect(prettyPrintedObject)
      .toStrictEqual(expect.stringContaining('"fullname": "John smith",'));
    expect(prettyPrintedObject)
      .toStrictEqual(
        expect.stringContaining('"profile": "https://mysocialnetwork.mydomain.com/johnsmith",'),
      );
    expect(prettyPrintedObject)
      .toStrictEqual(expect.stringContaining('"isAvailable": false,'));
    expect(prettyPrintedObject)
      .toStrictEqual(expect.stringContaining('    "languages": [\n      "js",\n      "C",\n      "C++"\n    ],'));
    expect(prettyPrintedObject)
      .toStrictEqual(expect.stringContaining('    "caution": "\\nw00t//"'));

    expect(JSON.parse(prettyPrintedObject)).toStrictEqual(obj);
  });
});
