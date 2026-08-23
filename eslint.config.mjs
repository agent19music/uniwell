import expoConfig from 'eslint-config-expo/flat.js';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  ...expoConfig,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'dist-ui-check-final/**',
      'web-build/**',
      'android/**',
      'ios/**',
      'legacy/**',
      '__tests__/semester/**',
      'visualisation/**',
      'coverage/**',
      'scripts/**',
      'supabase/**',
      'plugins/**',
      'data/**',
      '.agents/**',
    ],
  },
  {
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.object.name='JSON'][callee.property.name='parse']",
          message: 'Use parseJson() from lib/contracts instead of raw JSON.parse in new code.',
        },
      ],
    },
  },
]);
