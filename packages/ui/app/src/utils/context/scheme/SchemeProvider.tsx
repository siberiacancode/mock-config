'use client';

import React from 'react';

import { LOCAL_STORAGE_KEYS, SCHEME } from '@/utils/constants';

import { SchemeContext } from './SchemeContext';

export interface SchemeProviderProps {
  children: React.ReactNode;
  defaultScheme: Scheme;
}

const MEDIA = '(prefers-color-scheme: dark)';

const getSystemScheme = () => (window.matchMedia(MEDIA).matches ? SCHEME.dark : SCHEME.light);

const resolveScheme = (scheme: Scheme) =>
  scheme === 'system' ? getSystemScheme() : (scheme as ResolvedScheme);

export const SchemeProvider = ({ children, defaultScheme }: SchemeProviderProps) => {
  const [scheme, setScheme] = React.useState<Scheme>(defaultScheme);
  const [resolvedScheme, setResolvedScheme] = React.useState<ResolvedScheme>(() =>
    resolveScheme(defaultScheme)
  );

  const switchScheme = (newScheme: Scheme) => {
    const resolved = resolveScheme(newScheme);

    localStorage.setItem(LOCAL_STORAGE_KEYS.SCHEME, newScheme);
    setScheme(newScheme);
    setResolvedScheme(resolved);
    document.documentElement.className = resolved;
  };

  React.useLayoutEffect(() => {
    switchScheme(defaultScheme);
  }, []);

  React.useLayoutEffect(() => {
    if (scheme !== 'system') return;
    const media = window.matchMedia(MEDIA);

    const onChange = () => switchScheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [scheme]);

  const value = React.useMemo(
    () => ({
      scheme,
      resolvedScheme,
      toggleScheme: switchScheme
    }),
    [scheme, resolvedScheme]
  );

  return <SchemeContext.Provider value={value}>{children}</SchemeContext.Provider>;
};
