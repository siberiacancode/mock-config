import {
  MessageCircleQuestion,
  PanelLeftIcon,
  ServerIcon,
  ServerOffIcon,
  ZapIcon,
  ZapOffIcon
} from 'lucide-react';

import type { ServerStatus } from '@/utils/hooks';

import { getTransports } from '@/utils/helpers';

import { GitHubIcon, LogoIcon, NpmIcon } from '../icons';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';

export type WsStatus = 'closed' | 'connected' | 'connecting' | 'failed';

interface HeaderProps {
  components: MockServerComponent[];
  serverStatus: ServerStatus;
  serverUrl: string;
  wsStatus: WsStatus;
  onSidebarToggle: () => void;
}

const WS_STATUS_LABELS: Record<WsStatus, string> = {
  connected: 'live',
  connecting: 'connecting',
  closed: 'closed',
  failed: 'failed'
};

const WS_STATUS_ICONS: Record<WsStatus, React.ReactElement> = {
  connected: <ZapIcon className='size-3 text-additional-success' />,
  connecting: <ZapIcon className='size-3' />,
  closed: <ZapOffIcon className='size-3' />,
  failed: <ZapOffIcon className='size-3' />
};

const SERVER_STATUS_ICONS: Record<ServerStatus, React.ReactElement> = {
  up: <ServerIcon className='size-3.5 text-additional-success' />,
  down: <ServerOffIcon className='size-3.5' />
};

export const Header = ({
  components,
  serverStatus,
  serverUrl,
  wsStatus,
  onSidebarToggle
}: HeaderProps) => {
  const transports = getTransports(components);

  return (
    <header className='flex h-14 w-full items-center gap-4 border-b border-border bg-background-secondary px-4'>
      <button
        aria-label='Toggle sidebar'
        className='flex size-8 cursor-pointer items-center justify-center rounded-md border border-border text-foreground-secondary hover:bg-card hover:text-foreground'
        type='button'
        onClick={onSidebarToggle}
      >
        <PanelLeftIcon className='size-4' />
      </button>

      <a className='flex items-center gap-2.5' href='/'>
        <LogoIcon />
        <span className='flex flex-col leading-tight'>
          <span className='font-code text-[15px] font-bold'>
            mock-<span className='text-accent'>config</span>
          </span>
          <span className='text-[10px] uppercase tracking-widest text-foreground-secondary'>
            inspector
          </span>
        </span>
      </a>

      <div className='flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground-secondary'>
        {SERVER_STATUS_ICONS[serverStatus]}
        <a
          className={`font-code hover:underline ${serverStatus === 'up' ? 'text-foreground' : 'text-foreground-secondary line-through'}`}
          href={serverUrl}
          rel='noopener noreferrer'
          target='_blank'
        >
          {serverUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
        </a>
        {Boolean(transports.length) && (
          <span className='flex items-center gap-1 border-l border-border pl-2.5'>
            {transports.map((transport) => (
              <span key={transport.label} className='font-code text-[10px] font-semibold'>
                {transport.shortLabel}
              </span>
            ))}
          </span>
        )}
      </div>

      <div className='flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground-secondary'>
        {WS_STATUS_ICONS[wsStatus]}
        ws · {WS_STATUS_LABELS[wsStatus]}
      </div>

      <div className='flex-1' />

      <div className='flex items-center gap-1'>
        <a
          aria-label='mock-config-server on npm'
          className='flex size-8 items-center justify-center rounded-md text-foreground-secondary hover:bg-card hover:text-foreground'
          href='https://npmx.dev/package/mock-config-server'
          rel='noopener noreferrer'
          target='_blank'
        >
          <NpmIcon className='h-icon-m w-icon-m' />
        </a>
        <a
          aria-label='mock-config-server on GitHub'
          className='flex size-8 items-center justify-center rounded-md text-foreground-secondary hover:bg-card hover:text-foreground'
          href='https://github.com/siberiacancode/mock-config-server'
          rel='noopener noreferrer'
          target='_blank'
        >
          <GitHubIcon className='h-icon-m w-icon-m' />
        </a>
        <a
          aria-label='GitHub issues'
          className='flex size-8 items-center justify-center rounded-md text-foreground-secondary hover:bg-card hover:text-foreground'
          href='https://github.com/siberiacancode/mock-config-server/issues'
          rel='noopener noreferrer'
          target='_blank'
        >
          <MessageCircleQuestion className='h-icon-l w-icon-l' />
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
};
