const { getPool } = require("../config/db")
const sql = require("mssql");

exports.criarNovoCliente = async({guid, nomeCompleto, ddd, telefone, nomeRua, numeroRua, complemento, bairro, cidade, cep, enderecoDeReferenia, idEstado, documento }) => {
    const pool = await getPool()

    const result = await pool
    .request()
    .input("NomeCompleto", sql.VarChar, nomeCompleto)
    .input("Telefone1DDD", sql.Int, ddd)
    .input("Telefone1Numero", sql.Int, telefone)
    .input("Endereco", sql.VarChar, nomeRua)
    .input("EnderecoNumero", sql.VarChar, numeroRua)
    .input("Complemento", sql.VarChar, complemento)
    .input("Bairro", sql.VarChar, bairro)
    .input("Cidade", sql.VarChar, cidade)
    .input("IDEstado", sql.Int, idEstado)
    .input("CEP", sql.Int, cep)
    .input("EnderecoReferencia", sql.VarChar, enderecoDeReferenia)
    .input("GUIDIdentificacao", sql.VarChar, guid)
    .input("Documento1", documento)
    .input("Bloqueado", sql.Bit, 0).query(`
        INSERT INTO tbCliente 
          (NomeCompleto, Documento1, Telefone1DDD, Telefone1Numero, Endereco, EnderecoNumero, Complemento, Bairro, Cidade, IDEstado, CEP, EnderecoReferencia, GUIDIdentificacao, Bloqueado, DtInclusao) 
        OUTPUT INSERTED.IDCliente
        VALUES 
          (@NomeCompleto, @Documento1, @Telefone1DDD, @Telefone1Numero, @Endereco, @EnderecoNumero, @Complemento, @Bairro, @Cidade, @IDEstado, @CEP, @EnderecoReferencia, @GUIDIdentificacao, @Bloqueado, GETDATE())
      `);      

  return result.recordset[0] ;
}


exports.atualizarCliente = async ({ddd, telefone, documento, nomeRua, numeroRua, complemento, bairro, cidade, idEstado, cep, enderecoDeReferenia, idCliente}) => {
 const pool = await getPool()
 
  const result =  await pool
 .request()
 .input("Endereco", sql.VarChar, nomeRua)
 .input("EnderecoNumero", sql.VarChar, numeroRua)
 .input("Complemento", sql.VarChar, complemento)
 .input("Bairro", sql.VarChar, bairro)
 .input("Cidade", sql.VarChar, cidade)
 .input("IDEstado", sql.Int, idEstado)
 .input("CEP", sql.Int, cep)
 .input("EnderecoReferencia", sql.VarChar, enderecoDeReferenia)
 .input("Documento1", documento)
 .input("Telefone1DDD", sql.Int, ddd)
 .input("Telefone1Numero", sql.Int, telefone)
 .input("IDCliente", sql.Int, idCliente).query(`UPDATE tbCliente SET 
   Endereco = @Endereco,
   Telefone1DDD = @Telefone1DDD, 
   Telefone1Numero = Telefone1Numero,
   EnderecoNumero = @EnderecoNumero, 
   Documento1 = @Documento1,
   Complemento = @Complemento, 
   Bairro = @Bairro, 
   Cidade = @Cidade, 
   IDEstado = @IDEstado,
   CEP = @CEP, 
   EnderecoReferencia = @EnderecoReferencia 
   WHERE IDCliente = @IDCliente`);

  return result
}

exports.buscarClientePorGUID = async ({ guid }) => {
  const pool = await getPool()

  const result = await pool
  .request()
  .input("GUIDIdentificacao", sql.NVarChar(50), guid)
  .query(`
    SELECT *
    FROM [dbo].[tbCliente]
    WHERE GUIDIdentificacao = @GUIDIdentificacao;
  `);
  
  return result.recordset[0]
}