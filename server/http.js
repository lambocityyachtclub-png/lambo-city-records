export function toWebHeaders(nodeHeaders = {}) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.filter(item => typeof item === "string").join(", "));
  }
  return headers;
}
