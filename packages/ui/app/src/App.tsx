import { Header, Sidebar } from '@/components';
import { getDefaultScheme } from '@/utils/helpers';
import { useApiStatus, useMockServerConfig } from '@/utils/hooks';

import { ComponentsList } from './components/ComponentsList/ComponentsList';
import { Providers } from './provider';

interface AppProps {
  payload: Payload;
}

const App = (props: AppProps) => {
  const config = useMockServerConfig(props.payload);
  const { serverStatus } = useApiStatus();

  const defaultScheme = getDefaultScheme();

  return (
    <Providers scheme={{ defaultScheme }}>
      <div className='flex h-screen flex-col bg-background'>
        <Header
          serverStatus={serverStatus}
          serverUrl={`http://localhost:${config.settings.port}${config.settings.baseUrl ?? '/'}`}
          wsStatus={config.status}
        />
        <div className='flex min-h-0 flex-1'>
          <Sidebar components={config.components} />
          <main className='flex-1 overflow-y-auto p-6'>
            <ComponentsList components={config.components} />
          </main>
        </div>
      </div>
    </Providers>
  );
};

export default App;
