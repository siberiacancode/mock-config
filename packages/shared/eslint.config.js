import { eslint } from '@siberiacancode/eslint';

export default eslint(
  {
    typescript: true
  },
  {
    name: 'mock-config-shared/rewrite',
    rules: {
      'e18e/prefer-static-regex': 'off',
      'node/prefer-global/process': 'off',
      'ts/no-namespace': 'off',
      'ts/no-empty-object-type': 'off'
    }
  }
);
