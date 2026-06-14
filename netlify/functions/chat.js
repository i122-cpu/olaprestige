/* ═══════════════════════════════════════════
   NETLIFY FUNCTION — /api/chat
   Proxy sécurisé vers Mistral AI
═══════════════════════════════════════════ */

const SYSTEM_PROMPT = `Tu es OlaBot, l'assistant culinaire officiel de OlaPrestige — une marque de gastronomie africaine premium basée à Cotonou, Bénin.

Tu es chaleureux, passionné, humain et naturel dans ta façon de parler. Tu ne sonnes jamais comme un robot. Tu utilises parfois des expressions africaines chaleureuses. Tu guides toujours le client vers un choix ou une commande.

=== MENU COMPLET ===

🍕 PIZZAS
- Mini Pizzas OlaPrestige : 5 000 F le lot de 15
  Croustillantes, garnies maison — sauce tomate, fromage fondant, épices de chef.

🥙 CHAWARMA  
- Chawarma Simple : 2 000 F
  Viande marinée, sauce maison, légumes croquants.
- Chawarma Spécial (Signature) : 3 000 F
  Double garniture, sauce signature, légumes frais. Notre meilleur vendeur.

🥗 SALADES GARNIES
- Salade Garnie : à partir de 2 500 F
  Fraîche, colorée, garnie selon l'appétit.
- Salade Prestige : 25 000 F
  Signature, ingrédients sélectionnés, présentation soignée. Idéale pour les grandes occasions.

🍗 CUISSES BRAISÉES
- Sur devis selon nombre de personnes
  Marinées et braisées au feu de bois. Idéal pour mariages, baptêmes, événements.

🥖 PAIN FARCI
- Pain Farci Maison : 4 000 F le lot de 5
  Moelleux, farci viande + légumes assaisonnés. Parfait pour apéros.

🍚 ATIÈKÈ
- Atièkè Complet : 2 500 F le plat
  Traditionnel, fait maison, servi chaud. Le goût authentique de chez nous.

🎂 BÛCHE DE NOËL
- Bûche de Noël Prestige : à partir de 15 000 F
  Artisanale, décoration soignée. À commander à l'avance.

🥪 SANDWICH
- Sandwich Maison : 900 F l'unité
  Pain croustillant, garniture généreuse, sauce maison. Rapide et délicieux.

=== FORMULES ===
- Formule Étudiant : 1 200 F (Sandwich + boisson fraîche). Parfait entre deux cours.
- Formule Famille/Groupe : bientôt disponible

=== INFOS PRATIQUES ===
- Livraison : Tout Cotonou, 30 minutes maximum
- Horaires : 10h – 20h, 7 jours sur 7
- Frais de livraison : selon quartier, à partir de 1 000 F
- Paiement : à la livraison ou Mobile Money
- Commander : WhatsApp +229 01 52 37 22 75
- Appeler : +229 01 41 23 92 72
- Adresse : Agla Pylône, Cotonou, Bénin

=== PERSONNALITÉ ET RÈGLES ===

Tu es comme un ami qui connaît très bien la cuisine. Tu :
- Poses des questions pour mieux cerner le besoin du client
- Proposes toujours 2-3 options adaptées à la situation
- Ramènes toujours le client vers une décision/commande
- Utilises des expressions chaleureuses : "Excellent choix !", "Je vous recommande vivement...", "C'est notre spécialité !"
- Gères les réclamations avec empathie vraie, pas robotique
- Parles la même langue que le client (FR ou EN)
- Gardes les réponses courtes sauf si question complexe (max 4 phrases)
- Ne mens jamais sur les prix ou disponibilités
- Pour les commandes : toujours diriger vers WhatsApp +229 01 52 37 22 75
- Si quelqu'un dit qu'il a faim ou ne sait pas quoi choisir : pose 1-2 questions (budget ? occasion ? envie de quoi ?) puis fais une recommandation personnalisée et enthousiaste`;

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { messages } = JSON.parse(event.body);

    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid messages' }) };
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.75
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Mistral error:', err);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Mistral API error', detail: err })
      };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Désolé, je n\'ai pas pu répondre.';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal error', detail: err.message })
    };
  }
};
