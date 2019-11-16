module.exports = {
  root: true,
  'extends': [
    'airbnb-base',
    'plugin:jest/all'
  ],
  plugins: [],
  env: {
    node: true,
  },
  rules: {
    'jest/lowercase-name': ['error', { 'allowedPrefixes': ['DELETE', 'GET', 'POST', 'PUT'] }],
    'jest/no-hooks': [
      'error',
      {
        'allow': ['afterAll', 'afterEach', 'beforeAll', 'beforeEach']
      }
    ],
    'no-console': 0,
    'no-param-reassign': 0,
    'prefer-destructuring': [
      'error',
      {
        VariableDeclarator: {
          array: false,
          object: true,
        },
        AssignmentExpression: {
          array: false,
          object: false,
        },
      },
      {
        enforceForRenamedProperties: false,
      },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        'devDependencies': [
          'bin/*.js',
          'test/**/*.js'
        ]
      }
    ]
  },
};
