export function jsonToUrl(json: Record<string, string | object>): string {
  const { url, ...params } = json;
  const queryParams = new URLSearchParams();
  for (const key in params) {
    queryParams.set(key, JSON.stringify(params[key]));
  }
  return `${url}?${queryParams.toString()}`;
}
