import Link from 'next/link';

const HomePage = () => (
  <main className='flex flex-1 flex-col justify-center text-center'>
    <h1 className='mb-4 text-2xl font-bold'>Hello World</h1>
    <p className='text-fd-muted-foreground'>
      You can open{' '}
      <Link
        href='/docs/introduction/what-is-mock-config-server'
        className='text-fd-foreground font-semibold underline'
      >
        /docs
      </Link>{' '}
      and see the documentation.
    </p>
  </main>
);

export default HomePage;
