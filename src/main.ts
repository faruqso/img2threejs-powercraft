import './styles.css';
import { currentRoute, onRouteChange } from './router';
import { renderHome } from './pages/home';
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
  } else {
    cleanupCurrentRoute = renderHome(app);
  }
}

onRouteChange(render);
render();
