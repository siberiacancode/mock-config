import { eslint } from '@siberiacancode/eslint';

/** @type {import('@siberiacancode/eslint').eslint} */
export default eslint(
  {
    typescript: true,
    react: true,
    jsx: true
  },
  {
    ignores: ['**/*.css']
  },
  {
    name: 'mock-config-inspector/typescript',
    rules: {
      'node/prefer-global/process': 'off'
    }
  }
);
