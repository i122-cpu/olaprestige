/* ═══════════════════════════════════════════
   OLABOT v2 — Assistant IA OlaPrestige
   Powered by Mistral AI (via Netlify Function)
═══════════════════════════════════════════ */

let olaBotOpen = false;
let olaBotHistory = [];

function createOlaBot() {
  const container = document.createElement('div');
  container.innerHTML = `
  <button class="olabot-fab" id="olaBotFab" onclick="toggleOlaBot()" aria-label="Assistant OlaPrestige">
    <span class="olabot-fab-icon" id="olaBotFabIcon">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </span>
    <span class="olabot-notif" id="olaBotNotif">1</span>
  </button>

  <div class="olabot-panel" id="olaBotPanel">
    <div class="olabot-header">
      <div class="olabot-header-info">
        <div class="olabot-avatar">✦</div>
        <div>
          <strong>OlaBot</strong>
          <span id="olaBotStatus">Assistant OlaPrestige</span>
        </div>
      </div>
      <button class="olabot-close" onclick="toggleOlaBot()">✕</button>
    </div>

    <div class="olabot-messages" id="olaBotMessages">
      <div class="olabot-msg bot">
        <div class="olabot-bubble">
          Bonjour ! 👋 Je suis <strong>OlaBot</strong>, votre assistant OlaPrestige.<br><br>
          Vous avez faim ? Une question sur nos plats ? Une suggestion ? Je suis là pour vous ! 🍽️
        </div>
      </div>
    </div>

    <div class="olabot-suggestions" id="olaBotSugg">
      <button onclick="sendQuick('Quels sont vos plats et prix ?')">📋 Le menu</button>
      <button onclick="sendQuick('Aidez-moi à choisir un plat')">🤔 Choisir</button>
      <button onclick="sendQuick('Comment passer une commande ?')">📲 Commander</button>
      <button onclick="sendQuick('Quels sont vos horaires et zones de livraison ?')">🕙 Infos</button>
    </div>

    <div class="olabot-input-wrap">
      <input type="text" class="olabot-input" id="olaBotInput"
        placeholder="Posez votre question..."
        onkeypress="if(event.key==='Enter')sendOlaBot()">
      <button class="olabot-send" onclick="sendOlaBot()" aria-label="Envoyer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>
  </div>`;
  document.body.appendChild(container);

  // Notification après 4s
  setTimeout(() => {
    const n = document.getElementById('olaBotNotif');
    if (n) n.style.display = 'flex';
  }, 4000);
}

function toggleOlaBot() {
  olaBotOpen = !olaBotOpen;
  const panel = document.getElementById('olaBotPanel');
  const fab   = document.getElementById('olaBotFab');
  const notif = document.getElementById('olaBotNotif');
  const icon  = document.getElementById('olaBotFabIcon');

  if (panel) panel.classList.toggle('open', olaBotOpen);
  if (fab)   fab.classList.toggle('open', olaBotOpen);
  if (notif && olaBotOpen) notif.style.display = 'none';

  if (icon) {
    icon.innerHTML = olaBotOpen
      ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
      : `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  }

  if (olaBotOpen) {
    setTimeout(() => {
      const input = document.getElementById('olaBotInput');
      if (input) input.focus();
    }, 300);
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

  // Afficher message utilisateur
  addMsg(text, 'user');
  olaBotHistory.push({ role:'user', content: text });

  // Typing
  const typId = 'typ_' + Date.now();
  addTyping(typId);
  if (status) status.textContent = 'En train d\'écrire...';

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
      addMsg('Oups ! Une erreur est survenue. Contactez-nous sur WhatsApp : <a href="https://wa.me/2290152372275" target="_blank" style="color:var(--braise);font-weight:600">+229 01 52 37 22 75</a> 💬', 'bot error');
    } else {
      const reply = data.reply;
      addMsg(reply, 'bot');
      olaBotHistory.push({ role:'assistant', content: reply });
    }

    if (status) status.textContent = 'Assistant OlaPrestige';

    // Limiter historique à 16 messages
    if (olaBotHistory.length > 16) olaBotHistory = olaBotHistory.slice(-16);

  } catch (err) {
    removeEl(typId);
    input.disabled = false;
    addMsg('Connexion impossible. Contactez-nous directement : <a href="https://wa.me/2290152372275" target="_blank" style="color:var(--braise);font-weight:600">WhatsApp +229 01 52 37 22 75</a> 💬', 'bot error');
    if (status) status.textContent = 'Assistant OlaPrestige';
  }

  input.focus();
}

function addMsg(html, type) {
  const messages = document.getElementById('olaBotMessages');
  if (!messages) return;
  const div = document.createElement('div');
  div.className = `olabot-msg ${type.startsWith('bot') ? 'bot' : 'user'}`;
  const formatted = html
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  div.innerHTML = `<div class="olabot-bubble ${type === 'bot error' ? 'error' : ''}">${formatted}</div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function addTyping(id) {
  const messages = document.getElementById('olaBotMessages');
  if (!messages) return;
  const div = document.createElement('div');
  div.className = 'olabot-msg bot';
  div.id = id;
  div.innerHTML = `<div class="olabot-bubble typing"><span></span><span></span><span></span></div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeEl(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

document.addEventListener('DOMContentLoaded', createOlaBot);
