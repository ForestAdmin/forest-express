module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:jest/all'
  ],
  plugins: [],
  env: {
    node: true,
  },
  rules: {
    'jest/no-hooks': 0,
    'implicit-arrow-linebreak': 0,
    'no-param-reassign': 0,
    'no-underscore-dangle': 0,
    'import/no-extraneous-dependencies': [
      'error',
      {
        'devDependencies': [
          '.eslint-bin/*.js',
          'scripts/*.js',
          'test/**/*.js'
        ]
      }
    ],
  },
};
