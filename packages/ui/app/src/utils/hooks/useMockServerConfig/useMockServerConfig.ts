import { useWebSocket } from '@siberiacancode/reactuse';
import { useState } from 'react';

import { mergeComponentConfigs } from '@/utils/helpers';

const DEFAULT_SETTINGS: MockServerSettings = { baseUrl: '/', port: 31299 };

const parseMockServerConfig = (config: MockServerConfig) => {
  const [option, ...components] = config;
  const settings = option && !('configs' in option) ? option : undefined;

  return {
    settings,
    components: mergeComponentConfigs(settings ? components : (config as MockServerComponent[]))
  };
};

export const useMockServerConfig = (payload: Payload) => {
  const initial = parseMockServerConfig(payload.config);

  const [settings, setSettings] = useState<MockServerSettings>({
    ...DEFAULT_SETTINGS,
    ...initial.settings
  });
  const [components, setComponents] = useState(initial.components);

  const webSocket = useWebSocket(`ws://${location.hostname}:${payload.ws.port}`, {
    onMessage: (event) => {
      const message = JSON.parse(event.data) as WebSocketMessage;
      if (message.type !== 'config-updated') return;

      const { settings, components } = parseMockServerConfig(message.payload.config);

      setSettings({ ...DEFAULT_SETTINGS, ...settings });
      setComponents(components);
    }
  });

  return { settings, components, status: webSocket.status };
};
