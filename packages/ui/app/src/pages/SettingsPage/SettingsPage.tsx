import { useNavigate, useSearch } from '@tanstack/react-router';

import { SearchInput, Typography } from '@/components';
import { useConfig } from '@/utils/context';
import { getConfigTransport, getRoutesCount, getTransports } from '@/utils/helpers';

interface SettingsField {
  label: string;
  value: string;
  wide?: boolean;
}

interface SettingsSection {
  fields: SettingsField[];
  isEnabled?: boolean;
  title: string;
}

export const SettingsPage = () => {
  const { components, settings } = useConfig();
  const search = useSearch({ from: '/settings' });
  const navigate = useNavigate({ from: '/settings' });

  const query = search.query ?? '';

  const onSearchChange = (value: string) =>
    navigate({ to: '.', search: { query: value || undefined }, replace: true });

  const transports = getTransports(components);
  const isWsEnabled = components.some((component) =>
    component.configs.some((config) => getConfigTransport(config)?.isRealtime)
  );

  const sections: SettingsSection[] = [
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

  const filteredSections = sections
    .map((section) => ({
      ...section,
      fields: section.fields.filter((field) =>
        field.label.toLowerCase().includes(query.toLowerCase())
      )
    }))
    .filter((section) => section.fields.length > 0);

  return (
    <div className='flex max-w-2xl flex-col gap-l p-7'>
      <div className='flex flex-col gap-1'>
        <Typography variant='h1'>mock-config-server</Typography>
        <Typography className='text-foreground-secondary'>
          Runtime configuration of the mock server. All values are read-only — edit them in
          mock-server.config.ts.
        </Typography>
      </div>

      <SearchInput
        label='Find a setting'
        placeholder='Find a setting…'
        value={query}
        onChange={onSearchChange}
      />

      {!filteredSections.length && (
        <Typography className='text-foreground-secondary'>Nothing matches «{query}»</Typography>
      )}

      {filteredSections.map((section) => (
        <div key={section.title} className='flex flex-col gap-3'>
          <div className='flex items-center gap-2'>
            <span className='text-[15px] font-semibold text-foreground'>{section.title}</span>
            {typeof section.isEnabled === 'boolean' && (
              <span
                className={
                  section.isEnabled
                    ? 'rounded-full bg-additional-success/15 px-2 py-0.5 text-[11px] text-additional-success'
                    : 'rounded-full bg-background-secondary px-2 py-0.5 text-[11px] text-foreground-secondary'
                }
              >
                {section.isEnabled ? 'enabled' : 'disabled'}
              </span>
            )}
          </div>

          <div className='grid grid-cols-2 gap-3'>
            {section.fields.map((field) => (
              <div
                key={field.label}
                className={`flex flex-col gap-1.5 ${field.wide ? 'col-span-2' : ''}`}
              >
                <span className='text-xs text-foreground-secondary'>{field.label}</span>
                <span className='rounded-lg border border-border bg-card px-3 py-2 font-code text-[13px] text-foreground-secondary'>
                  {field.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
