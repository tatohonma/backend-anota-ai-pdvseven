const { getPool } = require("../config/db")
const sql = require("mssql");

exports.criarNovoCliente = async ({
  id,
  name,
  extension,
  phone,
  street,
  number,
  complement,
  district,
  city,
  postalCode,
  formattedAddress,
  state
  // documento ❌ não existe no JSON da Keeta
}) => {

  const pool = await getPool()

  const result = await pool
    .request()
    .input("NomeCompleto", sql.VarChar, name)
    .input("Telefone1DDD", sql.Int, extension)
    .input("Telefone1Numero", sql.Int, phone)
    .input("Endereco", sql.VarChar, street)
    .input("EnderecoNumero", sql.VarChar, number)
    .input("Complemento", sql.VarChar, complement)
    .input("Bairro", sql.VarChar, district)
    .input("Cidade", sql.VarChar, city)
    .input("IDEstado", sql.Int, state)
    .input("CEP", sql.Int, postalCode ? parseInt(postalCode, 10) : null)
    .input("EnderecoReferencia", sql.VarChar, formattedAddress)
    .input("GUIDIdentificacao", sql.VarChar, guid)
    .input("Documento1", sql.VarChar, null) // não existe no JSON
    .input("Bloqueado", sql.Bit, 0)
    .query(`
        INSERT INTO tbCliente 
          (NomeCompleto, Documento1, Telefone1DDD, Telefone1Numero, Endereco, EnderecoNumero, Complemento, Bairro, Cidade, IDEstado, CEP, EnderecoReferencia, GUIDIdentificacao, Bloqueado, DtInclusao) 
        OUTPUT INSERTED.IDCliente
        VALUES 
          (@NomeCompleto, @Documento1, @Telefone1DDD, @Telefone1Numero, @Endereco, @EnderecoNumero, @Complemento, @Bairro, @Cidade, @IDEstado, @CEP, @EnderecoReferencia, @GUIDIdentificacao, @Bloqueado, GETDATE())
      `);

  return result.recordset[0];
}


exports.atualizarCliente = async ({
  name,
  extension,
  phone,
  street,
  number,
  complement,
  district,
  city,
  state,
  postalCode,
  formattedAddress,
  idCliente
  // documento ❌ não existe no JSON
}) => {

  const pool = await getPool()

  const result = await pool
    .request()
    .input("NomeCompleto", sql.VarChar, name)
    .input("Telefone1DDD", sql.Int, extension)
    .input("Telefone1Numero", sql.Int, phone)
    .input("Endereco", sql.VarChar, street)
    .input("EnderecoNumero", sql.VarChar, number)
    .input("Complemento", sql.VarChar, complement)
    .input("Bairro", sql.VarChar, district)
    .input("Cidade", sql.VarChar, city)
    .input("IDEstado", sql.Int, state)
    .input("CEP", sql.Int, postalCode ? parseInt(postalCode, 10) : null)
    .input("EnderecoReferencia", sql.VarChar, formattedAddress)
    .input("Documento1", sql.VarChar, null) // ❌ não existe
    .input("IDCliente", sql.Int, idCliente)
    .query(`
      UPDATE tbCliente SET 
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

  return result
}


exports.buscarClientePorGUID = async ({ id }) => {

  const pool = await getPool()

  const result = await pool
    .request()
    .input("GUIDIdentificacao", sql.NVarChar(50), id)
    .query(`
      SELECT *
      FROM [dbo].[tbCliente]
      WHERE GUIDIdentificacao = @GUIDIdentificacao;
    `);

  return result.recordset[0]
}