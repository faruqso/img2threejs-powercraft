export type Route =
  | { name: 'power-bank-customizer' }
  | { name: 'design-system' };

/** Parses `location.hash` into a Route. Defaults to power-bank-customizer. */
export function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  const parts = clean.split('/').filter(Boolean);
  if (parts[0] === 'design-system') {
    return { name: 'design-system' };
  }
  return { name: 'power-bank-customizer' };
}

export function currentRoute(): Route {
  return parseRoute(window.location.hash);
}

export function onRouteChange(handler: (route: Route) => void): () => void {
  const listener = (): void => handler(currentRoute());
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

export function navigate(hash: string): void {
  window.location.hash = hash;
}
