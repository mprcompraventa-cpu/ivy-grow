const { MercadoPagoConfig, Preference } = require('mercadopago');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      console.error('MP_ACCESS_TOKEN no configurado');
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Token no configurado' })
      };
    }

    const { items, payer } = JSON.parse(event.body);

    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: items.map(item => ({
          id: 'ivy-' + item.color.toLowerCase(),
          title: 'Ivy Smart Planter ' + item.color,
          description: 'Maceta inteligente con sensores IA y autorriego',
          quantity: Number(item.qty),
          unit_price: Number(item.price),
          currency_id: 'CLP'
        })),
        payer: {
          name: payer.nombre || '',
          email: payer.email || ''
        },
        back_urls: {
          success: 'https://ivygrow.cl?pago=exitoso',
          failure: 'https://ivygrow.cl?pago=fallido',
          pending: 'https://ivygrow.cl?pago=pendiente'
        },
        auto_return: 'approved',
        statement_descriptor: 'IVY GROW',
        external_reference: 'IVY-' + Date.now()
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: result.init_point, id: result.id })
    };

  } catch (error) {
    console.error('Error MP:', error.message, JSON.stringify(error.cause || {}));
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Error al crear el pago',
        detail: error.message || 'Error desconocido'
      })
    };
  }
};
