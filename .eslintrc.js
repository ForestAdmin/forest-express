module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:jest/all',
    'plugin:sonarjs/recommended',
  ],
  plugins: [
    'sonarjs',
  ],
  env: {
    node: true,
  },
  rules: {
    'sonarjs/cognitive-complexity': 1,
    'sonarjs/no-extra-arguments': 0,
    'sonarjs/no-collapsible-if': 0,
    'sonarjs/no-identical-expressions': 0,
    'sonarjs/no-identical-functions': 0,
    'sonarjs/no-duplicate-string': 0,
    'sonarjs/no-same-line-conditional': 0,
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
