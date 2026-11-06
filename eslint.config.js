import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'artifacts', '.artifacts']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['src/{apps,shared}/**/*.{js,jsx}'],
    ignores: ['**/*.test.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['**/desktop/**', '**/app/**'],
          message: 'Pass desktop actions through callbacks; apps and shared modules must not import the desktop shell.',
        }],
      }],
    },
  },
  {
    files: ['src/{data,config}/**/*.{js,jsx}'],
    ignores: ['**/*.test.js'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: ['react', 'react-dom'],
        patterns: [{
          group: ['**/apps/**', '**/desktop/**', '**/app/**', '**/shared/**'],
          message: 'Data and application definitions must stay independent from UI components and services.',
        }],
      }],
    },
  },
])
