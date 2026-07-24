import './styles.css';
import './hero-redesign.css';
import { onRouteChange } from './router';
import { renderPowerBankCustomizer } from './pages/power-bank-customizer';

const app = document.getElementById('app')!;

let cleanupCurrentRoute: (() => void) | null = null;

function render(): void {
  if (cleanupCurrentRoute) {
    cleanupCurrentRoute();
    cleanupCurrentRoute = null;
  }
  cleanupCurrentRoute = renderPowerBankCustomizer(app);
}

onRouteChange(render);
render();