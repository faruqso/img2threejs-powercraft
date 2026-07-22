export type Route =
  | { name: 'home' }
  | { name: 'about' }
  | { name: 'my-account' }
  | { name: 'archive' }
  | { name: 'demo'; id: string }
  | { name: 'power-bank-customizer' };

/** Parses `location.hash` into a Route. Defaults to home for anything unrecognized. */
export function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  if (!clean || clean === '') {
    return { name: 'home' };
  }
  const parts = clean.split('/').filter(Boolean);
  if (parts[0] === 'demo' && parts[1]) {
    return { name: 'demo', id: parts[1] };
  }
  if (parts[0] === 'customize' && parts[1] === 'power-bank') {
    return { name: 'power-bank-customizer' };
  }
  if (parts[0] === 'about') {
    return { name: 'about' };
  }
  if (parts[0] === 'account') {
    return { name: 'my-account' };
  }
  if (parts[0] === 'archive') {
    return { name: 'archive' };
  }
  return { name: 'home' };
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
