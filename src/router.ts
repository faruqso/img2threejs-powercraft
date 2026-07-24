export type Route =
  | { name: 'power-bank-customizer' };

/** Parses `location.hash` into a Route. Always returns power-bank-customizer. */
export function parseRoute(_hash: string): Route {
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

export function navigate(_hash: string): void {
  // No navigation needed - single page
}