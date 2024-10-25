const sql = require("mssql");
const { v4: uuidv4 } = require("uuid");
const { getPool } = require("./config/db");
const { getConfiguracoes } = require("./config/pdv7");

// Função para inserir pedidos no SQL Server
const inserirPedidoNoPDVSeven = async (pedido) => {
  // console.log("inserirPedidoNoPDVSeven", pedido)
  try {
    const idCliente = await adicionarCliente(pedido);
    const idPedido = await adicionarPedido(pedido, idCliente);
    adicionarProdutos(pedido, idPedido);
    adicionarPagamentos(pedido, idPedido);
  } catch (error) {
    console.error("Erro ao inserir pedido:", error);
  }
};

const adicionarCliente = async (pedido) => {
  console.log("adicionarCliente");
  // console.log("pedido.customer", pedido.customer);
  // console.log("pedido.deliveryAddress", pedido.deliveryAddress);

  const pool = await getPool();

  const ddd = pedido.customer.phone.substring(0, 2);
  const telefone = pedido.customer.phone.substring(2);
  const guid = uuidv4();

  // Carregar IDEstado da tbEstado onde sigla é pedido.customer.state
  const resultEstado = await pool
    .request()
    .query(`SELECT IDEstado FROM tbEstado WHERE Sigla='${pedido.deliveryAddress.state}'`);

  const idEstado = resultEstado.recordset[0].IDEstado;

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
  console.log("adicionarPedido");
  // console.log("idCliente", idCliente);
  // console.log("pedido", pedido);

  const pool = await getPool();

  const config = getConfiguracoes();

  const idTipoDesconto = config.tipoDesconto.IDTipoDesconto;
  const idTaxaEntrega = config.taxaEntrega.IDTaxaEntrega;
  const idOrigemPedido = config.origemPedido.IDOrigemPedido;
  const idEntregador = config.entregador.IDEntregador;

  const guidIdentificacao = uuidv4();
  const valorDesconto = 0;
  const observacoes = "";
  const aplicarDesconto = 0;
  const observacaoCupom = "";

  const result = await pool
    .request()
    .input("IDCliente", sql.Int, idCliente)
    .input("IDTipoPedido", sql.Int, 30)
    .input("IDStatusPedido", sql.Int, 60)
    .input("IDTipoDesconto", sql.Int, idTipoDesconto)
    .input("IDTaxaEntrega", sql.Int, idTaxaEntrega)
    .input("GUIDIdentificacao", sql.NVarChar(50), guidIdentificacao)
    .input("ValorDesconto", sql.Decimal(18, 2), valorDesconto)
    .input("ValorTotal", sql.Decimal(18, 2), pedido.total)
    .input("Observacoes", sql.NVarChar(sql.MAX), observacoes)
    .input("ValorEntrega", sql.Decimal(18, 2), pedido.deliveryFee)
    .input("AplicarDesconto", sql.Bit, aplicarDesconto)
    .input("ObservacaoCupom", sql.NVarChar(sql.MAX), observacaoCupom)
    .input("IDOrigemPedido", sql.Int, idOrigemPedido)
    .input("PermitirAlterar", sql.Bit, 0)
    .input("IDEntregador", sql.Int, idEntregador)
    .query(`
          INSERT INTO [dbo].[tbPedido]
              ([IDCliente], [IDTipoPedido], [IDStatusPedido], [IDTipoDesconto], [IDTaxaEntrega], [GUIDIdentificacao], [DtPedido], [ValorDesconto], [ValorTotal], [Observacoes], [ValorEntrega], [AplicarDesconto], [ObservacaoCupom], [IDOrigemPedido], [PermitirAlterar], [IDEntregador])
          OUTPUT INSERTED.IDPedido
          VALUES
              (@IDCliente, @IDTipoPedido, @IDStatusPedido, @IDTipoDesconto, @IDTaxaEntrega, @GUIDIdentificacao, GetDate(), @ValorDesconto, @ValorTotal, @Observacoes, @ValorEntrega, @AplicarDesconto, @ObservacaoCupom, @IDOrigemPedido, @PermitirAlterar, @IDEntregador)
      `);

  const insertedId = result.recordset[0].IDPedido;
  console.log("insertedId", insertedId);
  return insertedId;
};

const adicionarProdutos = async (pedido, idPedido) => {
  console.log("adicionarProdutos");
  // console.log("idPedido", idPedido);
  // console.log("pedido", pedido);

  const pool = await getPool();

  for (const item of pedido.items) {
    console.log("item", item.name);
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
  console.log("adicionarPedidoProduto");

  console.log("produto", produto);
  // console.log("idPedido", idPedido);
  // console.log("produto", produto);
  // console.log("item", item);

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

  // console.log(`Inserted ID: ${result.recordset[0].IDPedidoProduto}`);
};

const adicionarPagamentos = async () => {};

module.exports = { inserirPedidoNoPDVSeven };
