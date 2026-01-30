import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        YT: 'readonly', // YouTube IFrame API global
      },
    },
    rules: {
      // Best practices
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-var': 'error',

      // Style consistency
      eqeqeq: ['warn', 'always'],
      curly: ['warn', 'multi-line'],
      'no-multi-spaces': 'warn',

      // ES6+
      'arrow-body-style': ['warn', 'as-needed'],
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',

      // Error prevention
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-duplicate-imports': 'error',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.min.js'],
  },
];
