/* ═══════════════════════════════════════════
   OLAPRESTIGE v3 — main.js
   Panier · Commande · Langue · Animations
═══════════════════════════════════════════ */

/* ─── LANGUE ─── */
let currentLang = localStorage.getItem('ola-lang') || 'fr';

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('ola-lang', lang);
  document.documentElement.setAttribute('data-lang', lang);

  // Boutons langue
  document.getElementById('btnFR').classList.toggle('active', lang === 'fr');
  document.getElementById('btnEN').classList.toggle('active', lang === 'en');

  // Tous les éléments avec data-fr / data-en
  document.querySelectorAll('[data-fr]').forEach(el => {
    const val = el.getAttribute('data-' + lang);
    if (val) el.textContent = val;
  });

  // Placeholders
  document.querySelectorAll('[data-placeholder-' + lang + ']').forEach(el => {
    el.placeholder = el.getAttribute('data-placeholder-' + lang);
  });

  updateCartUI();
  updateStatus();
}

// Init langue au chargement
document.addEventListener('DOMContentLoaded', () => setLang(currentLang));

/* ─── PANIER ─── */
let cart = [];

function getProductName(card) {
  return card.getAttribute('data-name-' + currentLang) || card.getAttribute('data-name-fr');
}

function addToCart(btn) {
  const card = btn.closest('.product-card');
  if (!card) return;

  const id    = card.dataset.id;
  const name  = getProductName(card);
  const price = parseInt(card.dataset.price);
  const img   = card.dataset.img;

  if (!price || price === 0) return;

  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, nameFr: card.getAttribute('data-name-fr'), nameEn: card.getAttribute('data-name-en') || card.getAttribute('data-name-fr'), price, img, qty: 1 });
  }

  updateCartUI();
  showToast((currentLang === 'fr' ? '✦ ' + name + ' ajouté' : '✦ ' + name + ' added'));
  openCart();
}

function updateCartUI() {
  const count    = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  document.getElementById('cartCount').textContent = count;

  const subEl = document.getElementById('cartSubtotal');
  const totEl = document.getElementById('cartTotal');
  if (subEl) subEl.textContent = formatPrice(subtotal);
  if (totEl) totEl.textContent = formatPrice(subtotal + 1000);

  const cartItems  = document.getElementById('cartItems');
  const cartEmpty  = document.getElementById('cartEmpty');
  const cartFooter = document.getElementById('cartFooter');

  if (!cartItems) return;

  if (cart.length === 0) {
    cartEmpty.style.display  = 'block';
    cartItems.innerHTML      = '';
    if (cartFooter) cartFooter.style.display = 'none';
    return;
  }

  cartEmpty.style.display = 'none';
  if (cartFooter) cartFooter.style.display = 'block';

  cartItems.innerHTML = cart.map(item => {
    const name = currentLang === 'en' ? item.nameEn : item.nameFr;
    return `
    <div class="cart-item">
      <img src="${item.img}" alt="${name}" class="cart-item-img" onerror="this.src='logo.png'">
      <div class="cart-item-info">
        <div class="cart-item-name">${name}</div>
        <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeItem('${item.id}')">✕</button>
    </div>`
  }).join('');
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  updateCartUI();
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  updateCartUI();
  showToast(currentLang === 'fr' ? 'Article retiré' : 'Item removed');
}

/* ─── TOGGLE PANIER ─── */
function toggleCart() {
  const panel   = document.getElementById('cartPanel');
  const overlay = document.getElementById('cartOverlay');
  panel.classList.toggle('open');
  overlay.classList.toggle('open');
  document.body.style.overflow = panel.classList.contains('open') ? 'hidden' : '';
}

function openCart() {
  document.getElementById('cartPanel').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* ─── CHECKOUT ─── */
function openCheckout() {
  if (cart.length === 0) {
    showToast(currentLang === 'fr' ? '⚠️ Panier vide' : '⚠️ Cart is empty');
    return;
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const summaryHTML = cart.map(item => {
    const name = currentLang === 'en' ? item.nameEn : item.nameFr;
    return `<div class="modal-summary-item"><span>${name} × ${item.qty}</span><span>${formatPrice(item.price * item.qty)}</span></div>`;
  }).join('') +
  `<div class="modal-summary-item"><span>${currentLang === 'fr' ? 'Livraison' : 'Delivery'}</span><span>${currentLang === 'fr' ? 'Selon quartier' : 'Based on area'}</span></div>
   <div class="modal-summary-total"><span>${currentLang === 'fr' ? 'Total estimé' : 'Estimated total'}</span><span>${formatPrice(subtotal + 1000)}</span></div>`;

  document.getElementById('modalOrderSummary').innerHTML = summaryHTML;
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeCheckout();
});

function sendToWhatsApp() {
  const name  = document.getElementById('clientName').value.trim();
  const zone  = document.getElementById('clientZone').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();
  const note  = document.getElementById('clientNote').value.trim();

  const isFr = currentLang === 'fr';

  if (!name)  { showToast(isFr ? '⚠️ Entrez votre nom' : '⚠️ Enter your name'); return; }
  if (!zone)  { showToast(isFr ? '⚠️ Entrez votre quartier' : '⚠️ Enter your neighborhood'); return; }
  if (!phone) { showToast(isFr ? '⚠️ Entrez votre téléphone' : '⚠️ Enter your phone'); return; }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  let msg = '✦ *COMMANDE OLAPRESTIGE*\n\n';
  msg += `👤 *${isFr ? 'Client' : 'Customer'} :* ${name}\n`;
  msg += `📍 *${isFr ? 'Zone' : 'Area'} :* ${zone}\n`;
  msg += `📞 *${isFr ? 'Téléphone' : 'Phone'} :* ${phone}\n\n`;
  msg += `🍽️ *${isFr ? 'Commande' : 'Order'} :*\n`;

  cart.forEach(item => {
    const itemName = isFr ? item.nameFr : item.nameEn;
    msg += `• ${itemName} × ${item.qty} — ${formatPrice(item.price * item.qty)}\n`;
  });

  msg += `\n💰 *${isFr ? 'Sous-total' : 'Subtotal'} :* ${formatPrice(subtotal)}`;
  msg += `\n🚚 *${isFr ? 'Livraison' : 'Delivery'} :* ${isFr ? 'Selon votre quartier' : 'Based on your area'}`;
  if (note) msg += `\n\n📝 *Note :* ${note}`;
  msg += '\n\n_olaprestige.netlify.app_';

  window.open('https://wa.me/2290152372275?text=' + encodeURIComponent(msg), '_blank');

  cart = [];
  updateCartUI();
  closeCheckout();
  document.getElementById('cartPanel').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
  showToast(isFr ? '🎉 Commande envoyée ! Merci.' : '🎉 Order sent! Thank you.');
}

/* ─── RECHERCHE ─── */
function handleSearch() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!query) return;

  const cards = document.querySelectorAll('.product-card');
  let found = false;

  cards.forEach(card => {
    const nameFr = (card.getAttribute('data-name-fr') || '').toLowerCase();
    const nameEn = (card.getAttribute('data-name-en') || '').toLowerCase();
    if (nameFr.includes(query) || nameEn.includes(query)) {
      card.closest('.product-section').scrollIntoView({ behavior:'smooth', block:'center' });
      card.style.outline = '2px solid #C9A84C';
      card.style.outlineOffset = '3px';
      setTimeout(() => { card.style.outline=''; card.style.outlineOffset=''; }, 2200);
      found = true;
    }
  });

  if (!found) showToast(currentLang === 'fr' ? `Aucun résultat pour "${query}"` : `No results for "${query}"`);
}

document.getElementById('searchInput').addEventListener('keypress', e => {
  if (e.key === 'Enter') handleSearch();
});

/* ─── STATUS OUVERT/FERMÉ ─── */
function updateStatus() {
  const pill = document.getElementById('statusPill');
  if (!pill) return;
  const h = new Date().getHours();
  const isOpen = h >= 10 && h < 20;
  const isFr = currentLang === 'fr';
  pill.textContent = isOpen
    ? (isFr ? '● Ouvert' : '● Open')
    : (isFr ? '● Fermé' : '● Closed');
  pill.className = 'status-pill ' + (isOpen ? 'status-open' : 'status-closed');
}
updateStatus();
setInterval(updateStatus, 60000);

/* ─── HEADER SCROLL ─── */
window.addEventListener('scroll', () => {
  document.getElementById('header').classList.toggle('scrolled', window.scrollY > 20);
});

/* ─── NAV ACTIVE ─── */
const sections  = document.querySelectorAll('.product-section');
const catLinks  = document.querySelectorAll('.cat-link');

const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      catLinks.forEach(l => l.classList.toggle('active', l.dataset.cat === id));
    }
  });
}, { threshold:0.3, rootMargin:'-120px 0px 0px 0px' });

sections.forEach(s => navObserver.observe(s));

/* ─── ANIMATION SCROLL ─── */
const animObserver = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 70);
      animObserver.unobserve(entry.target);
    }
  });
}, { threshold:0.08 });

document.querySelectorAll('.product-card, .review-card').forEach(el => animObserver.observe(el));

/* ─── PARTICULES HERO ─── */
function createParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left:${Math.random() * 100}%;
      top:${60 + Math.random() * 40}%;
      width:${1 + Math.random() * 2}px;
      height:${1 + Math.random() * 2}px;
      animation-duration:${4 + Math.random() * 6}s;
      animation-delay:${Math.random() * 6}s;
    `;
    container.appendChild(p);
  }
}
createParticles();

/* ─── FORMAT PRIX ─── */
function formatPrice(n) {
  return n.toLocaleString('fr-FR') + ' F';
}

/* ─── TOAST ─── */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}
