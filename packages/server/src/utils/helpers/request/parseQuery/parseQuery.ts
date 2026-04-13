export const parseQuery = (requestUrl?: string) => {
  if (!requestUrl) return {};

  const url = new URL(requestUrl, 'http://localhost');
  const query: Record<string, string | string[]> = {};

  for (const [key, value] of url.searchParams.entries()) {
    const previousValue = query[key];

    if (previousValue === undefined) {
      query[key] = value;
      continue;
    }

    if (Array.isArray(previousValue)) {
      previousValue.push(value);
      continue;
    }

    query[key] = [previousValue, value];
  }

  return query;
};
