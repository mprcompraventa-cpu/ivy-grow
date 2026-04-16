// netlify/functions/create-payment.js
const { MercadoPagoConfig, Preference } = require('mercadopago');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { items, payer } = JSON.parse(event.body);

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN
    });

    const preference = new Preference(client);

    // Construir líneas de items para MP
    const mpItems = items.map(item => ({
      id:          'ivy-smart-planter',
      title:       'Ivy — Maceta Inteligente · ' + item.color,
      quantity:    item.qty,
      unit_price:  item.price,
      currency_id: 'CLP',
      picture_url: item.img || ''
    }));

    // Datos del comprador
    const [firstName, ...lastParts] = (payer.nombre || '').split(' ');
    const lastName = lastParts.join(' ') || '-';

    const result = await preference.create({
      body: {
        items: mpItems,

        payer: {
          name:    firstName,
          surname: lastName,
          email:   payer.email,
          phone: {
            area_code: '+569',
            number:    payer.telefono
          },
          address: {
            street_name: payer.calle,
            city:        payer.ciudad,
            zip_code:    payer.postal || ''
          }
        },

        // Metadatos del pedido — visibles en dashboard MP y en webhooks
        metadata: {
          nombre:    payer.nombre,
          email:     payer.email,
          telefono:  payer.telefono,
          direccion: [payer.calle, payer.depto, payer.ciudad, payer.region]
                       .filter(Boolean).join(', '),
          items:     items.map(i => i.color + ' x' + i.qty).join(', '),
          total_clp: items.reduce((s, i) => s + i.price * i.qty, 0)
        },

        back_urls: {
          success: 'https://ivygrow.cl?pago=exitoso',
          failure: 'https://ivygrow.cl?pago=fallido',
          pending: 'https://ivygrow.cl?pago=pendiente'
        },

        auto_return: 'approved',

        statement_descriptor: 'IVY GROW',

        notification_url: 'https://ivygrow.cl/.netlify/functions/mp-webhook'
      }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: result.init_point })
    };

  } catch (err) {
    console.error('MP Error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
