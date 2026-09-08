import { eslint } from '@siberiacancode/eslint';

export default eslint(
  {
    typescript: true
  },
  {
    // ✅ important:
    // @siberiacancode/eslint enables these js only unicorn rules without a files filter,
    // and eslint 10 errors out when a rule does not support the json language
    name: 'mock-config-server/json',
    files: ['**/*.json', '**/*.json5', '**/*.jsonc'],
    rules: {
      'unicorn/no-typeof-undefined': 'off',
      'unicorn/no-useless-spread': 'off'
    }
  },
  {
    name: 'mock-config-server/examples',
    rules: {
      'no-console': 'off'
    }
  }
);
