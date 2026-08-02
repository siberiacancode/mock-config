import { getConfigTransport, getRoutesCount, getTransports } from '@/utils/helpers';

import type { SettingsSection } from './types';

export const getSettingsSections = (
  components: MockServerComponent[],
  settings: MockServerSettings
): SettingsSection[] => {
  const transports = getTransports(components);
  const isWsEnabled = components.some((component) =>
    component.configs.some((config) => getConfigTransport(config)?.isRealtime)
  );

  return [
    {
      title: 'Server',
      fields: [
        { label: 'Base URL', value: String(settings.baseUrl ?? '/') },
        { label: 'Port', value: String(settings.port) },
        { label: 'Server URL', value: `http://localhost:${settings.port}`, wide: true }
      ]
    },
    {
      title: 'Overview',
      fields: [
        { label: 'Components', value: String(components.length) },
        { label: 'Total routes', value: String(getRoutesCount(components)) },
        {
          label: 'Transports',
          value: transports.map((transport) => transport.label).join(', ') || '—',
          wide: true
        }
      ]
    },
    {
      title: 'WebSocket',
      isEnabled: isWsEnabled,
      fields: [{ label: 'WebSocket URL', value: `ws://localhost:${settings.port}`, wide: true }]
    }
  ];
};

export const filterSettingsSections = (sections: SettingsSection[], query: string) =>
  sections
    .map((section) => ({
      ...section,
      fields: section.fields.filter((field) =>
        field.label.toLowerCase().includes(query.toLowerCase())
      )
    }))
    .filter((section) => section.fields.length > 0);
