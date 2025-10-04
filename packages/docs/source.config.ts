import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';
import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from 'fumadocs-mdx/config';
import { transformerTwoslash } from 'fumadocs-twoslash';

export const docs = defineDocs({
  docs: {
    schema: frontmatterSchema
  },
  meta: {
    schema: metaSchema
  }
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      langs: ['tsx', 'ts', 'js', 'jsx', 'json', 'html', 'css', 'md', 'bash'],
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      },
      transformers: [...(rehypeCodeDefaultOptions.transformers ?? []), transformerTwoslash()]
    }
  },
  lastModifiedTime: 'git'
});
