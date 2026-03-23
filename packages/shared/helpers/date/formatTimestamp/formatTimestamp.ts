export const formatTimestamp = (timestamp: number) =>
  new Date(timestamp).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    fractionalSecondDigits: 3
  });
