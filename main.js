/* ═══════════════════════════════════════════
   OLAPRESTIGE — main.js v2 Premium
   Panier + Commande WhatsApp
═══════════════════════════════════════════ */

let cart = [];

/* ─── PANIER ─── */
function addToCart(btn) {
  const card = btn.closest('.product-card');
  const id    = card.dataset.id;
  const name  = card.dataset.name;
  const price = parseInt(card.dataset.price);
  const img   = card.dataset.img;

  if (price === 0) return;

  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price, img, qty: 1 });
  }

  updateCartUI();
  showToast('✅ ' + name + ' ajouté !');
  openCart();
}

function updateCartUI() {
  const count    = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartSubtotal').textContent = formatPrice(subtotal);
  document.getElementById('cartTotal').textContent   = formatPrice(subtotal + 1000);

  const cartItems  = document.getElementById('cartItems');
  const cartEmpty  = document.getElementById('cartEmpty');
  const cartFooter = document.getElementById('cartFooter');

  if (cart.length === 0) {
    cartEmpty.style.display  = 'block';
    cartItems.innerHTML      = '';
    cartFooter.style.display = 'none';
    return;
  }

  cartEmpty.style.display  = 'none';
  cartFooter.style.display = 'block';

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.img}" alt="${item.name}" class="cart-item-img" onerror="this.src='logo.png'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeItem('${item.id}')">🗑</button>
    </div>
  `).join('');
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
  showToast('🗑 Article retiré');
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
  const panel   = document.getElementById('cartPanel');
  const overlay = document.getElementById('cartOverlay');
  panel.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* ─── CHECKOUT ─── */
function openCheckout() {
  if (cart.length === 0) { showToast('⚠️ Votre panier est vide'); return; }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const summaryHTML = cart.map(item =>
    `<div class="modal-summary-item">
      <span>${item.name} × ${item.qty}</span>
      <span>${formatPrice(item.price * item.qty)}</span>
    </div>`
  ).join('') +
  `<div class="modal-summary-item">
    <span>Livraison</span><span>À partir de 1 000 F</span>
  </div>
  <div class="modal-summary-total">
    <span>Total estimé</span>
    <span>${formatPrice(subtotal + 1000)}</span>
  </div>`;

  document.getElementById('modalOrderSummary').innerHTML = summaryHTML;
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function sendToWhatsApp() {
  const name  = document.getElementById('clientName').value.trim();
  const zone  = document.getElementById('clientZone').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();
  const note  = document.getElementById('clientNote').value.trim();

  if (!name)  { showToast('⚠️ Entrez votre nom'); return; }
  if (!zone)  { showToast('⚠️ Entrez votre quartier'); return; }
  if (!phone) { showToast('⚠️ Entrez votre téléphone'); return; }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  let msg = '🛒 *NOUVELLE COMMANDE — OlaPrestige*\n\n';
  msg += '👤 *Client :* ' + name + '\n';
  msg += '📍 *Zone :* ' + zone + '\n';
  msg += '📞 *Tél :* ' + phone + '\n\n';
  msg += '🍽️ *Commande :*\n';
  cart.forEach(item => {
    msg += `• ${item.name} × ${item.qty} = ${formatPrice(item.price * item.qty)}\n`;
  });
  msg += '\n💰 *Sous-total :* ' + formatPrice(subtotal);
  msg += '\n🚚 *Livraison :* À partir de 1 000 F';
  msg += '\n💵 *Total estimé :* ' + formatPrice(subtotal + 1000);
  if (note) msg += '\n\n📝 *Note :* ' + note;
  msg += '\n\n_Commande passée via olaprestige.netlify.app_';

  const url = 'https://wa.me/2290152372275?text=' + encodeURIComponent(msg);
  window.open(url, '_blank');

  cart = [];
  updateCartUI();
  closeCheckout();
  toggleCart();
  showToast('🎉 Commande envoyée ! Merci.');
}

/* ─── RECHERCHE ─── */
function handleSearch() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!query) return;

  const cards = document.querySelectorAll('.product-card');
  let found = false;

  cards.forEach(card => {
    const name = card.dataset.name.toLowerCase();
    const section = card.closest('.product-section');
    if (name.includes(query)) {
      section.scrollIntoView({ behavior:'smooth', block:'center' });
      card.style.outline = '2px solid var(--gold)';
      setTimeout(() => card.style.outline = '', 2000);
      found = true;
    }
  });

  if (!found) showToast('😕 Aucun plat trouvé pour "' + query + '"');
}

document.getElementById('searchInput').addEventListener('keypress', e => {
  if (e.key === 'Enter') handleSearch();
});

/* ─── NAV ACTIVE ─── */
const sections = document.querySelectorAll('.product-section');
const catLinks = document.querySelectorAll('.cat-link');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      catLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.cat === id);
      });
    }
  });
}, { threshold: 0.3 });

sections.forEach(s => observer.observe(s));

/* ─── HEADER SCROLL ─── */
window.addEventListener('scroll', () => {
  const header = document.getElementById('header');
  header.style.boxShadow = window.scrollY > 10
    ? '0 4px 24px rgba(61,5,16,0.5)'
    : '0 2px 20px rgba(61,5,16,0.4)';
});

/* ─── TOAST ─── */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ─── FORMAT PRIX ─── */
function formatPrice(n) {
  return n.toLocaleString('fr-FR') + ' F';
}

/* ─── FERMER MODAL EN CLIQUANT DEHORS ─── */
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeCheckout();
});
