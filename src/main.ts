import './styles.css';
import { currentRoute, onRouteChange } from './router';
import { renderHome } from './pages/home';
import { renderAbout } from './pages/about';
import { renderMyAccount } from './pages/my-account';
import { renderArchive } from './pages/archive';
import { renderDemo } from './pages/demo';
import { renderPowerBankCustomizer } from './pages/power-bank-customizer';

const app = document.getElementById('app')!;

let cleanupCurrentRoute: (() => void) | null = null;

function render(): void {
  if (cleanupCurrentRoute) {
    cleanupCurrentRoute();
    cleanupCurrentRoute = null;
  }

  const route = currentRoute();
  if (route.name === 'demo') {
    cleanupCurrentRoute = renderDemo(app, route.id);
  } else if (route.name === 'power-bank-customizer') {
    cleanupCurrentRoute = renderPowerBankCustomizer(app);
  } else if (route.name === 'about') {
    cleanupCurrentRoute = renderAbout(app);
  } else if (route.name === 'my-account') {
    cleanupCurrentRoute = renderMyAccount(app);
  } else if (route.name === 'archive') {
    cleanupCurrentRoute = renderArchive(app);
  } else {
    cleanupCurrentRoute = renderHome(app);
  }
}

onRouteChange(render);
render();
