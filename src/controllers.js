const axios = require('axios');
const { inserirPedidoNoPDVSeven } = require('./models');

const importarPedidos = async (req, res) => {
  processarPedidosImportacao();

  res.status(200).json({ message: 'Pedidos sendo processados...' });
};

const processarPedidosImportacao = async () => {
  // console.log("processarPedidosImportacao");
  try {
    const url = 'https://api-parceiros.anota.ai/partnerauth/ping/list?excludeIfood=1&groupOrdersByTable=1';
    const response = await axios.get(url, {
      headers: { Authorization: process.env.ANOTA_AI_TOKEN }
    });

    const pedidos = response.data.info.docs;

    for (const pedido of pedidos) {
      if (pedido.check === 0) {
        const pedidoDetalhesUrl = `https://api-parceiros.anota.ai/partnerauth/ping/get/${pedido._id}`;
        const detalhesResponse = await axios.get(pedidoDetalhesUrl, {
          headers: { Authorization: process.env.ANOTA_AI_TOKEN }
        });

        const pedidoCompleto = detalhesResponse.data.info;
        // console.log("inserirPedido")
        inserirPedidoNoPDVSeven(pedidoCompleto);
      }
    }
  } catch (error) {
    console.error('Erro ao importar pedidos:', error);
  }
}

module.exports = { importarPedidos };
