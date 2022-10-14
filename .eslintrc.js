const BASE_EXTENDS = [
  'airbnb-base',
  'airbnb-typescript/base',
  'plugin:jest/all',
  'plugin:sonarjs/recommended',
];

module.exports = {
  root: true,
  extends: BASE_EXTENDS,
  plugins: [
    'sonarjs',
  ],
  env: {
    node: true,
  },
  ignorePatterns: [
    'dist/**',
    '.eslintrc.js',
    'jest.config.js'
  ],
  rules: {
    '@typescript-eslint/naming-convention': 'off',
    'implicit-arrow-linebreak': 0,
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '.eslint-bin/*.js',
          'test/**/*.js',
        ],
      },
    ],
    'import/extensions': ['error', 'ignorePackages', {
      js: 'never',
      ts: 'never',
    }],
    'jest/max-expects': 'off',
    'jest/max-nested-describe': 'off',
    'jest/require-hook': 'off',
    "jest/prefer-expect-assertions": [
      "error",
      { "onlyFunctionsWithExpectInLoop": true, "onlyFunctionsWithExpectInCallback": true }
    ],
    'no-param-reassign': 0,
    'no-underscore-dangle': 0,
    'sonarjs/cognitive-complexity': 1,
    'sonarjs/no-collapsible-if': 0,
    'sonarjs/no-duplicate-string': 0,
    'sonarjs/no-extra-arguments': 0,
    'sonarjs/no-identical-expressions': 0,
    'sonarjs/no-identical-functions': 0,
    'sonarjs/no-same-line-conditional': 0,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.json', '.ts'],
      },
    },
    'import/extensions': [
      '.js',
      '.ts',
    ],
  },
  overrides: [
    {
      files: ['*.ts'],
      extends: [
        ...BASE_EXTENDS,
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      plugins: [
        'sonarjs',
        '@typescript-eslint',
      ],
      rules: {
        'import/extensions': ['error', 'ignorePackages', {
          js: 'never',
          ts: 'never',
        }],
      },
    },

  ],
};
