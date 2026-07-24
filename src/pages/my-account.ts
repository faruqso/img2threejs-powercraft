type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';

const MOCK_ORDERS: Array<{
  id: string;
  date: string;
  items: string;
  qty: number;
  total: string;
  status: OrderStatus;
}> = [
  { id: 'PC-00412', date: '18 Jul 2025', items: 'Anker MagGo 5K — Graphite, MagSafe, USB-C', qty: 100, total: '£1,450.00', status: 'delivered' },
  { id: 'PC-00398', date: '02 Jul 2025', items: 'Anker MagGo 10K — Midnight Blue, USB-C + USB-A', qty: 50, total: '£1,025.00', status: 'shipped' },
  { id: 'PC-00351', date: '14 Jun 2025', items: 'Anker MagGo 5K — Sand, No MagSafe, USB-C', qty: 50, total: '£725.00', status: 'delivered' },
  { id: 'PC-00312', date: '29 May 2025', items: 'Anker MagGo 20K — Silver, MagSafe + USB-C', qty: 200, total: '£5,800.00', status: 'delivered' },
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function renderMyAccount(mount: HTMLElement): () => void {
  const ordersHTML = MOCK_ORDERS.map(order => `
    <div class="account-order-row">
      <div class="order-row-meta">
        <span class="order-id">#${order.id}</span>
        <span class="order-date">${order.date}</span>
      </div>
      <div class="order-row-desc">${order.items} &times; ${order.qty}</div>
      <div class="order-row-right">
        <strong class="order-total">${order.total}</strong>
        <span class="order-status-badge status-${order.status}">${STATUS_LABELS[order.status]}</span>
      </div>
    </div>
  `).join('');

  mount.innerHTML = `
    <div class="account-page light-mesh-bg">
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
          <a href="#/customize/power-bank">Build</a>
          <a href="#/about">About</a>
        </nav>
        <div class="header-actions" style="display: flex; align-items: center;">
          <button class="theme-switch" id="account-theme-toggle" title="Toggle dark mode">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
          <div class="header-divider"></div>
          <a href="#/account" class="profile-btn active-profile">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            My Account
          </a>
        </div>
      </header>

      <div class="account-content">

        <!-- Sidebar -->
        <aside class="account-sidebar">
          <div class="account-avatar-block">
            <div class="account-avatar" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <strong class="account-name">Acme Corp</strong>
              <span class="account-email">hello@acmecorp.com</span>
            </div>
          </div>
          <nav class="account-nav">
            <a href="#/account" class="account-nav-item active" id="nav-orders">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              Orders
            </a>
            <a href="#/account" class="account-nav-item" id="nav-designs">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Saved Designs
            </a>
            <a href="#/account" class="account-nav-item" id="nav-profile">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Profile
            </a>
            <a href="#/account" class="account-nav-item" id="nav-billing">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Billing
            </a>
          </nav>
          <a href="#/customize/power-bank" class="btn-primary account-sidebar-cta" id="account-new-order">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Order
          </a>
        </aside>

        <!-- Main -->
        <main class="account-main">

          <!-- Stats row -->
          <div class="account-stats-row">
            <div class="account-stat-card">
              <span class="account-stat-label">Total orders</span>
              <strong class="account-stat-val">4</strong>
            </div>
            <div class="account-stat-card">
              <span class="account-stat-label">Units ordered</span>
              <strong class="account-stat-val">400</strong>
            </div>
            <div class="account-stat-card">
              <span class="account-stat-label">Total spend</span>
              <strong class="account-stat-val">£9,000</strong>
            </div>
            <div class="account-stat-card">
              <span class="account-stat-label">Active orders</span>
              <strong class="account-stat-val text-teal">1</strong>
            </div>
          </div>

          <!-- Orders -->
          <div class="account-panel" id="panel-orders">
            <div class="account-panel-header">
              <h2>Recent Orders</h2>
              <span class="account-panel-count">4 orders</span>
            </div>
            <div class="account-orders-list">
              ${ordersHTML}
            </div>
          </div>

          <!-- Saved designs -->
          <div class="account-panel" id="panel-designs">
            <div class="account-panel-header">
              <h2>Saved Designs</h2>
              <a href="#/customize/power-bank" class="account-panel-action">+ New design</a>
            </div>
            <div class="account-designs-grid">
              <div class="account-design-card" id="design-1">
                <div class="design-card-preview" style="background: linear-gradient(135deg, #1a1c22 60%, #008075 100%);">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"><rect x="2" y="7" width="14" height="10" rx="2"/><path d="M16 11h2a2 2 0 0 1 0 4h-2"/></svg>
                </div>
                <div class="design-card-info">
                  <strong>Graphite MagSafe 5K</strong>
                  <span>Saved 10 Jul 2025</span>
                </div>
                <a href="#/customize/power-bank" class="design-card-edit">Edit in 3D</a>
              </div>
              <div class="account-design-card" id="design-2">
                <div class="design-card-preview" style="background: linear-gradient(135deg, #1b2a3b 60%, #4fa8e8 100%);">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"><rect x="2" y="7" width="14" height="10" rx="2"/><path d="M16 11h2a2 2 0 0 1 0 4h-2"/></svg>
                </div>
                <div class="design-card-info">
                  <strong>Midnight Blue 10K</strong>
                  <span>Saved 28 Jun 2025</span>
                </div>
                <a href="#/customize/power-bank" class="design-card-edit">Edit in 3D</a>
              </div>
              <div class="account-design-card account-design-new" id="design-new">
                <a href="#/customize/power-bank" class="design-new-link">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#008075" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>New design</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Profile & Billing -->
          <div class="account-two-col">
            <div class="account-panel" id="panel-profile">
              <div class="account-panel-header">
                <h2>Profile Information</h2>
                <button class="account-panel-action" id="edit-profile-btn">Edit</button>
              </div>
              <div class="account-profile-fields">
                <div class="account-field">
                  <span class="field-label">Company</span>
                  <span class="field-val">Acme Corp</span>
                </div>
                <div class="account-field">
                  <span class="field-label">Email</span>
                  <span class="field-val">hello@acmecorp.com</span>
                </div>
                <div class="account-field">
                  <span class="field-label">Phone</span>
                  <span class="field-val">+44 7700 900123</span>
                </div>
                <div class="account-field">
                  <span class="field-label">Shipping</span>
                  <span class="field-val">12 High St, London, EC1A 1AA</span>
                </div>
              </div>
            </div>
            <div class="account-panel" id="panel-billing">
              <div class="account-panel-header">
                <h2>Billing Method</h2>
                <button class="account-panel-action" id="edit-billing-btn">Edit</button>
              </div>
              <div class="account-profile-fields">
                <div class="account-field">
                  <span class="field-label">Method</span>
                  <span class="field-val">Visa •••• 4242</span>
                </div>
                <div class="account-field">
                  <span class="field-label">Expires</span>
                  <span class="field-val">08 / 2027</span>
                </div>
                <div class="account-field">
                  <span class="field-label">Billing address</span>
                  <span class="field-val">Same as shipping</span>
                </div>
                <div class="account-field">
                  <span class="field-label">VAT number</span>
                  <span class="field-val">GB 123 4567 89</span>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>

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

  const accountPage = mount.querySelector<HTMLElement>('.account-page')!;
  requestAnimationFrame(() => accountPage.classList.add('ready'));

  const themeToggle = mount.querySelector<HTMLButtonElement>('#account-theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => accountPage.classList.toggle('dark-mode'));
  }

  // Interactive Tab Navigation
  const navItems = mount.querySelectorAll<HTMLElement>('.account-nav-item');
  navItems.forEach((navItem) => {
    navItem.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach((item) => item.classList.remove('active'));
      navItem.classList.add('active');

      const targetId = navItem.id.replace('nav-', 'panel-');
      const targetPanel = mount.querySelector<HTMLElement>(`#${targetId}`);
      if (targetPanel) {
        targetPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  return () => { /* no teardown needed */ };
}
