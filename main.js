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
  p.textContent = open ? '● Ouvert' : '● Fermé';
  p.className = 'status-pill ' + (open ? 's-open' : 's-closed');
}
updateStatus();
setInterval(updateStatus, 60000);

/* ═══ PANIER (persistant via localStorage) ═══ */
let cart = [];
try {
  cart = JSON.parse(localStorage.getItem('ola-cart') || '[]');
} catch (e) {
  cart = [];
}

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
  const name = lang === 'en' ? nameEn : nameFr;
  toast('✦ ' + name + (lang === 'fr' ? ' ajouté' : ' added'));
  openCart();
}

function updateCartUI() {
  const count = cart.reduce((s,i) => s + i.qty, 0);
  const sub   = cart.reduce((s,i) => s + i.price * i.qty, 0);
  document.getElementById('cartN').textContent = count;
  const subEl = document.getElementById('cartSub');
  const totEl = document.getElementById('cartTot');
  if (subEl) subEl.textContent = fmt(sub);
  if (totEl) totEl.textContent = fmt(sub + 1000);
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
  const sub = cart.reduce((s,i) => s + i.price * i.qty, 0);
  document.getElementById('mSum').innerHTML =
    cart.map(i => {
      const n = lang === 'en' ? i.nameEn : i.nameFr;
      return `<div class="m-row"><span>${n} × ${i.qty}</span><span>${fmt(i.price*i.qty)}</span></div>`;
    }).join('') +
    `<div class="m-row"><span>${lang==='fr'?'Livraison':'Delivery'}</span><span>${lang==='fr'?'Selon quartier':'Based on area'}</span></div>
     <div class="m-tot"><span>${lang==='fr'?'Total estimé':'Estimated total'}</span><span>${fmt(sub+1000)}</span></div>`;
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
  const sub = cart.reduce((s,i) => s + i.price * i.qty, 0);
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
  window.open('https://wa.me/2290152372275?text=' + encodeURIComponent(msg), '_blank');
  cart = [];
  saveCart();
  updateCartUI();
  closeCheckout();
  closeCart();
  toast(fr ? '🎉 Commande envoyée ! Merci.' : '🎉 Order sent! Thank you.');
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

/* ═══ ANIMATIONS SCROLL ═══ */
const animObs = new IntersectionObserver((entries, obs) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('vis'), (i % 4) * 70);
      obs.unobserve(e.target);
    }
  });
}, { threshold:0.08 });
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

  toast(fr ? '🎉 Merci pour votre proposition !' : '🎉 Thanks for your suggestion!');
}
