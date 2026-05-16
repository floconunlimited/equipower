const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let priceId, quantity;
  try {
    ({ priceId, quantity = 1 } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!priceId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing priceId' }) };
  }

  try {
    const origin = event.headers.origin || 'https://equipower.fr';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity }],
      success_url: `${origin}/merci-commande.html`,
      cancel_url: `${origin}/brosse-mue.html`,
      shipping_address_collection: {
        allowed_countries: ['FR', 'BE', 'CH', 'LU'],
      },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
