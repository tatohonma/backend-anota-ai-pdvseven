const { getPool } = require("../config/db")
const sql = require("mssql");

exports.buscarIdEstado = async ({ estado }) => {
    const pool = await getPool()

    const result = await pool
    .request()
    .input("Sigla", sql.VarChar, estado)
    .query(`SELECT IDEstado FROM tbEstado WHERE Sigla = @Sigla`);

    return result.recordset[0].IDEstado
}