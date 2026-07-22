export function renderAbout(mount: HTMLElement): () => void {
  mount.innerHTML = `
    <div class="about-page light-mesh-bg">
      <header class="global-header">
        <a href="#/" class="header-brand" style="text-decoration:none;">
          <div class="brand-logo">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 2.5H13.5L9.5 10.5H3.5L7 2.5Z" fill="#00C9B1"/>
              <path d="M14.5 13.5H21L17 21.5H11L14.5 13.5Z" fill="#00C9B1"/>
            </svg>
          </div>
          <div class="brand-text">
            <strong>POWERCRAFT</strong>
            <span>CUSTOM. BRANDED. YOURS.</span>
          </div>
        </a>
        <nav class="header-nav">
          <a href="#/">Home</a>
          <a href="#/customize/power-bank">Build</a>
          <a href="#/about" class="active">About</a>
        </nav>
        <div class="header-actions" style="display: flex; align-items: center;">
          <button class="theme-switch" id="about-theme-toggle" title="Toggle dark mode">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
          <div class="header-divider"></div>
          <a href="#/account" class="profile-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            My Account
          </a>
        </div>
      </header>

      <div class="about-content">
        <!-- Hero -->
        <section class="about-hero">
          <span class="home-eyebrow">Our story</span>
          <h1 class="about-hero-title">We make power banks <span class="text-teal">that speak for your brand.</span></h1>
          <p class="about-hero-sub">PowerCraft was founded on the belief that corporate gifting and branded merchandise should be as premium as the brands behind them.</p>
        </section>

        <!-- Mission -->
        <section class="about-section">
          <div class="about-card-row">
            <div class="about-info-card">
              <div class="about-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00c9b1" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              </div>
              <h2>Our mission</h2>
              <p>To give every brand — from nimble startups to global enterprises — access to premium, fully bespoke power bank hardware without the traditional complexity of hardware manufacturing.</p>
            </div>
            <div class="about-info-card">
              <div class="about-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00c9b1" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <h2>Our product</h2>
              <p>We partner exclusively with Anker — the world's #1 charging brand — to deliver MagSafe-compatible, airline-safe power banks with configurations you won't find off the shelf.</p>
            </div>
            <div class="about-info-card">
              <div class="about-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00c9b1" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h2>Our customers</h2>
              <p>Marketing teams, event organisers, product studios and e-commerce brands who understand that a beautifully branded power bank is a product people actually keep and use daily.</p>
            </div>
          </div>
        </section>

        <!-- Process -->
        <section class="about-section">
          <h2 class="about-section-title">How it works</h2>
          <div class="about-process">
            <div class="about-process-step">
              <div class="process-num">01</div>
              <h3>Customise</h3>
              <p>Use our live 3D configurator to choose colour, finish, ports, MagSafe, and engrave your brand in real time.</p>
            </div>
            <div class="about-process-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c9b1" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
            <div class="about-process-step">
              <div class="process-num">02</div>
              <h3>Order</h3>
              <p>Place your order from 50 units. Request a sample unit for £25 before committing to a full production run.</p>
            </div>
            <div class="about-process-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c9b1" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
            <div class="about-process-step">
              <div class="process-num">03</div>
              <h3>Delivered</h3>
              <p>Your branded power banks arrive in 5 to 7 days, laser engraved, packaged and ready to hand out or ship.</p>
            </div>
          </div>
        </section>

        <!-- Values -->
        <section class="about-section about-values-section">
          <h2 class="about-section-title">What we stand for</h2>
          <div class="about-values-grid">
            <div class="about-value">
              <span class="about-value-icon">&#9670;</span>
              <strong>Premium only</strong>
              <p>We don't do cheap white-label hardware. Every unit is Anker-built and quality-tested.</p>
            </div>
            <div class="about-value">
              <span class="about-value-icon">&#9650;</span>
              <strong>Radical transparency</strong>
              <p>Live pricing, no hidden fees, and real lead times — shown before you even place an order.</p>
            </div>
            <div class="about-value">
              <span class="about-value-icon">&#9679;</span>
              <strong>Sustainability</strong>
              <p>Airline-safe capacities, long-lasting hardware and minimal packaging reduce product waste.</p>
            </div>
            <div class="about-value">
              <span class="about-value-icon">&#9733;</span>
              <strong>Brand-first</strong>
              <p>Every configuration choice — colour, port layout, inscription — is designed to serve your brand identity.</p>
            </div>
          </div>
        </section>

        <!-- CTA -->
        <section class="about-cta-section">
          <div class="about-cta-card">
            <h2>Ready to build yours?</h2>
            <p>Start with a live 3D preview and configure your perfect branded power bank in minutes.</p>
            <div class="about-cta-btns">
              <a href="#/customize/power-bank" class="btn-primary home-cta-btn" id="about-cta-build">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Start Customising
              </a>
              <a href="#/account" class="btn-secondary-outline home-cta-btn" id="about-cta-account">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                My Account
              </a>
            </div>
          </div>
        </section>
      </div>

      <footer class="site-footer">
        <div class="footer-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 2.5H13.5L9.5 10.5H3.5L7 2.5Z" fill="#00C9B1"/>
            <path d="M14.5 13.5H21L17 21.5H11L14.5 13.5Z" fill="#00C9B1"/>
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

  const aboutPage = mount.querySelector<HTMLElement>('.about-page')!;
  requestAnimationFrame(() => aboutPage.classList.add('ready'));

  const themeToggle = mount.querySelector<HTMLButtonElement>('#about-theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      aboutPage.classList.toggle('dark-mode');
    });
  }

  return () => { /* no teardown needed */ };
}
