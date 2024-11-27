const sql = require("mssql");
const { v4: uuidv4 } = require("uuid");
const { getPool } = require("./config/db");
const { getConfiguracoes } = require("./config/pdv7");
const {anotaaiApi} = require("./config/axios")
const {obterMotivoCancelamento} = require("./services/motivoCancelamento")

const {procurarTagGUIDChave, atualizarValorTag} = require("./services/tag")

const {atualizarStatusPedido} = require("./services/pedido");

let config = {};

const inserirPedidoNoPDVSeven = async (pedido) => {
  console.log("Adicionar pedido", pedido._id);

  try {
    config = getConfiguracoes();

    const idCliente = await adicionarCliente(pedido);
    const  {insertedId, guid } = await adicionarPedido(pedido, idCliente);
    adicionarTags(pedido, guid)
    adicionarProdutos(pedido, insertedId);
    const pagamentos = await adicionarPagamentos(pedido, insertedId);

    const ticket = formatarTicket(pedido, pedido.customer, pagamentos);
    // salvar o ticket em tbPedido.observacoes
    const pool = await getPool();
    await pool
      .request()
      .input("IDPedido", sql.Int, insertedId)
      .input("Observacoes", sql.NVarChar(sql.MAX), ticket)
      .query(`UPDATE tbPedido SET Observacoes = @Observacoes WHERE IDPedido = @IDPedido`);

    console.log("");
    console.log("------------------------------------------");
    console.log(ticket);
    console.log("------------------------------------------");
  } catch (error) {
    console.error("Erro ao inserir pedido:", error);
  }
};

const adicionarCliente = async (pedido) => {
  const pool = await getPool();

  const ddd = pedido.customer.phone.substring(0, 2);
  const telefone = pedido.customer.phone.substring(2);
  const guid = uuidv4();

  const resultCliente = await pool
    .request()
    .query(
      `SELECT IDCliente FROM tbCliente WHERE Telefone1DDD=${ddd} AND Telefone1Numero=${telefone}`
    );

  let idEstado = null;
  const resultEstado = await pool
    .request()
    .input("Sigla", sql.VarChar, pedido.deliveryAddress.state)
    .query(`SELECT IDEstado FROM tbEstado WHERE Sigla = @Sigla`);

  if (resultEstado.recordset.length > 0) {
    idEstado = resultEstado.recordset[0].IDEstado;
  } else {
    throw new Error(`Estado não encontrado para a sigla: ${pedido.deliveryAddress.state}`);
  }

  if (resultCliente.recordset.length > 0) {
    const idCliente = resultCliente.recordset[0].IDCliente;

    await pool
      .request()
      .input("Endereco", sql.VarChar, pedido.customer.streetName)
      .input("EnderecoNumero", sql.VarChar, pedido.customer.streetNumber)
      .input("Complemento", sql.VarChar, pedido.customer.complement)
      .input("Bairro", sql.VarChar, pedido.customer.neighborhood)
      .input("Cidade", sql.VarChar, pedido.customer.city)
      .input("IDEstado", sql.Int, idEstado)
      .input("CEP", sql.Int, pedido.customer.postalCode)
      .input("EnderecoReferencia", sql.VarChar, pedido.customer.reference)
      .input("IDCliente", sql.Int, idCliente).query(`UPDATE tbCliente SET 
        Endereco = @Endereco, 
        EnderecoNumero = @EnderecoNumero, 
        Complemento = @Complemento, 
        Bairro = @Bairro, 
        Cidade = @Cidade, 
        IDEstado = @IDEstado,
        CEP = @CEP, 
        EnderecoReferencia = @EnderecoReferencia 
        WHERE IDCliente = @IDCliente`);

    return idCliente;
  }

  const result = await pool
    .request()
    .input("NomeCompleto", sql.VarChar, pedido.customer.name)
    .input("Telefone1DDD", sql.Int, ddd)
    .input("Telefone1Numero", sql.Int, telefone)
    .input("Endereco", sql.VarChar, pedido.customer.streetName)
    .input("EnderecoNumero", sql.VarChar, pedido.customer.streetNumber)
    .input("Complemento", sql.VarChar, pedido.customer.complement)
    .input("Bairro", sql.VarChar, pedido.customer.neighborhood)
    .input("Cidade", sql.VarChar, pedido.customer.city)
    .input("IDEstado", sql.Int, idEstado)
    .input("CEP", sql.Int, pedido.customer.postalCode)
    .input("EnderecoReferencia", sql.VarChar, pedido.customer.reference)
    .input("GUIDIdentificacao", sql.VarChar, guid)
    .input("Bloqueado", sql.Bit, 0).query(`
        INSERT INTO tbCliente 
          (NomeCompleto, Telefone1DDD, Telefone1Numero, Endereco, EnderecoNumero, Complemento, Bairro, Cidade, IDEstado, CEP, EnderecoReferencia, GUIDIdentificacao, Bloqueado, DtInclusao) 
        OUTPUT INSERTED.IDCliente
        VALUES 
          (@NomeCompleto, @Telefone1DDD, @Telefone1Numero, @Endereco, @EnderecoNumero, @Complemento, @Bairro, @Cidade, @IDEstado, @CEP, @EnderecoReferencia, @GUIDIdentificacao, @Bloqueado, GETDATE())
      `);

  const insertedId = result.recordset[0].IDCliente;
  return insertedId;
};

const adicionarPedido = async (pedido, idCliente) => {
  const pool = await getPool();

  const idTipoDesconto = config.tipoDesconto.IDTipoDesconto;
  const idTaxaEntrega = config.taxaEntrega.IDTaxaEntrega;
  const idOrigemPedido = config.origemPedido.IDOrigemPedido;
  const idEntregador = config.entregador.IDEntregador;

  const valorDesconto = pedido.discounts.reduce((acc, cur) => {
    return acc + cur?.amount;
  }, 0)

  const observacoes = ""; 
  const aplicarDesconto = valorDesconto > 0 ? 1 : 0;
  const observacaoCupom = "";
  const taxaServicoPadrao = 0;

  const guid =  uuidv4()

  const result = await pool
    .request()
    .input("IDCliente", sql.Int, idCliente)
    .input("IDTipoPedido", sql.Int, 30)
    .input("IDStatusPedido", sql.Int, 60)
    .input("IDTipoDesconto", sql.Int, idTipoDesconto)
    .input("IDTaxaEntrega", sql.Int, idTaxaEntrega)
    .input("GUIDIdentificacao", sql.NVarChar(50),guid)
    .input("GUIDMovimentacao", sql.NVarChar(50), uuidv4())
    .input("ValorDesconto", sql.Decimal(18, 2), valorDesconto)
    .input("ValorTotal", sql.Decimal(18, 2), pedido.total)
    .input("Observacoes", sql.NVarChar(sql.MAX), observacoes)
    .input("ValorEntrega", sql.Decimal(18, 2), pedido.deliveryFee)
    .input("AplicarDesconto", sql.Bit, aplicarDesconto)
    .input("ObservacaoCupom", sql.NVarChar(sql.MAX), observacaoCupom)
    .input("IDOrigemPedido", sql.Int, idOrigemPedido)
    .input("PermitirAlterar", sql.Bit, 0)
    .input("TaxaServicoPadrao", sql.Int, taxaServicoPadrao)
    .input("IDEntregador", sql.Int, idEntregador).query(`
          INSERT INTO [dbo].[tbPedido]
              ([IDCliente], [IDTipoPedido], [IDStatusPedido], [IDTipoDesconto], [IDTaxaEntrega], [GUIDIdentificacao], [GUIDMovimentacao], [DtPedido], [ValorDesconto], [ValorTotal], [Observacoes], [ValorEntrega], [AplicarDesconto], [ObservacaoCupom], [IDOrigemPedido], [PermitirAlterar], [IDEntregador], [TaxaServicoPadrao])
          OUTPUT INSERTED.IDPedido
          VALUES
              (@IDCliente, @IDTipoPedido, @IDStatusPedido, @IDTipoDesconto, @IDTaxaEntrega, @GUIDIdentificacao, @GUIDMovimentacao, GetDate(), @ValorDesconto, @ValorTotal, @Observacoes, @ValorEntrega, @AplicarDesconto, @ObservacaoCupom, @IDOrigemPedido, @PermitirAlterar, @IDEntregador, @TaxaServicoPadrao)
      `);

  const insertedId = result.recordset[0].IDPedido;
  return {insertedId, guid };
};

const adicionarProdutos = async (pedido, idPedido) => {
  const pool = await getPool();

  for (const item of pedido.items) {
    const produto = await carregarProduto(item);
    const idPedidoProduto = await adicionarPedidoProduto(idPedido, produto, null, item);
    for (const subItem of item.subItems) {
      const produto = await carregarProduto(subItem);
      await adicionarPedidoProduto(idPedido, produto, idPedidoProduto, subItem);
    }
  }
};

const carregarProduto = async (item) => {
  let produto = {};

  if (item.externalId) {
    produto.idProduto = item.externalId;
  } else {
    produto.idProduto = 1;
    produto.observacao = `não cadastrado: ${item.name}`;
  }

  return produto;
};

const adicionarPedidoProduto = async (idPedido, produto, idPedidoProdutoPai, item) => {
  const pool = await getPool();

  const idPDV = 13;
  const idUsuario = 1;

  let notas = "";
  if (produto.observacao) notas = produto.observacao;
  if (item.observation) notas = notas + " " + item.observation;

  const result = await pool
    .request()
    .input("IDPedido", sql.Int, idPedido)
    .input("IDProduto", sql.Int, produto.idProduto)
    .input("IDPedidoProduto_pai", sql.Int, idPedidoProdutoPai)
    .input("IDPDV", sql.Int, idPDV)
    .input("IDUsuario", sql.Int, idUsuario)
    .input("Quantidade", sql.Decimal(18, 3), item.quantity)
    .input("ValorUnitario", sql.Decimal(18, 2), item.price)
    .input("Notas", sql.NVarChar(sql.MAX), notas)
    .input("Cancelado", sql.Bit, 0)
    .input("RetornarAoEstoque", sql.Bit, 0).query(`
          INSERT INTO tbPedidoProduto
              (IDPedido, IDProduto, IDPedidoProduto_pai, IDPDV, IDUsuario, Quantidade, ValorUnitario, Notas, DtInclusao, Cancelado, RetornarAoEstoque)
              OUTPUT INSERTED.IDPedidoProduto
          VALUES
              (@IDPedido, @IDProduto, @IDPedidoProduto_pai, @IDPDV, @IDUsuario, @Quantidade, @ValorUnitario, @Notas, getDate(), @Cancelado, @RetornarAoEstoque)
      `);
};

const carregarTipoPagamento = async (pagamento) => {
  if (pagamento.prepaid) return config.tipoPagamento.anotaai;

  switch (pagamento.name) {
    case "money":
      return config.tipoPagamento.dinheiro;
    case "card":
      return config.tipoPagamento.credito;
    case "debit_card":
      return config.tipoPagamento.debito;
    case "pix":
      return config.tipoPagamento.pix;
    default:
      return config.tipoPagamento.outros;
  }
};

const adicionarPedidoPagamento = async (idPedido, tipoPagamento, pagamento) => {
  const pool = await getPool();

  const idGateway = tipoPagamento.IDGateway === 0 ? null : tipoPagamento.IDGateway;

  const result = await pool
    .request()
    .input("IDPedido", sql.Int, idPedido)
    .input("IDTipoPagamento", sql.Int, tipoPagamento.IDTipoPagamento)
    .input("IDUsuarioPagamento", sql.Int, config.usuario.IDUsuario)
    .input("Valor", sql.Decimal(18, 2), pagamento.value)
    .input("Excluido", sql.Bit, 0)
    .input("IDGateway", idGateway)
    .input("DataPagamento", sql.DateTime, new Date()).query(`
      INSERT INTO tbPedidoPagamento
        (IDPedido, IDTipoPagamento, IDUsuarioPagamento, Valor, Excluido, IDGateway, DataPagamento)
      VALUES
        (@IDPedido, @IDTipoPagamento, @IDUsuarioPagamento, @Valor, @Excluido, @IDGateway, @DataPagamento)
    `);

  return {
    name: tipoPagamento.Nome,
    value: parseFloat(pagamento.value),
  };
};

const adicionarPagamentos = async (pedido, idPedido) => {
  const pool = await getPool();
  const pagamentos = [];

  for (const pagamento of pedido.payments) {
    const tipoPagamento = await carregarTipoPagamento(pagamento);
    const pagamentoInfo = await adicionarPedidoPagamento(idPedido, tipoPagamento, pagamento);
    pagamentos.push(pagamentoInfo);
  }

  return pagamentos;
};

const formatarTicket = (pedido, cliente, pagamentos) => {
  let ticket = ` *** Anota-ai #${pedido.shortReference} ***\r\n`;
  ticket += `Data do Pedido: ${new Date(pedido.createdAt).toLocaleString()}\r\n`;
  ticket += `Cliente: ${cliente.name}\r\n`;
  ticket += `Telefone: (${cliente.phone.substring(0, 2)}) ${cliente.phone.substring(2)}\r\n`;
  ticket += `Endereço: ${pedido.deliveryAddress.formattedAddress}\r\n`;
  ticket += `Cidade: ${pedido.deliveryAddress.city} - ${pedido.deliveryAddress.state}\r\n`;
  ticket += `CEP: ${pedido.deliveryAddress.postalCode}\r\n`;
  ticket += `Referência: ${pedido.deliveryAddress.reference}\r\n`;
  ticket += `Complemento: ${pedido.deliveryAddress.complement}\r\n\r\n`;

  ticket += `Itens:\r\n`;
  pedido.items.forEach((item) => {
    ticket += `  - ${item.name} (x${item.quantity}): R$ ${item.price.toFixed(2)}\r\n`;
    if (item.observation) ticket += `    Observações: ${item.observation}\r\n`;
  });

  ticket += `\r\nDescontos:\r\n`;
  pedido.discounts.forEach((discount) => {
    ticket += `  - ${discount.tag}: R$ ${discount.amount.toFixed(2)}\r\n`;
  });
  ticket += `\r\nTaxa de Entrega: R$ ${pedido.deliveryFee.toFixed(2)}\r\n`;

  ticket += `\r\nPagamentos:\r\n`;
  pagamentos.forEach((pagamento) => {
    const valor = parseFloat(pagamento.value);
    ticket += `  - ${pagamento.name}: R$ ${valor.toFixed(2)}\r\n`;
  });

  ticket += `\r\nTotal: R$ ${pedido.total.toFixed(2)}\r\n`;

  return ticket;
};

const adicionarTags = async (info, guid) => {
  const pool = await getPool();
  const DtInclusao = new Date()

  const tags = [
    { chave: 'anotaai-customerId', valor: info.customer.id },
    { chave: 'anotaai-_orderId', valor: info._id },
    { chave: 'anotaai-shortReference', valor: info.shortReference },
    { chave: 'anotaai-Type', valor: info.type },
    { chave: 'anotaai-status', valor: info.check },
  ];

  for (const tag of tags) {
    await pool.request()
    .input("GUIDIdentificacao",  sql.VarChar, guid)
    .input('Chave', sql.NVarChar, tag.chave)
    .input('Valor', sql.NVarChar, tag.valor.toString())
    .input('DtInclusao', sql.DateTime, DtInclusao)
    .query(`
        INSERT INTO tbTag (GUIDIdentificacao, Chave, Valor, DtInclusao)
        VALUES (@GUIDIdentificacao, @Chave, @Valor, @DtInclusao)
    `);
  }

  console.log('Tags adicionadas com sucesso.');
  
  return guid
}

const sincronisarStatus = async ({ pedido }) => {
  try {
    const statusAnotaai = {
      "em-producao": 1,
      "pronto": 2,
      "finalizado": 3,
      "cancelado-negado": [4, 5],
      "em-analise": 0,
      "agendado": -2
    }
  
    const statusPdv = {
      "aberto": 10,
      "enviado": 20,
      "finalizado": 40,
      "cancelado": 50,
      "nao-confirmado": 60,
    }
  
    const statusPdvAnotaaiMap = {
      10: [1],        // Aberto - Em produção
      20: [2],        // Enviado - Pronto
      40: [3],        // Finalizado - Finalizado (Pedido concluido)
      50: [4, 5],     // Cancelado - Negado/Cancelado
      60: [0],        // Não confirmado - Em analise
    }
    
    const anotaaiTagId = await procurarTagGUIDChave({chave: "anotaai-_orderId", GUID: pedido.GUIDIdentificacao})
  
    const detalhesDoPedidoAnotaAi =  await anotaaiApi.get(`/ping/get/${anotaaiTagId.Valor}`);
    const statusPedidoAnotaAi = detalhesDoPedidoAnotaAi.data.info.check
  
    const pedidoAnotaAiNegadoOuCancelado = statusAnotaai["cancelado-negado"].includes(statusPedidoAnotaAi)
    const pedidoPdvCancelado = statusPdv["cancelado"] === pedido.IDStatusPedido
  
    // Atualizando localmente
    if(pedidoAnotaAiNegadoOuCancelado){
      if(!pedidoPdvCancelado){
        console.log("Sincronisando status local pedido", pedido.IDPedido);
          await atualizarValorTag({chave: "anotaai-status", GUID: pedido.GUIDIdentificacao, valor: statusPedidoAnotaAi.toString()}) 
          await atualizarStatusPedido({ GUID: pedido.GUIDIdentificacao, IDStatusPedido: statusPdv["cancelado"] })
        return;
      } 
    }
  
    if(!statusPdvAnotaaiMap[pedido.IDStatusPedido].includes(statusPedidoAnotaAi)){
      console.log("Sincronisando status remoto pedido", pedido.IDPedido);
      if(statusPdv["aberto"] === pedido.IDStatusPedido){
        console.log("confirmando pedido");
        const { data } =  await anotaaiApi.post(`/order/accept/${anotaaiTagId.Valor}`)
        await atualizarValorTag({GUID: pedido.GUIDIdentificacao, chave: "anotaai-status", valor: data.info.check.toString()})
      }
  
      if(statusPdv["cancelado"] === pedido.IDStatusPedido){
        console.log("cancelando pedido");
        const motivo = await obterMotivoCancelamento({IDPedido: pedido.IDPedido})
        const { data } = await anotaaiApi.post(`/order/cancel/${anotaaiTagId.Valor}`, { "justification": motivo?.Nome || "Sem justificativa/Erro ao obter justificativa." })
        await atualizarValorTag({GUID: pedido.GUIDIdentificacao, chave: "anotaai-status", valor: data.info.check.toString()})
      }
  
      if(statusPdv["enviado"] === pedido.IDStatusPedido){
        console.log("enviando pedido");
        const { data } = await anotaaiApi.post(`/order/ready/${anotaaiTagId.Valor}`)
        await atualizarValorTag({GUID: pedido.GUIDIdentificacao, chave: "anotaai-status", valor: data.info.check.toString()})
      }
  
      if(statusPdv["finalizado"] === pedido.IDStatusPedido){
        console.log("finalizando pedido");
        const { data } = await anotaaiApi.post(`/order/finalize/${anotaaiTagId.Valor}`)
        await atualizarValorTag({GUID: pedido.GUIDIdentificacao, chave: "anotaai-status", valor: data.info.check.toString()})
      }
    }
  } catch (error) {
    console.log(error,"Ouve um erro ao sincronizar pedido", pedido.IDPedido);
  }
}



module.exports = { inserirPedidoNoPDVSeven, sincronisarStatus };
