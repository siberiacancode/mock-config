import { eslint } from '@siberiacancode/eslint';

export default eslint(
  {
    typescript: true,
    react: true,
    jsx: true,
    next: true
  },
  {
    name: 'mock-config-docs/rewrites',
    rules: {
      'ts/ban-ts-comment': 'warn'
    }
  }
);
