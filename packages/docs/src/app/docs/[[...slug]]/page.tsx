import type { Metadata } from 'next';

import { createRelativeLink } from 'fumadocs-ui/mdx';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';

import { getPageImage, source } from '@/lib/source';
import { getMDXComponents } from '@/mdx-components';

type DocsPageProps = PageProps<'/docs/[[...slug]]'>;

export const generateStaticParams = async () => source.generateParams();

export const generateMetadata = async (props: DocsPageProps): Promise<Metadata> => {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url
    }
  };
};

const Page = async (props: DocsPageProps) => {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage full={page.data.full} toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page)
          })}
        />
      </DocsBody>
    </DocsPage>
  );
};

export default Page;
