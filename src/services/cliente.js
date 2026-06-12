const { getPool } = require("../config/db");
const sql = require("mssql");

exports.criarNovoCliente = async ({
  bairro,
  cep,
  cidade,
  complemento,
  ddd,
  telefone,
  idEstado,
  nomeCompleto,
  enderecoDeReferenia,
  nomeRua,
  numeroRua,
  guid,
  documento
}) => {

  const pool = await getPool();

  const result = await pool
    .request()
    .input("NomeCompleto", sql.VarChar, nomeCompleto)
    .input("Telefone1DDD", sql.Int, ddd || null)
    .input("Telefone1Numero", sql.VarChar, telefone || null)
    .input("Endereco", sql.VarChar, nomeRua)
    .input("EnderecoNumero", sql.VarChar, numeroRua)
    .input("Complemento", sql.VarChar, complemento)
    .input("Bairro", sql.VarChar, bairro)
    .input("Cidade", sql.VarChar, cidade)
    .input("IDEstado", sql.Int, idEstado)
    .input("CEP", sql.VarChar, cep)
    .input("EnderecoReferencia", sql.VarChar, enderecoDeReferenia)
    .input("GUIDIdentificacao", sql.VarChar(50), guid)
    .input("Documento1", sql.VarChar, documento || null)
    .input("Bloqueado", sql.Bit, 0)
    .query(`
      INSERT INTO tbCliente
      (
        NomeCompleto,
        Documento1,
        Telefone1DDD,
        Telefone1Numero,
        Endereco,
        EnderecoNumero,
        Complemento,
        Bairro,
        Cidade,
        IDEstado,
        CEP,
        EnderecoReferencia,
        GUIDIdentificacao,
        Bloqueado,
        DtInclusao
      )
      OUTPUT INSERTED.IDCliente
      VALUES
      (
        @NomeCompleto,
        @Documento1,
        @Telefone1DDD,
        @Telefone1Numero,
        @Endereco,
        @EnderecoNumero,
        @Complemento,
        @Bairro,
        @Cidade,
        @IDEstado,
        @CEP,
        @EnderecoReferencia,
        @GUIDIdentificacao,
        @Bloqueado,
        GETDATE()
      )
    `);

  return result.recordset[0];
};

exports.atualizarCliente = async ({
  bairro,
  cep,
  cidade,
  complemento,
  enderecoDeReferenia,
  nomeRua,
  numeroRua,
  idCliente,
  idEstado,
  nomeCompleto,
  ddd,
  telefone,
  documento
}) => {

  const pool = await getPool();

  const result = await pool
    .request()
    .input("NomeCompleto", sql.VarChar, nomeCompleto)
    .input("Telefone1DDD", sql.Int, ddd || null)
    .input("Telefone1Numero", sql.VarChar, telefone || null)
    .input("Endereco", sql.VarChar, nomeRua)
    .input("EnderecoNumero", sql.VarChar, numeroRua)
    .input("Complemento", sql.VarChar, complemento)
    .input("Bairro", sql.VarChar, bairro)
    .input("Cidade", sql.VarChar, cidade)
    .input("IDEstado", sql.Int, idEstado)
    .input("CEP", sql.VarChar, cep)
    .input("EnderecoReferencia", sql.VarChar, enderecoDeReferenia)
    .input("Documento1", sql.VarChar, documento || null)
    .input("IDCliente", sql.Int, idCliente)
    .query(`
      UPDATE tbCliente
      SET
        NomeCompleto = @NomeCompleto,
        Telefone1DDD = @Telefone1DDD,
        Telefone1Numero = @Telefone1Numero,
        Endereco = @Endereco,
        EnderecoNumero = @EnderecoNumero,
        Documento1 = @Documento1,
        Complemento = @Complemento,
        Bairro = @Bairro,
        Cidade = @Cidade,
        IDEstado = @IDEstado,
        CEP = @CEP,
        EnderecoReferencia = @EnderecoReferencia
      WHERE IDCliente = @IDCliente
    `);

  return result;
};

exports.buscarClientePorGUID = async ({ guid }) => {

  const pool = await getPool();

  const result = await pool
    .request()
    .input("GUIDIdentificacao", sql.NVarChar(50), guid)
    .query(`
      SELECT *
      FROM tbCliente
      WHERE GUIDIdentificacao = @GUIDIdentificacao
    `);

  return result.recordset[0];
};