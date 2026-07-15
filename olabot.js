/* ═══════════════════════════════════════════
   OLABOT v3 — Chef animé flottant
   Powered by Mistral AI (via Netlify Function)
═══════════════════════════════════════════ */

let olaBotOpen = false;
let olaBotHistory = [];
let olaBotGreeted = false;

function createOlaBot() {
  const container = document.createElement('div');
  container.id = 'olaBotRoot';
  container.innerHTML = `

  <!-- CHEF FLOTTANT — toujours visible -->
  <div class="chef-float" id="chefFloat" onclick="toggleOlaBot()">
    <div class="chef-bubble" id="chefBubble">
      <span id="chefBubbleText">Bonjour ! Je peux vous aider 👋</span>
    </div>
    <div class="chef-avatar-wrap">
      <img src="chef-avatar.png" alt="Chef OlaPrestige" class="chef-img">
      <div class="chef-badge">✦</div>
    </div>
    <div class="chef-label">OlaBot</div>
  </div>

  <!-- PANEL CHAT -->
  <div class="olabot-panel" id="olaBotPanel">
    <div class="olabot-header">
      <div class="olabot-header-info">
        <img src="chef-avatar.png" alt="OlaBot" class="olabot-avatar-img">
        <div>
          <strong>OlaBot</strong>
          <span id="olaBotStatus">
            <span class="status-dot"></span>
            Assistant OlaPrestige
          </span>
        </div>
      </div>
      <button class="olabot-close" onclick="toggleOlaBot()" aria-label="Fermer">✕</button>
    </div>

    <div class="olabot-messages" id="olaBotMessages">
      <div class="olabot-msg bot">
        <img src="chef-avatar.png" alt="Chef" class="msg-avatar">
        <div class="olabot-bubble" id="olaBotWelcomeMsg">
          Bienvenue chez <strong>OlaPrestige</strong> ! 🍽️<br><br>
          Je suis votre chef assistant. Vous avez faim ? Une question ? Je suis là pour vous guider vers le meilleur choix !
        </div>
      </div>
    </div>

    <div class="olabot-suggestions" id="olaBotSugg">
      <button id="sugMenu" onclick="sendQuick(this.dataset.q)" data-q="Quels sont vos plats et prix ?">📋 Le menu</button>
      <button id="sugChoose" onclick="sendQuick(this.dataset.q)" data-q="Aidez-moi à choisir selon mon budget">🤔 Choisir</button>
      <button id="sugOrder" onclick="sendQuick(this.dataset.q)" data-q="Comment passer une commande ?">📲 Commander</button>
      <button id="sugInfo" onclick="sendQuick(this.dataset.q)" data-q="Quels sont vos horaires et zones ?">🕙 Infos</button>
    </div>

    <div class="olabot-input-wrap">
      <input type="text" class="olabot-input" id="olaBotInput"
        placeholder="Dites-moi ce que vous voulez..."
        onkeypress="if(event.key==='Enter')sendOlaBot()">
      <button class="olabot-send" onclick="sendOlaBot()" aria-label="Envoyer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>
  </div>

  <!-- FAB WHATSAPP — repositionné à droite, flottant -->
  <a href="https://wa.me/2290152372275" class="wa-float" target="_blank" title="Commander sur WhatsApp" aria-label="Commander sur WhatsApp">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
    <span class="wa-float-label">Commander</span>
  </a>`;

  document.body.appendChild(container);

  // Messages alternés sur le chef — bilingue FR/EN
  const bubbleMessagesFr = [
    "Bonjour ! Je peux vous aider 👋",
    "Vous avez faim ? 🍽️",
    "Découvrez notre menu !",
    "Livraison en 30 min ! 🚀",
    "Posez-moi vos questions 😊",
  ];
  const bubbleMessagesEn = [
    "Hi! I can help you 👋",
    "Feeling hungry? 🍽️",
    "Discover our menu!",
    "Delivery in 30 min! 🚀",
    "Ask me anything 😊",
  ];
  let msgIndex = 0;
  setInterval(() => {
    if (!olaBotOpen) {
      msgIndex = (msgIndex + 1) % bubbleMessagesFr.length;
      const el = document.getElementById('chefBubbleText');
      if (el) {
        const olaLang = typeof lang !== 'undefined' ? lang : (localStorage.getItem('ola-lang') || 'fr');
        const msgs = olaLang === 'en' ? bubbleMessagesEn : bubbleMessagesFr;
        el.style.opacity = '0';
        setTimeout(() => {
          el.textContent = msgs[msgIndex];
          el.style.opacity = '1';
        }, 300);
      }
    }
  }, 8000);
}

function toggleOlaBot() {
  olaBotOpen = !olaBotOpen;
  const panel   = document.getElementById('olaBotPanel');
  const chef    = document.getElementById('chefFloat');
  const bubble  = document.getElementById('chefBubble');

  if (panel)  panel.classList.toggle('open', olaBotOpen);
  if (chef)   chef.classList.toggle('chat-open', olaBotOpen);
  if (bubble) bubble.style.display = olaBotOpen ? 'none' : 'block';

  if (olaBotOpen) {
    setTimeout(() => {
      const input = document.getElementById('olaBotInput');
      if (input) input.focus();
    }, 350);
  }
}

function sendQuick(msg) {
  const input = document.getElementById('olaBotInput');
  if (input) { input.value = msg; sendOlaBot(); }
  const sugg = document.getElementById('olaBotSugg');
  if (sugg) sugg.style.display = 'none';
}

async function sendOlaBot() {
  const input    = document.getElementById('olaBotInput');
  const messages = document.getElementById('olaBotMessages');
  const status   = document.getElementById('olaBotStatus');
  if (!input || !messages) return;

  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.disabled = true;

  addMsg(text, 'user');
  olaBotHistory.push({ role:'user', content: text });

  const typId = 'typ_' + Date.now();
  addTyping(typId);
  if (status) status.innerHTML = '<span class="status-dot"></span> En train d\'écrire...';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: olaBotHistory })
    });

    const data = await res.json();
    removeEl(typId);
    input.disabled = false;

    if (!res.ok || data.error) {
      addMsg('Oups ! Contactez-nous directement : <a href="https://wa.me/2290152372275" target="_blank" style="color:var(--braise);font-weight:700">WhatsApp +229 01 52 37 22 75</a> 💬', 'bot', true);
    } else {
      addMsg(data.reply, 'bot');
      olaBotHistory.push({ role:'assistant', content: data.reply });
    }

    if (status) status.innerHTML = '<span class="status-dot"></span> Assistant OlaPrestige';
    if (olaBotHistory.length > 16) olaBotHistory = olaBotHistory.slice(-16);

  } catch (err) {
    removeEl(typId);
    input.disabled = false;
    addMsg('Connexion impossible. Écrivez-nous sur <a href="https://wa.me/2290152372275" target="_blank" style="color:var(--braise);font-weight:700">WhatsApp</a> 💬', 'bot', true);
    if (status) status.innerHTML = '<span class="status-dot"></span> Assistant OlaPrestige';
  }

  input.focus();
}

function addMsg(html, type, isError = false) {
  const messages = document.getElementById('olaBotMessages');
  if (!messages) return;
  const isBot = type === 'bot';
  const div = document.createElement('div');
  div.className = `olabot-msg ${isBot ? 'bot' : 'user'}`;
  const formatted = html
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  div.innerHTML = isBot
    ? `<img src="chef-avatar.png" alt="Chef" class="msg-avatar"><div class="olabot-bubble${isError ? ' error' : ''}">${formatted}</div>`
    : `<div class="olabot-bubble">${formatted}</div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function addTyping(id) {
  const messages = document.getElementById('olaBotMessages');
  if (!messages) return;
  const div = document.createElement('div');
  div.className = 'olabot-msg bot';
  div.id = id;
  div.innerHTML = `<img src="chef-avatar.png" alt="Chef" class="msg-avatar"><div class="olabot-bubble typing"><span></span><span></span><span></span></div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeEl(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function updateOlaBotLang() {
  const olaLang = typeof lang !== 'undefined' ? lang : (localStorage.getItem('ola-lang') || 'fr');
  const isEn = olaLang === 'en';

  const welcome = document.getElementById('olaBotWelcomeMsg');
  if (welcome) {
    welcome.innerHTML = isEn
      ? 'Welcome to <strong>OlaPrestige</strong>! 🍽️<br><br>I\'m your chef assistant. Hungry? Got a question? I\'m here to guide you to the best choice!'
      : 'Bienvenue chez <strong>OlaPrestige</strong> ! 🍽️<br><br>Je suis votre chef assistant. Vous avez faim ? Une question ? Je suis là pour vous guider vers le meilleur choix !';
  }

  const status = document.getElementById('olaBotStatus');
  if (status) {
    status.innerHTML = isEn
      ? '<span class="status-dot"></span> OlaPrestige Assistant'
      : '<span class="status-dot"></span> Assistant OlaPrestige';
  }

  const input = document.getElementById('olaBotInput');
  if (input) input.placeholder = isEn ? "Tell me what you want..." : "Dites-moi ce que vous voulez...";

  const sugMenu = document.getElementById('sugMenu');
  if (sugMenu) {
    sugMenu.textContent = isEn ? '📋 Menu' : '📋 Le menu';
    sugMenu.dataset.q = isEn ? 'What dishes and prices do you have?' : 'Quels sont vos plats et prix ?';
  }
  const sugChoose = document.getElementById('sugChoose');
  if (sugChoose) {
    sugChoose.textContent = isEn ? '🤔 Help me choose' : '🤔 Choisir';
    sugChoose.dataset.q = isEn ? 'Help me choose based on my budget' : 'Aidez-moi à choisir selon mon budget';
  }
  const sugOrder = document.getElementById('sugOrder');
  if (sugOrder) {
    sugOrder.textContent = isEn ? '📲 Order' : '📲 Commander';
    sugOrder.dataset.q = isEn ? 'How do I place an order?' : 'Comment passer une commande ?';
  }
  const sugInfo = document.getElementById('sugInfo');
  if (sugInfo) {
    sugInfo.textContent = isEn ? '🕙 Info' : '🕙 Infos';
    sugInfo.dataset.q = isEn ? 'What are your hours and delivery areas?' : 'Quels sont vos horaires et zones ?';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  createOlaBot();
  // On force la traduction juste après la création des éléments,
  // sans dépendre de l'ordre de chargement de main.js
  updateOlaBotLang();
  // Sécurité supplémentaire au cas où la langue changerait juste après (ex: chargement lent)
  setTimeout(updateOlaBotLang, 200);
  setTimeout(updateOlaBotLang, 800);
});


/* ═══ EFFET ÉLASTIQUE AU SCROLL ═══
   Le chef suit le scroll avec un décalage type ressort.
   Quand on scrolle vers le bas, il "traîne" un peu vers le haut puis revient.
*/
(function chefElasticScroll() {
  const chefFloat = () => document.getElementById('chefFloat');
  let lastScrollY = window.scrollY;
  let velocity = 0;
  let offset = 0;
  let rotation = 0;
  const stiffness = 0.10;
  const damping = 0.7;

  function animate() {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;

    // Mouvement bien plus ample et réactif
    const target = -delta * 0.8;
    velocity += (target - offset) * stiffness;
    velocity *= damping;
    offset += velocity;

    // Clamp plus large pour un vrai mouvement visible
    offset = Math.max(-15, Math.min(15, offset));

    // Légère rotation/balancement liée à la vitesse pour renforcer l'effet ressort
    rotation = Math.max(-2, Math.min(2, velocity * 0.3));

    const el = chefFloat();
    if (el) {
      el.style.setProperty('--chef-y', offset.toFixed(2) + 'px');
      el.style.setProperty('--chef-rot', rotation.toFixed(2) + 'deg');
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();