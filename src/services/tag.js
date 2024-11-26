const { getPool } = require("../config/db")
const sql = require("mssql");

exports.procurarTagChaveValor = async({chave, valor}) => {
    const pool = await getPool()

    const tag = await pool
    .request()
    .input("Valor", sql.NVarChar(50), valor)
    .input("Chave", sql.NVarChar(50), chave)
    .query(`
      SELECT *
      FROM [dbo].[tbTag]
      WHERE Valor = @Valor
      AND Chave = @Chave;
    `);

    return tag.recordset
}

exports.procurarTagGUIDChave = async ({chave, GUID}) => {
    const pool = await getPool()

    const tag = await pool
    .request()
    .input("GUIDIdentificacao", sql.NVarChar(50), GUID)
    .input("Chave", sql.NVarChar(50), chave)
    .query(`
      SELECT *
      FROM [dbo].[tbTag]
      WHERE GUIDIdentificacao = @GUIDIdentificacao
        AND Chave = @Chave;
    `);

    return tag.recordset[0]
}

exports.atualizarValorTag = async ({GUID, valor, chave}) => {
  const pool = await getPool()

  const tag = await pool
  .request()
  .input("GUIDIdentificacao", sql.NVarChar(50), GUID)
  .input("Chave", sql.NVarChar(50), chave)
  .input("Valor", sql.NVarChar(50), valor) 
  .query(`
    UPDATE [dbo].[tbTag]
    SET Valor = @Valor
    WHERE GUIDIdentificacao = @GUIDIdentificacao
      AND Chave = @Chave;
  `);

  return tag
}