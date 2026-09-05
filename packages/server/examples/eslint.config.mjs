import { eslint } from '@siberiacancode/eslint';

export default eslint(
  {
    typescript: true
  },
  {
    name: 'mock-config-server/examples',
    rules: {
      'no-console': 'off'
    }
  }
);
