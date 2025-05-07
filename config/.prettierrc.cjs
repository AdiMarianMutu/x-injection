/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
module.exports = {
  arrowParens: 'always',
  bracketSpacing: true,
  embeddedLanguageFormatting: 'auto',
  endOfLine: 'auto',
  htmlWhitespaceSensitivity: 'css',
  insertPragma: false,
  bracketSameLine: true,
  printWidth: 120,
  proseWrap: 'preserve',
  quoteProps: 'preserve',
  trailingComma: 'es5',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  importOrder: [
    '',
    // SCSS and CSS absolute imports at the top
    '^.+\\.(scss|css)$',
    // SCSS and CSS relative imports at the top sorted by import deepness
    '^(\\.\\./)+[^/]+\\.(scss|css)$',
    '',
    '<BUILTIN_MODULES>',
    '<THIRD_PARTY_MODULES>',
    '',
    // Relative imports sorted by import deepness
    '^(\\.\\./)+[^/]+',
    // Current directory imports (e.g., ./my-lib)
    '^\\./',
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderSeparation: true,
  importOrderTypeScriptVersion: '5.0.0',
  importOrderCaseSensitive: false,
};
