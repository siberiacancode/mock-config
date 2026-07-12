export const getConfigLabel = (config: MockServerComponent['configs'][number]) => {
  if ('path' in config) return String(config.path);
  if ('identifier' in config) return String(config.identifier);
  if ('type' in config) return config.type === 'raw' ? 'raw' : 'connection';
  return 'unknown';
};
