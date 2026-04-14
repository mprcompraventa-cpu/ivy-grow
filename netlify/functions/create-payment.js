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
    const result = await preference.create({
      body: {
        items: items.map(item => ({
          title: `Ivy Smart Planter - ${item.color}`,
          quantity: item.qty,
          unit_price: item.price,
          currency_id: 'CLP'
        })),
        payer: {
          name: payer.nombre,
          email: payer.email,
          phone: { number: payer.telefono }
        },
        shipments: {
          receiver_address: {
            street_name: payer.calle,
            city_name: payer.ciudad,
            state_name: payer.region,
            country_name: 'Chile'
          }
        },
        back_urls: {
          success: 'https://ivygrow.cl?pago=exitoso',
          failure: 'https://ivygrow.cl?pago=fallido',
          pending: 'https://ivygrow.cl?pago=pendiente'
        },
        auto_return: 'approved',
        statement_descriptor: 'IVY GROW',
        external_reference: Date.now().toString()
      }
    });
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: result.init_point })
    };
  } catch (error) {
    console.error('Error MP:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Error al crear el pago' })
    };
  }
};
