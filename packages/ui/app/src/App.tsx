import { Header } from '@/components';
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
      <div className='flex flex-col bg-background items-center gap-xl'>
        <Header
          serverStatus={serverStatus}
          serverUrl={`http://localhost:${config.settings.port}${config.settings.baseUrl ?? '/'}`}
          wsStatus={config.status}
        />
        <ComponentsList components={config.components} />
      </div>
    </Providers>
  );
};

export default App;
