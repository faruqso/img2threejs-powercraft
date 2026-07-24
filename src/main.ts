import './styles.css';
import './hero-redesign.css';
import { currentRoute, onRouteChange } from './router';
import { renderPowerBankCustomizer } from './pages/power-bank-customizer';
import { renderDesignSystem } from './pages/design-system';

const app = document.getElementById('app')!;

let cleanupCurrentRoute: (() => void) | null = null;

function render(): void {
  if (cleanupCurrentRoute) {
    cleanupCurrentRoute();
    cleanupCurrentRoute = null;
  }

  const route = currentRoute();
  if (route.name === 'design-system') {
    cleanupCurrentRoute = renderDesignSystem(app);
  } else {
    cleanupCurrentRoute = renderPowerBankCustomizer(app);
  }
}

onRouteChange(render);
render();
