import { eslint } from '@siberiacancode/eslint';

export default eslint(
  {
    typescript: true
  },
  {
    name: 'mock-config-server/md',
    // ✅ important: markdown code blocks are linted as virtual files inside the md path
    files: ['**/*.md', '**/*.md/**'],
    rules: {
      'style/max-len': 'off',
      // ✅ important: readme snippets show config shape, not node import boilerplate
      'node/prefer-global/buffer': 'off'
    }
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
    name: 'mock-config-server/typescript',
    rules: {
      'node/prefer-global/process': 'off',
      'ts/no-namespace': 'off',
      'ts/no-empty-object-type': 'off'
    }
  },
  {
    name: 'mock-config-server/rewrites',
    rules: {
      'no-console': ['warn', { allow: ['info', 'dir', 'warn', 'error'] }]
    }
  }
);
