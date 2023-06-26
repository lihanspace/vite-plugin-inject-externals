module.exports = {
  root: true,
  env: { browser: true, node: true, es2021: true, worker: true },
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        printWidth: 160,
        tabWidth: 2,
        useTabs: false,
        semi: false,
        singleQuote: true,
        quoteProps: 'as-needed',
        jsxSingleQuote: false,
        trailingComma: 'es5',
        bracketSpacing: true,
        bracketSameLine: false,
        arrowParens: 'always',
        endOfLine: 'lf',
        overrides: [
          {
            files: ['*.css', '*.scss', '*.sass'],
            options: {
              singleQuote: false,
            },
          },
        ],
      },
    ],
    '@typescript-eslint/no-explicit-any': ['off'],
    'no-console': ['off'],
    'import/order': ['off'],
  },
}
