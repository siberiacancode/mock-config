import {
  MessageCircleQuestion,
  ServerIcon,
  ServerOffIcon,
  ZapIcon,
  ZapOffIcon
} from 'lucide-react';

import type { ServerStatus } from '@/utils/hooks';

import { GitHubIcon, LogoIcon, NpmIcon } from '../icons';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';

export type WsStatus = 'closed' | 'connected' | 'connecting' | 'failed';

interface HeaderProps {
  serverStatus: ServerStatus;
  serverUrl: string;
  wsStatus: WsStatus;
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

const SERVER_STATUS_LABELS: Record<ServerStatus, string> = {
  up: 'server on',
  down: 'server off'
};

export const Header = ({ serverStatus, serverUrl, wsStatus }: HeaderProps) => (
  <header className='flex h-14 w-full items-center gap-4 border-b border-border bg-background-secondary px-5'>
    <a className='flex items-center' href='/'>
      <LogoIcon />
    </a>

    <div className='flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground-secondary'>
      {SERVER_STATUS_ICONS[serverStatus]}
      {SERVER_STATUS_LABELS[serverStatus]}
      <a
        className={`font-code hover:underline ${serverStatus === 'up' ? 'text-foreground' : 'text-foreground-secondary line-through'}`}
        href={serverUrl}
        rel='noopener noreferrer'
        target='_blank'
      >
        {serverUrl}
      </a>
    </div>

    <div className='flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground-secondary'>
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
