import { createRoot } from 'react-dom/client';

import App from './App.tsx';

import './assets/styles/global.css';

const getPayload = async (): Promise<Payload> => {
  const response = await fetch('/api/payload');
  if (!response.ok) throw new Error(`Failed to fetch payload: ${response.status}`);
  return (await response.json()) as Payload;
};

const init = async () => {
  const root = createRoot(document.getElementById('root')!);

  try {
    const payload = await getPayload();
    root.render(<App payload={payload} />);
  } catch {
    root.render(
      <div className='flex h-screen flex-col items-center justify-center gap-m bg-background text-foreground'>
        <h1 className='text-xl font-semibold'>Inspector backend is not running</h1>
        <p className='text-foreground-secondary'>
          Start the full dev cycle with <code className='font-code'>pnpm dev</code> and reload the
          page
        </p>
      </div>
    );
  }
};

init();
