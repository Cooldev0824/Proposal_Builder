/**
 * ESLint Configuration for Proposal Builder
 *
 * This configuration follows modern ESLint practices using the flat config format.
 * It includes specialized rules for JavaScript, TypeScript, and Vue files.
 */

import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import vueParser from 'vue-eslint-parser';
import vuePlugin from 'eslint-plugin-vue';
import globals from 'globals';

export default [
  // Global configuration
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '*.config.js',
      'server/**',
    ],
  },

  // Base JS configuration
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'quotes': ['error', 'double', { 'avoidEscape': true }],
      'semi': ['error', 'always'],
      'indent': ['error', 2],
      'comma-dangle': ['error', 'always-multiline'],
      'arrow-parens': ['error', 'always'],
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-before-function-paren': ['error', {
        'anonymous': 'always',
        'named': 'never',
        'asyncArrow': 'always'
      }],
      'space-before-blocks': ['error', 'always'],
      'keyword-spacing': ['error', { 'before': true, 'after': true }],
      'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 1 }],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
  },

  // TypeScript configuration
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      // Stricter rules for TypeScript
      // Temporarily set to warn to allow gradual fixing
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        'allowExpressions': true,
        'allowTypedFunctionExpressions': true,
        'allowHigherOrderFunctions': true,
        'allowDirectConstAssertionInArrowFunctions': true
      }],
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Warn about unused variables, but allow those prefixed with underscore
      '@typescript-eslint/no-unused-vars': ['warn', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_'
      }],
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      'quotes': ['error', 'double', { 'avoidEscape': true }],
      'semi': ['error', 'always'],
      'indent': ['error', 2],
      'comma-dangle': ['error', 'always-multiline'],
      'arrow-parens': ['error', 'always'],
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-before-function-paren': ['error', {
        'anonymous': 'always',
        'named': 'never',
        'asyncArrow': 'always'
      }],
      'space-before-blocks': ['error', 'always'],
      'keyword-spacing': ['error', { 'before': true, 'after': true }],
      'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 1 }],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
  },

  // Vue configuration
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        parser: tsParser,
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      vue: vuePlugin,
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...vuePlugin.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      'vue/html-indent': ['error', 2],
      'vue/html-closing-bracket-newline': ['error', {
        'singleline': 'never',
        'multiline': 'always'
      }],
      'vue/max-attributes-per-line': ['error', {
        'singleline': 3,
        'multiline': 1
      }],
      // Temporarily set to warn to allow gradual fixing
      'vue/multi-word-component-names': 'warn',
      'vue/no-v-html': 'warn',
      'vue/component-name-in-template-casing': ['warn', 'PascalCase'],
      'vue/component-definition-name-casing': ['warn', 'PascalCase'],
      'vue/match-component-file-name': ['warn', {
        'extensions': ['vue'],
        'shouldMatchCase': true
      }],
      'vue/no-unused-properties': ['warn', {
        'groups': ['props', 'data', 'computed', 'methods', 'setup']
      }],
      'vue/no-unused-refs': 'warn',
      'vue/no-useless-template-attributes': 'warn',
      'vue/prefer-import-from-vue': 'warn',
      'vue/require-explicit-emits': 'warn',
      // Stricter rules for TypeScript in Vue files
      // Temporarily set to warn to allow gradual fixing
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        'allowExpressions': true,
        'allowTypedFunctionExpressions': true,
        'allowHigherOrderFunctions': true,
        'allowDirectConstAssertionInArrowFunctions': true
      }],
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Warn about unused variables, but allow those prefixed with underscore
      '@typescript-eslint/no-unused-vars': ['warn', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_'
      }],
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      'quotes': ['error', 'double', { 'avoidEscape': true }],
      'semi': ['error', 'always'],
      'indent': ['error', 2],
      'comma-dangle': ['error', 'always-multiline'],
      'arrow-parens': ['error', 'always'],
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-before-function-paren': ['error', {
        'anonymous': 'always',
        'named': 'never',
        'asyncArrow': 'always'
      }],
      'space-before-blocks': ['error', 'always'],
      'keyword-spacing': ['error', { 'before': true, 'after': true }],
      'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 1 }],
      // Performance and security rules - temporarily set to warn for gradual fixing
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-alert': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-eval': 'warn',
      'no-implied-eval': 'warn',
      'no-new-func': 'warn',
      'no-param-reassign': 'warn',
      'no-return-assign': 'warn',
      'no-script-url': 'warn',
      'no-self-compare': 'warn',
      'no-sequences': 'warn',
      'no-throw-literal': 'warn',
      'prefer-promise-reject-errors': 'warn',
      'radix': 'warn',
    },
  },
];
