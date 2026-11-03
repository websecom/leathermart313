import OpengraphImage from 'components/opengraph-image';
import { getPage } from 'lib/store';
import { notFound } from 'next/navigation';

export const runtime = 'edge';

export default async function Image({ params }: { params: { page: string } }) {
  const page = await getPage(params.page);
  if (!page) notFound();
  const title = page.seo?.title || page.title;

  return await OpengraphImage({ title });
}
