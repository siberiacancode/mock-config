export const convertWin32PathToUnix = (win32Path: string) =>
  win32Path
    .replace(/^\\\\\?\\/, '')
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/');
