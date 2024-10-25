const { getPool } = require("./db");

let configuracoes = {
  usuario: null,
  pdv: null,
  tipoDesconto: null,
  tipoEntrega: null,
  entregador: null,
  formaPagamento: null,
};

const iniciarConfiguracoes = async () => {
  try {
    console.log("Iniciando configurações...");

    const pool = await getPool();

    let origemPedidoResult = await pool
      .request()
      .query(`SELECT * FROM tbOrigemPedido WHERE nome='anota-ai'`);

    if (origemPedidoResult.recordset.length === 0) {
      await pool.request().query(`INSERT INTO tbOrigemPedido (nome) VALUES ('anota-ai')`);
      console.log("  - OrigemPedido adicionada com sucesso.");

      origemPedidoResult = await pool
        .request()
        .query(`SELECT * FROM tbOrigemPedido WHERE nome='anota-ai'`);
    }

    configuracoes.origemPedido = origemPedidoResult.recordset[0];
    console.log("  - OrigemPedido carregada");

    const idPDV = process.env.PDV || 1;
    const pdvResult = await pool.request().query(`SELECT * FROM tbPDV WHERE idPDV=${idPDV}`);

    if (pdvResult.recordset.length === 0)
      throw "Erro ao carregar configurações: PDV não encontrado";

    configuracoes.pdv = pdvResult.recordset[0];
    console.log("  - PDV carregado:", configuracoes.pdv.Nome);

    const senha = process.env.CHAVE_ACESSO || "9933";
    const usuarioResult = await pool
      .request()
      .query(`SELECT * FROM tbUsuario WHERE senha='${senha}'`);

    if (usuarioResult.recordset.length === 0)
      throw "Erro ao carregar configurações: Usuário não encontrado";

    configuracoes.usuario = usuarioResult.recordset[0];
    console.log("  - Usuário carregado:", configuracoes.usuario.Nome);

    const tipoDescontoResult = await pool
      .request()
      .query(`SELECT * FROM tbTipoDesconto WHERE nome='anota-ai'`);

    if (tipoDescontoResult.recordset.length === 0) {
      await pool
        .request()
        .query(`INSERT INTO tbTipoDesconto (nome, ativo, excluido) VALUES ('anota-ai', 1, 0)`);
      console.log("  - TipoDesconto adicionado com sucesso.");
    }

    configuracoes.tipoDesconto = tipoDescontoResult.recordset[0];
    console.log("  - TipoDesconto carregado");

    // Carregar Entregador
    const entregadorResult = await pool
      .request()
      .query(`SELECT * FROM tbEntregador WHERE nome='anota-ai'`);

    if (entregadorResult.recordset.length === 0) {
      await pool
        .request()
        .query(`INSERT INTO tbEntregador (nome, ativo, excluido) VALUES ('anota-ai', 1, 0)`);
      console.log("  - Entregador padrão adicionado com sucesso.");
    }
    configuracoes.entregador = entregadorResult.recordset[0];
    console.log("  - Entregador carregado");

    // Carregar Taxa Entrega
    const taxaEntregaResult = await pool
      .request()
      .query(`SELECT * FROM tbTaxaEntrega WHERE nome='anota-ai'`);

    if (taxaEntregaResult.recordset.length === 0) {
      await pool
        .request()
        .query(
          `INSERT INTO tbTaxaEntrega (nome, valor, ativo, excluido) VALUES ('anota-ai', 0, 1, 0)`
        );
      console.log("  - TaxaEntrega adicionada com sucesso.");
    }
    configuracoes.taxaEntrega = taxaEntregaResult.recordset[0];
    console.log("  - TaxaEntrega carregada");

    // Carregar Forma de Pagamento
    const tipoPagamentoResult = await pool
      .request()
      .query(`SELECT * FROM tbTipoPagamento WHERE nome='anota-ai'`);

    if (tipoPagamentoResult.recordset.length === 0) {
      await pool.request().query(`INSERT INTO tbGateway
        (idGateway, nome) VALUES (6, 'anota-ai')`);

      await pool.request().query(`INSERT INTO tbTipoPagamento 
        (nome, registrarValores, ativo, idMeioPagamentoSAT, idGateway) VALUES 
        ('anota-ai', 0, 1, 10, 6)`);

      console.log("  - TipoPagamento adicionada com sucesso.");
    }
    configuracoes.formaPagamento = tipoPagamentoResult.recordset[0];
    console.log("  - TipoPagamento carregada");

    console.log("Configurações carregadas com sucesso");
  } catch (error) {
    console.error("Erro ao configurar o sistema", error);
    throw "Erro ao configurar o sistema";
  }
};

const getConfiguracoes = () => configuracoes;

module.exports = { iniciarConfiguracoes, getConfiguracoes };
