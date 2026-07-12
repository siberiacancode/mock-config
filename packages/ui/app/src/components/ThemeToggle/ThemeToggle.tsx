import { MoonIcon, SunIcon } from 'lucide-react';

import { useScheme } from '@/utils/context';

export const ThemeToggle = () => {
  const { resolvedScheme, toggleScheme } = useScheme();

  const onThemeClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const newScheme = resolvedScheme === 'dark' ? 'light' : 'dark';

    if (!document.startViewTransition) {
      toggleScheme(newScheme);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const radius = Math.hypot(window.innerWidth, window.innerHeight);

    await document.startViewTransition(() => {
      toggleScheme(newScheme);
    }).ready;

    document.documentElement.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`]
      },
      {
        duration: 700,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)'
      }
    );
  };

  const Icon = resolvedScheme === 'dark' ? SunIcon : MoonIcon;

  return (
    <button
      aria-label='Toggle theme'
      className='flex size-8 cursor-pointer items-center justify-center rounded-md text-foreground-secondary hover:bg-card hover:text-foreground'
      type='button'
      onClick={onThemeClick}
    >
      <Icon className='h-icon-l w-icon-l' />
    </button>
  );
};
