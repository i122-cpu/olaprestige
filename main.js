/* ═══ LANGUE ═══ */
let lang = localStorage.getItem('ola-lang') || 'fr';

function setLang(l) {
  lang = l;
  localStorage.setItem('ola-lang', l);
  const btnFR = document.getElementById('btnFR');
  const btnEN = document.getElementById('btnEN');
  if (btnFR) btnFR.classList.toggle('on', l === 'fr');
  if (btnEN) btnEN.classList.toggle('on', l === 'en');
  document.querySelectorAll('[data-' + l + ']').forEach(el => {
    el.textContent = el.getAttribute('data-' + l);
  });
  document.querySelectorAll('[data-placeholder-' + l + ']').forEach(el => {
    el.placeholder = el.getAttribute('data-placeholder-' + l);
  });
  updateCartUI();
  if (typeof updateStatus === 'function') updateStatus();
  if (typeof updateCountdown === 'function') updateCountdown();
  if (typeof updateOlaBotLang === 'function') updateOlaBotLang();
}

// Appliquer la langue sauvegardée au chargement
document.addEventListener('DOMContentLoaded', () => {
  setLang(lang);
  updateCartUI();
});

/* ═══ STATUS ═══ */
function updateStatus() {
  const h = new Date().getHours();
  const open = h >= 10 && h < 20;
  const p = document.getElementById('statusPill');
  if (!p) return;
  const isEn = lang === 'en';
  if (open) {
    p.textContent = isEn ? '● Open' : '● Ouvert';
  } else {
    p.textContent = isEn ? '● Closed' : '● Fermé';
  }
  p.className = 'status-pill ' + (open ? 's-open' : 's-closed');
}
updateStatus();
setInterval(updateStatus, 60000);

/* ═══ PANIER (persistant via localStorage) ═══ */
let cart = [];
try {
  cart = JSON.parse(localStorage.getItem('ola-cart') || '[]');
  // Sécurité : nettoyer toute donnée corrompue (prix non numériques, quantités invalides)
  cart = cart.filter(i => i && typeof i.price === 'number' && !isNaN(i.price) && i.price > 0 && typeof i.qty === 'number' && i.qty > 0);
} catch (e) {
  cart = [];
}

// Fonction centralisée de calcul du sous-total — utilisée PARTOUT pour garantir la cohérence
function cartSubtotal() {
  return cart.reduce((s, i) => {
    const price = Number(i.price) || 0;
    const qty   = Number(i.qty) || 0;
    return s + (price * qty);
  }, 0);
}
const DELIVERY_FEE = 1000;

function saveCart() {
  localStorage.setItem('ola-cart', JSON.stringify(cart));
}

function addToCart(btn) {
  const card = btn.closest('.p-card');
  if (!card) return;
  const price = parseInt(card.dataset.price);
  if (!price) return;
  const id = card.dataset.id;
  const nameFr = card.getAttribute('data-name-fr');
  const nameEn = card.getAttribute('data-name-en') || nameFr;
  const img = card.dataset.img;
  const ex = cart.find(i => i.id === id);
  if (ex) ex.qty++;
  else cart.push({ id, nameFr, nameEn, price, img, qty:1 });
  saveCart();
  updateCartUI();
  playAddSound();
  const name = lang === 'en' ? nameEn : nameFr;
  toast('✦ ' + name + (lang === 'fr' ? ' ajouté' : ' added'));
  openCart();
}

/* ═══ AJOUT PANIER — POISSON BRAISÉ AVEC ACCOMPAGNEMENT ═══ */
function addFishToCart(btn) {
  const card = btn.closest('.p-card');
  if (!card) return;
  const price = parseInt(card.dataset.price);
  if (!price) return;

  const sideSelect = card.querySelector('.fish-select');
  const sideValue = sideSelect ? sideSelect.value : '';
  const sideOption = sideSelect ? sideSelect.options[sideSelect.selectedIndex] : null;
  const sideFr = sideOption ? (sideOption.getAttribute('data-fr') || sideValue) : sideValue;
  const sideEn = sideOption ? (sideOption.getAttribute('data-en') || sideValue) : sideValue;

  // L'id inclut l'accompagnement pour que chaque variante soit une ligne distincte au panier
  const baseId = card.dataset.id;
  const id = baseId + '-' + sideValue.toLowerCase().replace(/[^a-z0-9]/g, '');

  const nameFrBase = card.getAttribute('data-name-fr');
  const nameEnBase = card.getAttribute('data-name-en') || nameFrBase;
  const nameFr = `${nameFrBase} (${sideFr})`;
  const nameEn = `${nameEnBase} (${sideEn})`;
  const img = card.dataset.img;

  const ex = cart.find(i => i.id === id);
  if (ex) ex.qty++;
  else cart.push({ id, nameFr, nameEn, price, img, qty:1 });

  saveCart();
  updateCartUI();
  playAddSound();
  const name = lang === 'en' ? nameEn : nameFr;
  toast('✦ ' + name + (lang === 'fr' ? ' ajouté' : ' added'));
  openCart();
}

/* ═══ SON DE CONFIRMATION — Web Audio API, pas besoin de fichier ═══ */
let audioCtx = null;
function playAddSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    // Petit "ding" à deux notes montantes — satisfaisant, discret
    [880, 1320].forEach((freq, i) => {
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.25);
    });
  } catch (e) {
    // Silencieux si le navigateur bloque l'audio sans interaction préalable
  }
}

function updateCartUI() {
  const count = cart.reduce((s,i) => s + i.qty, 0);
  const sub   = cartSubtotal();
  document.getElementById('cartN').textContent = count;
  const subEl = document.getElementById('cartSub');
  const totEl = document.getElementById('cartTot');
  if (subEl) subEl.textContent = fmt(sub);
  if (totEl) totEl.textContent = fmt(sub + DELIVERY_FEE);
  const items = document.getElementById('cartItems');
  const empty = document.getElementById('cartEmpty');
  const ft    = document.getElementById('cartFt');
  if (!items) return;
  if (cart.length === 0) {
    empty.style.display = 'block';
    items.innerHTML = '';
    if (ft) ft.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  if (ft) ft.style.display = 'block';
  items.innerHTML = cart.map(item => {
    const nm = lang === 'en' ? item.nameEn : item.nameFr;
    return `<div class="c-item">
      <img src="${item.img}" class="c-item-img" onerror="this.src='logo.png'" alt="${nm}">
      <div class="c-item-inf">
        <div class="c-item-nm">${nm}</div>
        <div class="c-item-pr">${fmt(item.price * item.qty)}</div>
        <div class="c-item-qty">
          <button class="qty-b" onclick="chQty('${item.id}',-1)">−</button>
          <span class="qty-n">${item.qty}</span>
          <button class="qty-b" onclick="chQty('${item.id}',1)">+</button>
        </div>
      </div>
      <button class="c-item-rm" onclick="rmItem('${item.id}')">✕</button>
    </div>`;
  }).join('');
}

function chQty(id, d) {
  const i = cart.find(x => x.id === id);
  if (!i) return;
  i.qty += d;
  if (i.qty <= 0) cart = cart.filter(x => x.id !== id);
  saveCart();
  updateCartUI();
}

function rmItem(id) {
  cart = cart.filter(x => x.id !== id);
  saveCart();
  updateCartUI();
  toast(lang === 'fr' ? 'Article retiré' : 'Item removed');
}

function openCart() {
  document.getElementById('cartPn').classList.add('on');
  document.getElementById('cartOv').classList.add('on');
}
function closeCart() {
  document.getElementById('cartPn').classList.remove('on');
  document.getElementById('cartOv').classList.remove('on');
}

/* ═══ CHECKOUT ═══ */
function openCheckout() {
  if (!cart.length) { toast(lang === 'fr' ? 'Panier vide' : 'Cart is empty'); return; }
  const sub = cartSubtotal();
  document.getElementById('mSum').innerHTML =
    cart.map(i => {
      const n = lang === 'en' ? i.nameEn : i.nameFr;
      return `<div class="m-row"><span>${n} × ${i.qty}</span><span>${fmt(i.price*i.qty)}</span></div>`;
    }).join('') +
    `<div class="m-row"><span>${lang==='fr'?'Livraison':'Delivery'}</span><span>${lang==='fr'?'Selon quartier':'Based on area'}</span></div>
     <div class="m-tot"><span>${lang==='fr'?'Total estimé':'Estimated total'}</span><span>${fmt(sub + DELIVERY_FEE)}</span></div>`;
  document.getElementById('modalOv').classList.add('on');
}
function closeCheckout() {
  document.getElementById('modalOv').classList.remove('on');
}
document.getElementById('modalOv').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOv')) closeCheckout();
});

function sendOrder() {
  const name  = document.getElementById('cName').value.trim();
  const zone  = document.getElementById('cZone').value.trim();
  const phone = document.getElementById('cPhone').value.trim();
  const note  = document.getElementById('cNote').value.trim();
  const fr = lang === 'fr';
  if (!name)  { toast(fr ? '⚠️ Entrez votre nom' : '⚠️ Enter your name'); return; }
  if (!zone)  { toast(fr ? '⚠️ Entrez votre quartier' : '⚠️ Enter your area'); return; }
  if (!phone) { toast(fr ? '⚠️ Entrez votre téléphone' : '⚠️ Enter your phone'); return; }
  const sub = cartSubtotal();
  let msg = `✦ *COMMANDE OLAPRESTIGE*\n\n`;
  msg += `👤 *${fr?'Client':'Customer'} :* ${name}\n`;
  msg += `📍 *${fr?'Zone':'Area'} :* ${zone}\n`;
  msg += `📞 *${fr?'Téléphone':'Phone'} :* ${phone}\n\n`;
  msg += `🍽️ *${fr?'Commande':'Order'} :*\n`;
  cart.forEach(i => {
    const n = fr ? i.nameFr : i.nameEn;
    msg += `• ${n} × ${i.qty} — ${fmt(i.price*i.qty)}\n`;
  });
  msg += `\n💰 *${fr?'Sous-total':'Subtotal'} :* ${fmt(sub)}`;
  msg += `\n🚚 *${fr?'Livraison':'Delivery'} :* ${fr?'Selon quartier':'Based on area'}`;
  if (note) msg += `\n📝 *Note :* ${note}`;
  msg += '\n\n_olaprestige.netlify.app_';

  // Afficher le reçu visuel stylé avant de rediriger vers WhatsApp
  showReceipt({ name, zone, phone, note, items: [...cart], subtotal: sub, fr, waMsg: msg });

  cart = [];
  saveCart();
  updateCartUI();
  closeCheckout();
  closeCart();
}

/* ═══ REÇU DE COMMANDE VISUEL ═══ */
function showReceipt(order) {
  const overlay = document.createElement('div');
  overlay.className = 'receipt-overlay';
  overlay.id = 'receiptOverlay';

  const orderNum = 'OP' + Date.now().toString().slice(-6);
  const dateStr = new Date().toLocaleDateString(order.fr ? 'fr-FR' : 'en-US', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

  const itemsHtml = order.items.map(i => {
    const nm = order.fr ? i.nameFr : i.nameEn;
    return `<div class="receipt-item">
      <span class="receipt-item-nm">${nm} <span class="receipt-item-qty">×${i.qty}</span></span>
      <span class="receipt-item-pr">${fmt(i.price * i.qty)}</span>
    </div>`;
  }).join('');

  overlay.innerHTML = `
    <div class="receipt-card">
      <div class="receipt-header">
        <img src="logo.png" alt="OlaPrestige" class="receipt-logo">
        <div class="receipt-brand">OlaPrestige</div>
        <div class="receipt-tagline">${order.fr ? 'Le goût en abondance' : 'Taste in abundance'}</div>
      </div>

      <div class="receipt-check">
        <span>✓</span>
      </div>
      <h3 class="receipt-title">${order.fr ? 'Commande confirmée' : 'Order confirmed'}</h3>
      <p class="receipt-num">${order.fr ? 'N° de commande' : 'Order number'} : <strong>${orderNum}</strong></p>
      <p class="receipt-date">${dateStr}</p>

      <div class="receipt-divider"></div>

      <div class="receipt-client">
        <div><span>${order.fr ? 'Client' : 'Customer'}</span><strong>${order.name}</strong></div>
        <div><span>${order.fr ? 'Zone' : 'Area'}</span><strong>${order.zone}</strong></div>
        <div><span>${order.fr ? 'Téléphone' : 'Phone'}</span><strong>${order.phone}</strong></div>
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-items">${itemsHtml}</div>

      <div class="receipt-divider"></div>

      <div class="receipt-total-row">
        <span>${order.fr ? 'Sous-total' : 'Subtotal'}</span>
        <span>${fmt(order.subtotal)}</span>
      </div>
      <div class="receipt-total-row receipt-total-main">
        <strong>${order.fr ? 'Total estimé' : 'Estimated total'}</strong>
        <strong>${fmt(order.subtotal + 1000)}</strong>
      </div>

      <p class="receipt-footer-note">${order.fr ? '💳 Paiement à la livraison ou Mobile Money' : '💳 Pay on delivery or Mobile Money'}</p>

      <button class="btn-wa receipt-wa-btn" id="receiptWaBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
        <span>${order.fr ? 'Envoyer sur WhatsApp' : 'Send on WhatsApp'}</span>
      </button>
      <button class="receipt-close-btn" id="receiptCloseBtn">${order.fr ? 'Fermer' : 'Close'}</button>
    </div>`;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => overlay.classList.add('open'));

  document.getElementById('receiptWaBtn').addEventListener('click', () => {
    window.open('https://wa.me/2290152372275?text=' + encodeURIComponent(order.waMsg), '_blank');
  });

  const closeReceipt = () => {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => overlay.remove(), 300);
  };
  document.getElementById('receiptCloseBtn').addEventListener('click', closeReceipt);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeReceipt(); });
}

/* ═══ RECHERCHE ═══ */
function doSearch(presetQuery) {
  const input = document.getElementById('srchIn');
  const q = (presetQuery !== undefined ? presetQuery : input.value).trim().toLowerCase();
  if (!q) return;

  const isMenuPage = document.body.dataset.page === 'menu';
  let found = false;

  document.querySelectorAll('.p-card').forEach(c => {
    const fr = (c.getAttribute('data-name-fr')||'').toLowerCase();
    const en = (c.getAttribute('data-name-en')||'').toLowerCase();
    if (fr.includes(q) || en.includes(q)) {
      const sec = c.closest('.p-sec');
      if (sec) sec.scrollIntoView({behavior:'smooth',block:'center'});
      else c.scrollIntoView({behavior:'smooth',block:'center'});
      c.style.outline = '2px solid #C9A84C';
      c.style.outlineOffset = '3px';
      setTimeout(() => { c.style.outline=''; c.style.outlineOffset=''; }, 2000);
      found = true;
    }
  });

  if (!found) {
    if (!isMenuPage) {
      // Sur l'Accueil : rediriger vers la carte complète avec la recherche
      window.location.href = 'menu.html?q=' + encodeURIComponent(q);
      return;
    }
    toast(lang==='fr' ? `Aucun résultat pour "${q}"` : `No results for "${q}"`);
  }
}

document.getElementById('srchIn').addEventListener('keypress', e => { if(e.key==='Enter') doSearch(); });

// Si on arrive sur menu.html avec ?q=..., lancer la recherche automatiquement
(function autoSearchFromQuery() {
  if (document.body.dataset.page !== 'menu') return;
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) {
    document.getElementById('srchIn').value = q;
    setTimeout(() => doSearch(q), 300);
  }
})();

/* ═══ NAV ACTIVE ═══ */
const secs = document.querySelectorAll('.p-sec');
const lks  = document.querySelectorAll('.cat-lk');
const navObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting)
      lks.forEach(l => l.classList.toggle('on', l.dataset.cat === e.target.id));
  });
}, { threshold:0.2, rootMargin:'-120px 0px -50% 0px' });
secs.forEach(s => navObs.observe(s));

/* ═══ ANIMATIONS SCROLL — cascade fluide par groupe de grille ═══ */
const animObs = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      // Calcule la position de l'élément dans SA propre grille (pas globale)
      // pour un effet de cascade cohérent même si plusieurs grilles apparaissent ensemble
      const parent = e.target.parentElement;
      const siblings = parent ? Array.from(parent.children).filter(c => c === e.target || (c.classList.contains('p-card') || c.classList.contains('avis-card'))) : [e.target];
      const localIndex = siblings.indexOf(e.target);
      const delay = Math.min(localIndex, 5) * 80;
      setTimeout(() => e.target.classList.add('vis'), delay);
      obs.unobserve(e.target);
    }
  });
}, { threshold:0.12, rootMargin:'0px 0px -40px 0px' });
document.querySelectorAll('.p-card, .avis-card').forEach(el => animObs.observe(el));

/* ═══ UTILS ═══ */
function fmt(n) { return n.toLocaleString('fr-FR') + ' F'; }
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2800);
}

/* ═══ ACCESSIBILITÉ — Fermeture clavier (Échap) ═══ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const cart = document.getElementById('cartPn');
    const modal = document.getElementById('modalOv');
    if (modal && modal.classList.contains('on')) {
      closeCheckout();
    } else if (cart && cart.classList.contains('on')) {
      closeCart();
    }
  }
});
/* ═══ PROPOSITION DE PLAT ═══ */
function sendSuggestion() {
  const name   = document.getElementById('sugName').value.trim();
  const dish   = document.getElementById('sugDish').value.trim();
  const desc   = document.getElementById('sugDesc').value.trim();
  const budget = document.getElementById('sugBudget').value.trim();
  const fr = lang === 'fr';

  if (!name) { toast(fr ? '⚠️ Entrez votre nom' : '⚠️ Enter your name'); return; }
  if (!dish) { toast(fr ? '⚠️ Entrez le nom du plat' : '⚠️ Enter the dish name'); return; }

  let msg = `✦ *${fr ? 'PROPOSITION DE PLAT' : 'DISH SUGGESTION'} — OlaPrestige*\n\n`;
  msg += `👤 *${fr ? 'Nom' : 'Name'} :* ${name}\n`;
  msg += `🍽️ *${fr ? 'Plat proposé' : 'Suggested dish'} :* ${dish}\n`;
  if (desc)   msg += `📝 *${fr ? 'Description' : 'Description'} :* ${desc}\n`;
  if (budget) msg += `💰 *${fr ? 'Budget proposé' : 'Proposed budget'} :* ${budget} F\n`;
  msg += `\n_olaprestige.netlify.app_`;

  window.open('https://wa.me/2290152372275?text=' + encodeURIComponent(msg), '_blank');

  document.getElementById('sugName').value = '';
  document.getElementById('sugDish').value = '';
  document.getElementById('sugDesc').value = '';
  document.getElementById('sugBudget').value = '';

  // Affiche la vraie section de confirmation sur la page (au lieu d'un simple toast)
  const form    = document.getElementById('suggestForm');
  const success = document.getElementById('suggestSuccess');
  if (form)    form.style.display = 'none';
  if (success) {
    success.style.display = 'block';
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function resetSuggestForm() {
  const form    = document.getElementById('suggestForm');
  const success = document.getElementById('suggestSuccess');
  if (success) success.style.display = 'none';
  if (form)    form.style.display = '';
}

/* ═══ BOUTON RETOUR EN HAUT ═══ */
(function initBackTop() {
  const btn = document.createElement('button');
  btn.className = 'back-top';
  btn.setAttribute('aria-label', 'Retour en haut');
  btn.innerHTML = '↑';
  btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
})();

/* ═══ SCROLL TO TOP ═══ */
const scrollTopBtn = document.getElementById('scrollTop');
if (scrollTopBtn) {
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
  });
}

/* ═══ BURGER MENU PREMIUM ═══ */
function toggleBurger() {
  const btn   = document.getElementById('burgerBtn');
  const nav   = document.getElementById('catNavIn');
  const wrap  = document.getElementById('catNav');
  const chef  = document.getElementById('chefFloat');
  const fab   = document.querySelector('.wa-float');
  const hdr   = document.getElementById('hdr');
  const topb  = document.querySelector('.topbar');
  if (!btn || !nav) return;
  const isOpening = !nav.classList.contains('open');
  btn.classList.toggle('open');
  nav.classList.toggle('open');
  if (wrap) wrap.classList.toggle('menu-open', isOpening);
  if (chef) chef.style.display = isOpening ? 'none' : '';
  if (fab)  fab.style.display  = isOpening ? 'none' : '';
  if (hdr)  hdr.style.visibility  = isOpening ? 'hidden' : '';
  if (topb) topb.style.visibility = isOpening ? 'hidden' : '';
  document.body.style.overflow = isOpening ? 'hidden' : '';
}

// Fermer le burger quand on clique sur un lien
document.querySelectorAll('.cat-lk').forEach(lk => {
  lk.addEventListener('click', () => {
    const btn  = document.getElementById('burgerBtn');
    const nav  = document.getElementById('catNavIn');
    const wrap = document.getElementById('catNav');
    const chef = document.getElementById('chefFloat');
    const fab  = document.querySelector('.wa-float');
    const hdr  = document.getElementById('hdr');
    const topb = document.querySelector('.topbar');
    if (btn)  btn.classList.remove('open');
    if (nav)  nav.classList.remove('open');
    if (wrap) wrap.classList.remove('menu-open');
    if (chef) chef.style.display = '';
    if (fab)  fab.style.display  = '';
    if (hdr)  hdr.style.visibility  = '';
    if (topb) topb.style.visibility = '';
    document.body.style.overflow = '';
  });
});

/* ═══ MUSIQUE D'AMBIANCE ═══ */
let musicPlaying = false;

function toggleMusic() {
  const audio = document.getElementById('bgMusic');
  const btn   = document.getElementById('musicBtn');
  if (!audio || !btn) return;

  if (musicPlaying) {
    audio.pause();
    btn.classList.remove('on', 'music-on');
    btn.title = "Activer la musique d'ambiance";
    musicPlaying = false;
  } else {
    audio.volume = 0.25;
    audio.play().then(() => {
      btn.classList.add('on', 'music-on');
      btn.title = "Couper la musique";
      musicPlaying = true;
    }).catch(() => {
      showToast('🎵 Cliquez à nouveau pour activer la musique');
    });
  }
}

/* ═══ MODE SOMBRE / CLAIR ═══ */
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  localStorage.setItem('ola-theme', isLight ? 'light' : 'dark');
  updateThemeIcon(isLight);
  showToast(isLight ? '☀️ Mode clair activé' : '🌙 Mode sombre activé');
}

function updateThemeIcon(isLight) {
  const icon = document.getElementById('themeIcon');
  if (!icon) return;
  icon.innerHTML = isLight
    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
    : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
}

// Appliquer le thème sauvegardé
(function applyTheme() {
  const saved = localStorage.getItem('ola-theme');
  if (saved === 'light') {
    document.body.classList.add('light-mode');
    updateThemeIcon(true);
  }
})();

/* ═══ COUNTDOWN LIVRAISON ═══ */
function updateCountdown() {
  const bar   = document.getElementById('countdownBar');
  const timer = document.getElementById('cdTimer');
  const text  = document.getElementById('cdText');
  if (!bar || !timer) return;

  const now     = new Date();
  const h       = now.getHours();
  const m       = now.getMinutes();
  const s       = now.getSeconds();

  // Visible seulement entre 10h et 19h30
  if (h < 10 || h > 19 || (h === 19 && m >= 30)) {
    bar.classList.add('hidden');
    return;
  }

  bar.classList.remove('hidden');

  // Temps restant jusqu'à 19h30
  const totalSecsNow    = h * 3600 + m * 60 + s;
  const totalSecsTarget = 19 * 3600 + 30 * 60;
  const remaining       = totalSecsTarget - totalSecsNow;

  const rh = Math.floor(remaining / 3600);
  const rm = Math.floor((remaining % 3600) / 60);
  const rs = remaining % 60;

  const pad = n => String(n).padStart(2, '0');
  const isEn = lang === 'en';

  if (rh > 0) {
    timer.textContent = isEn ? `${pad(rh)}h ${pad(rm)}m ${pad(rs)}s` : `${pad(rh)}h ${pad(rm)}m ${pad(rs)}s`;
  } else {
    timer.textContent = `${pad(rm)}m ${pad(rs)}s`;
  }

  if (text) {
    text.innerHTML = isEn
      ? '⏳ Order before <strong>7:30 PM</strong> for delivery tonight!'
      : '⏳ Commandez avant <strong>19h30</strong> pour une livraison ce soir !';
  }

  if (remaining <= 1800) {
    // Moins de 30 min — urgence
    bar.style.background = 'linear-gradient(90deg, #8B0000 0%, #C00000 100%)';
    if (text) {
      text.innerHTML = isEn
        ? '🚨 Last call! Order before <strong>7:30 PM</strong> tonight!'
        : '🚨 Dernière chance ! Commandez avant <strong>19h30</strong> ce soir !';
    }
  }
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* ═══ NOTIFICATION FORMULE FAMILLE ═══ */
function notifyFamilyLaunch() {
  const phoneInput = document.getElementById('familyPhone');
  const form       = document.getElementById('familyNotifyForm');
  const success    = document.getElementById('familyNotifySuccess');
  if (!phoneInput) return;

  const phone = phoneInput.value.trim();
  const isEn  = typeof lang !== 'undefined' && lang === 'en';

  if (!phone) {
    showToast(isEn ? '⚠️ Enter your phone number' : '⚠️ Entrez votre numéro de téléphone');
    return;
  }

  // Enregistrement local (persiste même après rechargement)
  try {
    const list = JSON.parse(localStorage.getItem('ola-family-notify') || '[]');
    list.push({ phone, date: new Date().toISOString() });
    localStorage.setItem('ola-family-notify', JSON.stringify(list));
  } catch (e) {}

  // Notifier aussi OlaPrestige via WhatsApp pour suivi manuel
  const msg = isEn
    ? `🔔 *FAMILY COMBO — Launch notification request*\\n\\nPhone: ${phone}\\n\\n_Sent automatically from olaprestige.netlify.app_`
    : `🔔 *FORMULE FAMILLE — Demande d'avertissement*\\n\\nTéléphone : ${phone}\\n\\n_Envoyé automatiquement depuis olaprestige.netlify.app_`;

  // On n'ouvre pas WhatsApp automatiquement pour ne pas interrompre l'utilisateur —
  // on affiche juste la confirmation. Le lien reste disponible si besoin plus tard.

  if (form)    form.style.display = 'none';
  if (success) success.style.display = 'flex';

  showToast(isEn ? '✓ You will be notified!' : '✓ Vous serez averti(e) !');
}

/* ═══ TRANSITIONS DE PAGE FLUIDES ═══ */
(function pageTransitions() {
  // Overlay d'entrée — s'estompe automatiquement au chargement (géré en CSS)
  const fadeIn = document.createElement('div');
  fadeIn.id = 'pageFadeOverlay';
  document.body.appendChild(fadeIn);
  setTimeout(() => { if (fadeIn) fadeIn.remove(); }, 400);

  // Overlay de sortie — fondu vers noir avant de changer de page
  const fadeOut = document.createElement('div');
  fadeOut.className = 'page-transition-out';
  fadeOut.id = 'pageFadeOutOverlay';
  document.body.appendChild(fadeOut);

  // Intercepter les clics sur les liens internes du même site (pas les ancres #, pas les liens externes)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#')) return;                  // ancre locale — pas de transition
    if (href.startsWith('http') && !href.includes(location.hostname)) return; // lien externe
    if (link.target === '_blank') return;               // ouverture nouvel onglet
    if (href.startsWith('tel:') || href.startsWith('mailto:')) return;

    // C'est un lien interne classique (ex: menu.html, galerie.html...)
    e.preventDefault();
    fadeOut.classList.add('active');
    setTimeout(() => { window.location.href = href; }, 260);
  });
})();

/* ═══ REVEAL AU SCROLL POUR LES SECTIONS (hero, histoire, etc.) ═══ */
(function initRevealSections() {
  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('vis');
        obs.unobserve(e.target);
      }
    });
  }, { threshold:0.15, rootMargin:'0px 0px -60px 0px' });

  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-scale').forEach(el => revealObs.observe(el));
})();
