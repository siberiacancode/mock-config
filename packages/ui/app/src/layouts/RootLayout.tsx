import { Outlet, useRouteContext } from '@tanstack/react-router';
import { useState } from 'react';

import { Header, Sidebar } from '@/components';
import { ConfigContext } from '@/utils/context';
import { getDefaultScheme } from '@/utils/helpers';
import { useApiStatus, useMockServerConfig } from '@/utils/hooks';

import { Providers } from '../provider';

export const RootLayout = () => {
  const routerContext = useRouteContext({ from: '__root__' });

  const config = useMockServerConfig(routerContext.payload);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const apiStatus = useApiStatus();
  const defaultScheme = getDefaultScheme();

  return (
    <Providers scheme={{ defaultScheme }}>
      <ConfigContext value={config}>
        <div className='flex h-screen flex-col bg-background'>
          <Header
            components={config.components}
            serverStatus={apiStatus.serverStatus}
            serverUrl={`http://localhost:${config.settings.port}${config.settings.baseUrl ?? '/'}`}
            wsStatus={config.status}
            onSidebarToggle={() => setIsSidebarOpen((prevIsSidebarOpen) => !prevIsSidebarOpen)}
          />
          <div className='flex min-h-0 flex-1'>
            <Sidebar
              className={isSidebarOpen ? undefined : 'hidden'}
              components={config.components}
            />
            <main className='min-w-0 flex-1 overflow-y-auto'>
              <Outlet />
            </main>
          </div>
        </div>
      </ConfigContext>
    </Providers>
  );
};
