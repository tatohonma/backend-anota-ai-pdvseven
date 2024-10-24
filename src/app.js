const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json()); // Para que o express entenda requisições JSON

// Carregar rotas
app.use('/api', require('./routes'));

// Inicializar o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
