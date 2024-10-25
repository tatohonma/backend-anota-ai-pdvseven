require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const { iniciarConfiguracoes } = require("./config/pdv7");
const { verificarConexao } = require("./config/db");

const app = express();
app.use(express.json());

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Carregar rotas
app.use("/api", require("./routes"));

// Inicializar o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    console.log("Iniciando serviço...");

    await verificarConexao();
    await iniciarConfiguracoes();

    console.log("");
    console.log(`Serviço de integração entre PDV7 e Anota-ai disponível na porta ${PORT}`);
    console.log("");
  } catch (error) {
    console.error("Erro ao iniciar serviço:", error);
  }
});
