export function renderDesignSystem(mount: HTMLElement): () => void {
  const container = document.createElement('div');
  container.className = 'customizer-page design-system-page';
  container.style.cssText = 'min-height: 100vh; overflow-y: auto; padding: 2rem 3rem 6rem; background: var(--bg); color: var(--text); position: relative;';

  container.innerHTML = `
    <header style="max-width: 1100px; margin: 0 auto 3rem; display: flex; align-items: center; justify-content: space-between; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(0, 0, 0, 0.08);">
      <div>
        <a href="#/account" class="back-link" style="text-decoration: none; color: #0dc9b1; font-weight: 600; font-size: 0.9rem;">&larr; Back to My Account</a>
        <h1 class="page-title" style="margin: 0.5rem 0 0.25rem; font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em;">Shadcn Design System</h1>
        <p class="page-subtitle" style="margin: 0; color: #64748b; font-size: 1rem;">Visual tokens, component primitives, swatches, and style patterns.</p>
      </div>
      <button id="ds-theme-toggle" type="button" class="profile-btn" aria-label="Toggle theme" style="cursor: pointer; padding: 0.6rem 1.2rem; border-radius: 99px; border: 1px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.04); font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        <span>Toggle Theme</span>
      </button>
    </header>

    <main style="max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 3rem;">
      <!-- Color Tokens Section -->
      <section>
        <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 1rem; border-bottom: 2px solid #0dc9b1; display: inline-block; padding-bottom: 0.2rem;">Color Palette & Tokens</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; margin-top: 1rem;">
          <div class="customizer-card" style="padding: 1.2rem;">
            <div style="height: 60px; border-radius: 10px; background: #0dc9b1; margin-bottom: 0.75rem; box-shadow: 0 4px 12px rgba(13, 201, 177, 0.25);"></div>
            <strong style="display: block; font-size: 0.95rem;">Primary Teal</strong>
            <code style="font-size: 0.8rem; color: #64748b;">#0dc9b1 / var(--teal-vibrant)</code>
          </div>
          <div class="customizer-card" style="padding: 1.2rem;">
            <div style="height: 60px; border-radius: 10px; background: #00e6cb; margin-bottom: 0.75rem; box-shadow: 0 4px 12px rgba(0, 230, 203, 0.25);"></div>
            <strong style="display: block; font-size: 0.95rem;">Dark Mode Teal</strong>
            <code style="font-size: 0.8rem; color: #64748b;">#00e6cb / var(--teal-dark-mode)</code>
          </div>
          <div class="customizer-card" style="padding: 1.2rem;">
            <div style="height: 60px; border-radius: 10px; background: #202126; border: 1px solid rgba(255,255,255,0.2); margin-bottom: 0.75rem;"></div>
            <strong style="display: block; font-size: 0.95rem;">Graphite Finish</strong>
            <code style="font-size: 0.8rem; color: #64748b;">#202126 (0x202126)</code>
          </div>
          <div class="customizer-card" style="padding: 1.2rem;">
            <div style="height: 60px; border-radius: 10px; background: #8a929b; margin-bottom: 0.75rem;"></div>
            <strong style="display: block; font-size: 0.95rem;">Metallic Chrome</strong>
            <code style="font-size: 0.8rem; color: #64748b;">#8a929b (0x8a929b)</code>
          </div>
        </div>
      </section>

      <!-- Components Section -->
      <section>
        <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 1rem; border-bottom: 2px solid #0dc9b1; display: inline-block; padding-bottom: 0.2rem;">Shadcn UI Component Primitives</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
          <!-- Card 1: Buttons & Badges -->
          <div class="customizer-card" style="padding: 1.5rem;">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0 0 1rem;">Buttons & Badges</h3>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <button class="btn-primary" type="button" style="width: 100%; justify-content: center;">
                Primary CTA Button
              </button>
              <button class="card-done-btn" type="button" style="display: block; width: 100%;">
                Card Action Done
              </button>
              <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
                <span class="port-status-badge">Wireless Only</span>
                <span class="port-status-badge">1 Port</span>
                <span class="eyebrow-tag" style="color: #0dc9b1; font-weight: 700; font-size: 0.75rem;">SPECIAL FEATURE</span>
              </div>
            </div>
          </div>

          <!-- Card 2: Quantity Stepper & Inputs -->
          <div class="customizer-card" style="padding: 1.5rem;">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0 0 1rem;">Quantity Stepper & Inputs</h3>
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
              <div class="quantity-picker-row" style="margin: 0;">
                <span class="row-label info-label">Order Quantity</span>
                <div class="qty-control">
                  <button type="button" class="qty-btn" id="ds-qty-minus">-</button>
                  <input type="number" id="ds-qty-val" value="50" min="50" step="50" readonly />
                  <button type="button" class="qty-btn" id="ds-qty-plus">+</button>
                </div>
              </div>

              <label class="text-control">
                <span class="input-label">Inscription Input (Max 10)</span>
                <input type="text" value="PowerCraft" maxlength="10" />
              </label>
            </div>
          </div>

          <!-- Card 3: Color Swatches -->
          <div class="customizer-card" style="padding: 1.5rem;">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0 0 1rem;">Swatches & Selectors</h3>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div style="display: flex; gap: 1rem; align-items: center;">
                <span class="row-label" style="min-width: 80px;">Finish:</span>
                <div class="body-swatch-grid" style="display: flex; gap: 0.75rem;">
                  <label class="swatch-option">
                    <span class="swatch" style="--swatch-color:#202126;"></span>
                  </label>
                  <label class="swatch-option">
                    <span class="swatch" style="--swatch-color:#d9dde2;"></span>
                  </label>
                  <label class="swatch-option">
                    <span class="swatch" style="--swatch-color:#182a3d;"></span>
                  </label>
                  <label class="swatch-option">
                    <span class="swatch" style="--swatch-color:#c5b7a3;"></span>
                  </label>
                </div>
              </div>

              <div style="display: flex; gap: 1rem; align-items: center;">
                <span class="row-label" style="min-width: 80px;">USB Tongue:</span>
                <div class="usb-swatch-grid" style="display: flex; gap: 0.75rem;">
                  <label class="label-swatch">
                    <span class="swatch" style="--swatch-color:#00bdff;"></span>
                    <span class="swatch-label">Cyan</span>
                  </label>
                  <label class="label-swatch">
                    <span class="swatch" style="--swatch-color:#65ff52;"></span>
                    <span class="swatch-label">Lime</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 4: Product Benefits -->
          <div class="customizer-card" style="padding: 1.5rem;">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0 0 1rem;">Benefits Bar Component</h3>
            <div class="left-benefits" style="margin: 0;">
              <div class="left-benefit"><span class="left-benefit-icon">&#9670;</span><span>Premium<br>Build</span></div>
              <div class="left-benefit"><span class="left-benefit-icon">&#9889;</span><span>Safe<br>Charging</span></div>
              <div class="left-benefit"><span class="left-benefit-icon">&#9992;</span><span>Travel<br>Friendly</span></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  `;

  mount.replaceChildren(container);

  // Stepper interactivity
  const qtyInput = container.querySelector<HTMLInputElement>('#ds-qty-val');
  const qtyMinus = container.querySelector<HTMLButtonElement>('#ds-qty-minus');
  const qtyPlus = container.querySelector<HTMLButtonElement>('#ds-qty-plus');

  if (qtyInput && qtyMinus && qtyPlus) {
    qtyMinus.addEventListener('click', () => {
      let val = Number(qtyInput.value) || 50;
      val = Math.max(50, val - 50);
      qtyInput.value = String(val);
    });
    qtyPlus.addEventListener('click', () => {
      let val = Number(qtyInput.value) || 50;
      val += 50;
      qtyInput.value = String(val);
    });
  }

  // Theme toggle
  const themeToggle = container.querySelector<HTMLButtonElement>('#ds-theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      container.classList.toggle('dark-mode');
    });
  }

  return () => {
    container.remove();
  };
}
