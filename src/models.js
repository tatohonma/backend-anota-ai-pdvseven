const sql = require('mssql');
const getPool = require('./config/db');

// Função para inserir pedidos no SQL Server
const inserirPedidoNoPDVSeven = async (pedido) => {
  // console.log("inserirPedidoNoPDVSeven", pedido)
  try {
    adicionarCliente(pedido);
    adicionarPedido(pedido);
    adicionarProdutos(pedido);
    adicionarPagamentos(pedido);

  } catch (error) {
    console.error('Erro ao inserir pedido:', error);
  }
};

const adicionarCliente = async (pedido) => {
  console.log("adicionarCliente");
  console.log("pedido.customer", pedido.customer);
  console.log("pedido.deliveryAddress", pedido.deliveryAddress);

  const pool = await getPool();

  const ddd = "";
  const telefone = "";
  const idEstado = 0;
  const guid = "xxxx";

  await pool.request()
    .input('NomeCompleto', sql.VarChar, pedido.customer.name)
    .input('Telefone1DDD', sql.VarChar, ddd)
    .input('Telefone1Numero', sql.VarChar, telefone)
    .input('Endereco', sql.VarChar, pedido.customer.streetName)
    .input('EnderecoNumero', sql.VarChar, pedido.customer.streetNumber)
    .input('Complemento', sql.VarChar, pedido.customer.complement)
    .input('Bairro', sql.VarChar, pedido.customer.neighborhood)
    .input('Cidade', sql.VarChar, pedido.customer.city)
    .input('IDEstado', sql.VarChar, idEstado)
    .input('CEP', sql.VarChar, pedido.customer.postalCode)
    .input('EnderecoReferencia', sql.VarChar, pedido.customer.reference)
    .input('GUIDIdentificacao', sql.VarChar, guid)
    .query(`
      INSERT INTO tbCliente 
        (NomeCompleto, Telefone1DDD, Telefone1Numero, Endereco, EnderecoNumero, Complemento, Bairro, Cidade, IDEstado, CEP, EnderecoReferencia, GUIDIdentificacao) 
        VALUES 
        (@NomeCompleto, @Telefone1DDD, @Telefone1Numero, @Endereco, @EnderecoNumero, @Complemento, @Bairro, @Cidade, @IDEstado, @CEP, @EnderecoReferencia, @GUIDIdentificacao)
      `);



  // console.log('Pedido inserido no SQL Server');
}

const adicionarPedido = async () => {
  // const pool = await getPool();

  // // Substitua os campos pelos campos corretos da sua tabela SQL
  // await pool.request()
  //   .input('pedidoId', @sql.VarChar, pedido._id)
  //   .input('clienteNome', sql.VarChar, pedido.customer.name)
  //   .input('clienteTelefone', sql.VarChar, pedido.customer.phone)
  //   .input('valorTotal', sql.Decimal, pedido.total)
  //   .query('INSERT INTO tbPedido (Id, ClienteNome, ClienteTelefone, ValorTotal) VALUES (@pedidoId, @clienteNome, @clienteTelefone, @valorTotal)');

  // console.log('Pedido inserido no SQL Server');
}

const adicionarProdutos = async () => {

}

const adicionarPagamentos = async () => {

}

module.exports = { inserirPedidoNoPDVSeven };
