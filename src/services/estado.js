const { getPool } = require("../config/db")
const sql = require("mssql");

exports.buscarIdEstado = async ({ estado }) => {
    const pool = await getPool()

    // Se não vier sigla, retorna 25 direto
    if (!estado || estado.trim() === "") {
        return 25;
    }

    const result = await pool
        .request()
        .input("Sigla", sql.VarChar, estado)
        .query(`SELECT IDEstado FROM tbEstado WHERE Sigla = @Sigla`);

    // Se não encontrar nenhum registro ou não houver IDEstado → retorna 25
    if (!result.recordset.length || !result.recordset[0].IDEstado) {
        return 25;
    }

    // Retorno normal
    return result.recordset[0].IDEstado;
}