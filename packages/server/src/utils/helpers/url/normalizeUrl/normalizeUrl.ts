export const normalizeUrl = (url: string) => {
  if (!url || url === '/') return '/';

  const normalizedUrl = url.replace(/\/+$/g, '');

  return normalizedUrl || '/';
};
