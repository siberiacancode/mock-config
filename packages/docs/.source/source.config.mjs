// source.config.ts
import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";
import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from "fumadocs-mdx/config";
import { transformerTwoslash } from "fumadocs-twoslash";
var docs = defineDocs({
  docs: {
    schema: frontmatterSchema
  },
  meta: {
    schema: metaSchema
  }
});
var source_config_default = defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      langs: ["tsx", "ts", "js", "jsx", "json", "html", "css", "md", "bash"],
      themes: {
        light: "github-light",
        dark: "github-dark"
      },
      transformers: [...rehypeCodeDefaultOptions.transformers ?? [], transformerTwoslash()]
    }
  }
});
export {
  source_config_default as default,
  docs
};
