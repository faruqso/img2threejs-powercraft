import {
  createAnkerMaggoA1618LookDevLights,
  createAnkerMaggoA1618Model,
} from '../demos/anker-maggo-a1618/createAnkerMaggoA1618Model';
import { Viewer } from '../scene';

export function renderHome(mount: HTMLElement): () => void {
  mount.innerHTML = `
    <div class="home-page light-mesh-bg">
      <header class="global-header">
        <a href="#/" class="header-brand" style="text-decoration:none;">
          <div class="brand-logo">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 2.5H13.5L9.5 10.5H3.5L7 2.5Z" fill="#008075"/>
              <path d="M14.5 13.5H21L17 21.5H11L14.5 13.5Z" fill="#008075"/>
            </svg>
          </div>
          <div class="brand-text">
            <strong>POWERCRAFT</strong>
            <span>CUSTOM. BRANDED. YOURS.</span>
          </div>
        </a>
        <nav class="header-nav" aria-label="Main Navigation">
          <a href="#/" class="active">Home</a>
          <a href="#/customize/power-bank">Build</a>
          <a href="#/about">About</a>
        </nav>
        <div class="header-actions" style="display: flex; align-items: center; gap: 0.75rem;">
          <button class="theme-switch" id="home-theme-toggle" title="Toggle dark mode" aria-label="Toggle theme">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
          <div class="header-divider"></div>
          <a href="#/account" class="profile-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            My Account
          </a>
        </div>
      </header>

      <section class="home-hero">
        <div class="home-hero-copy">
          <span class="home-eyebrow">⚡ Powered by Anker MagGo Hardware</span>
          <h1 class="home-hero-title">Custom power banks.<br>Built for <span class="text-teal">your brand.</span></h1>
          <p class="home-hero-sub">Design, customise and order high-performance power banks engineered to showcase your brand identity. Minimum order from 50 units with free laser logo engraving included.</p>
          
          <div class="home-hero-cta">
            <a href="#/customize/power-bank" class="btn-primary home-cta-btn" id="home-cta-customise">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Start 3D Customizer
            </a>
            <a href="#/customize/power-bank" class="btn-secondary-outline home-cta-btn" id="home-cta-order">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              Place Bulk Order
            </a>
          </div>

          <div class="home-stats">
            <div class="home-stat">
              <strong>50+</strong>
              <span>Units MOQ</span>
            </div>
            <div class="home-stat-divider"></div>
            <div class="home-stat">
              <strong>5–7</strong>
              <span>Day lead time</span>
            </div>
            <div class="home-stat-divider"></div>
            <div class="home-stat">
              <strong>Free</strong>
              <span>Laser branding</span>
            </div>
            <div class="home-stat-divider"></div>
            <div class="home-stat">
              <strong>4.9★</strong>
              <span>Customer Rating</span>
            </div>
          </div>
        </div>

        <div class="home-hero-canvas-wrap">
          <div class="home-canvas-glow" aria-hidden="true"></div>
          <div class="home-hero-canvas" id="home-hero-canvas"></div>
          <div class="home-canvas-badge">
            <span class="home-canvas-badge-dot"></span>
            Interactive 3D Preview
          </div>
        </div>
      </section>

      <!-- Trust ticker -->
      <section class="trust-banner">
        <span class="trust-label">Trusted by marketing & product teams at over 500+ companies</span>
        <div class="trust-logos">
          <span class="trust-tag">ACME Corp</span>
          <span class="trust-tag">Starlight Labs</span>
          <span class="trust-tag">Vortex Studio</span>
          <span class="trust-tag">Hyperion HQ</span>
          <span class="trust-tag">Nexus Media</span>
        </div>
      </section>

      <section class="home-features">
        <div class="home-features-grid">
          <div class="home-feature-card">
            <div class="home-feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#008075" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <h3>Full Customisation</h3>
            <p>Choose body finish, gloss level, capacity (5K-120K mAh), wattage output, MagSafe, and custom inscription in real-time 3D.</p>
          </div>
          <div class="home-feature-card">
            <div class="home-feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#008075" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            <h3>Anker MagGo Hardware</h3>
            <p>Built on market-leading Anker power bank engineering featuring fast charging, airline-safe battery options, and multi-port support.</p>
          </div>
          <div class="home-feature-card">
            <div class="home-feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#008075" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h3>Fast Turnaround</h3>
            <p>5 to 7 business day lead time with free laser engraving included. Sample units available for £25 before placing production runs.</p>
          </div>
          <div class="home-feature-card">
            <div class="home-feature-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#008075" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3>Brand Consistency</h3>
            <p>Match your brand colorways precisely, apply crisp laser branding, and hand out products that clients and employees keep for years.</p>
          </div>
        </div>
      </section>

      <footer class="site-footer">
        <div class="footer-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 2.5H13.5L9.5 10.5H3.5L7 2.5Z" fill="#008075"/>
            <path d="M14.5 13.5H21L17 21.5H11L14.5 13.5Z" fill="#008075"/>
          </svg>
          <strong>POWERCRAFT</strong>
        </div>
        <div class="footer-links">
          <a href="#/customize/power-bank">Customise</a>
          <a href="#/about">About</a>
          <a href="#/account">My Account</a>
          <a href="#/archive">Archive</a>
        </div>
        <p class="footer-copy">&copy; 2025 PowerCraft. All rights reserved.</p>
      </footer>
    </div>
  `;

  const homePage = mount.querySelector<HTMLElement>('.home-page')!;
  requestAnimationFrame(() => homePage.classList.add('ready'));

  // Spin up the 3D preview
  const canvasMount = mount.querySelector<HTMLElement>('#home-hero-canvas')!;
  const viewer = new Viewer(canvasMount, {
    cameraPosition: [-4.5, 1.2, 9.5],
    cameraTarget: [0, 0.2, 0],
    cameraFov: 36,
    installLights: (scene) => scene.add(createAnkerMaggoA1618LookDevLights()),
  });
  const model = createAnkerMaggoA1618Model({ shadows: true, rotationSpeed: 0.025 });
  viewer.scene.add(model);

  let raf = 0;
  let lastT = 0;
  const tick = (t: number): void => {
    const dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;
    if (model.userData.tick) model.userData.tick(dt);
    viewer.controls.update();
    viewer.renderer.render(viewer.scene, viewer.camera);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame((t) => { lastT = t; raf = requestAnimationFrame(tick); });

  // Dark mode toggle
  const themeToggle = mount.querySelector<HTMLButtonElement>('#home-theme-toggle');
  if (themeToggle && homePage) {
    themeToggle.addEventListener('click', () => {
      homePage.classList.toggle('dark-mode');
    });
  }

  return () => {
    cancelAnimationFrame(raf);
    viewer.renderer.dispose();
    viewer.controls.dispose();
  };
}
