export const parseQuery = (requestUrl: string) => {
  const url = new URL(requestUrl, 'http://localhost');
  const query: Record<string, string | string[]> = {};

  for (const [key, value] of url.searchParams.entries()) {
    const currentValue = query[key];

    if (query[key] === undefined) {
      query[key] = value;
      continue;
    }

    if (Array.isArray(currentValue)) {
      currentValue.push(value);
      continue;
    }

    query[key] = [currentValue, value];
  }

  return query;
};
