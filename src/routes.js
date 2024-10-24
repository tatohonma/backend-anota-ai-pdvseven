const express = require('express');
const router = express.Router();
const { importarPedidos } = require('./controllers');

router.post('/importar', importarPedidos);

module.exports = router;
