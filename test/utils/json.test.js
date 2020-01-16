const { prettyPrint } = require('../../src/utils/json');

describe('utils > json', () => {
  it('should prettyPrint simple primitive types', () => {
    expect.assertions(5);
    expect(prettyPrint(1)).toStrictEqual('1');
    expect(prettyPrint('a simple string')).toStrictEqual('"a simple string"');
    expect(prettyPrint(true)).toStrictEqual('true');

    expect(prettyPrint(null)).toStrictEqual('null');
    expect(prettyPrint(undefined)).toStrictEqual('null');
  });

  it('should prettyPrint more complex string', () => {
    expect.assertions(4);
    expect(prettyPrint('.*foo$')).toStrictEqual('".*foo$"');
    expect(prettyPrint('http://somekindofurl.mydomain.com'))
      .toStrictEqual('"http://somekindofurl.mydomain.com"');
    expect(prettyPrint('This text \r\n contains \r\n escaped char'))
      .toStrictEqual('"This text \\r\\n contains \\r\\n escaped char"');
    expect(prettyPrint('\t \r \n \f \b " /'))
      .toStrictEqual('"\\t \\r \\n \\f \\b \\" /"');
  });

  it('should prettyPrint a simple array', () => {
    expect.assertions(1);
    expect(prettyPrint(['a', 'b', 'c'])).toStrictEqual('[\n  "a",\n  "b",\n  "c"\n]');
  });

  it('should prettyPrint a simple object', () => {
    expect.assertions(1);
    expect(prettyPrint({ name: 'John' })).toStrictEqual('{\n  "name": "John"\n}');
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
      .toStrictEqual('[{\n  "name": "John"\n}, {\n  "name": "Sylvia"\n}]');
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
