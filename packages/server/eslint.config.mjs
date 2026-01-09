import { eslint } from '@siberiacancode/eslint';

export default eslint(
  {
    typescript: true
  },
  {
    name: 'mock-config-server/md',
    files: ['**/*.md'],
    rules: {
      'style/max-len': 'off'
    }
  },
  {
    name: 'mock-config-server/typescript',
    rules: {
      'node/prefer-global/process': 'off',
      'ts/no-namespace': 'off'
    }
  }
);
